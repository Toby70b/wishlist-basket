import json
from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse
import pytest
import requests
import responses

from handler import lambda_handler
from tests.conftest import STEAM_WISHLIST_URL
from tests.data import WISHLIST_DISCOUNTED_ITEM, WISHLIST_COMING_SOON_ITEM, WISHLIST_EMPTY, VALID_QUERY_PARAMS, \
    VALID_PAYLOAD


@pytest.fixture
def lambda_context():
    return SimpleNamespace(aws_request_id="test-request-id")


@pytest.fixture
def http():
    with responses.RequestsMock(assert_all_requests_are_fired=False) as rsps:
        yield rsps


def event(query_params: dict | None) -> dict:
    return {"queryStringParameters": query_params}


@pytest.fixture
def valid_response() -> str:
    return '{"response":{"items":[]}}'


class TestHandler:

    @pytest.mark.parametrize(
        "query_params, expected_message",
        [
            pytest.param(None, "missing 'input_json' query param", id="no params"),
            pytest.param({"input_json": "not json"}, "Invalid JSON", id="malformed json"),
            pytest.param({"input_json": '{"context":{"language":"english","country_code":"GB"},"page_size":1000}'},
                         "steamid: Field required", id="missing field"),
        ],
    )
    def test_returns_400_on_invalid_input(self, http, lambda_context, query_params, expected_message):
        result = lambda_handler(event(query_params), lambda_context)

        assert result["statusCode"] == 400
        assert result["headers"]["Content-Type"] == "application/json"
        assert expected_message in json.loads(result["body"])["error_message"]
        # assert nothing sent downstream
        assert len(http.calls) == 0

    def test_missing_env_var_returns_500(self, env, http, valid_query_params, lambda_context, monkeypatch):
        monkeypatch.delenv("STEAM_API_BASE_URL")
        result = lambda_handler(event(valid_query_params), lambda_context)

        assert result["statusCode"] == 500
        assert json.loads(result["body"])["error_message"] == "unexpected error occurred"
        assert len(http.calls) == 0

    @pytest.mark.parametrize(
        "exception",
        [
            pytest.param(requests.exceptions.ReadTimeout(), id="read timeout"),
            pytest.param(requests.exceptions.ConnectTimeout(), id="connect timeout"),
        ],
    )
    def test_timeout_returns_504(self, http, lambda_context, valid_query_params, exception):
        http.get(STEAM_WISHLIST_URL, body=exception)
        result = lambda_handler(event(valid_query_params), lambda_context)
        assert result["statusCode"] == 504
        assert json.loads(result["body"])["error_message"] == "Steam Wishlist API timed out"

    @pytest.mark.parametrize(
        "exception",
        [
            pytest.param(requests.exceptions.ConnectionError(), id="connection error"),
            pytest.param(requests.exceptions.SSLError(), id="ssl error"),
        ],
    )
    def test_request_error_returns_502(self, http, valid_query_params, lambda_context, exception):
        http.get(STEAM_WISHLIST_URL, body=exception)
        result = lambda_handler(event(valid_query_params), lambda_context)
        assert result["statusCode"] == 502
        assert json.loads(result["body"])["error_message"] == "Steam Wishlist API unavailable"

    def test_invokes_downstream_api_with_correct_headers_and_query_params(self, http, valid_response,
                                                                          valid_query_params, lambda_context):
        http.get(STEAM_WISHLIST_URL, valid_response)
        result = lambda_handler(event(valid_query_params), lambda_context)
        assert result["statusCode"] == 200

        assert (len(http.calls) == 1)
        request = http.calls[0].request

        assert urlparse(request.url).path == urlparse(STEAM_WISHLIST_URL).path
        params = parse_qs(urlparse(request.url).query)
        assert json.loads(params["input_json"][0]) == VALID_PAYLOAD
        assert request.headers["Accept"] == "application/json"

    @pytest.mark.parametrize(
        "steam_body, status_code",
        [
            pytest.param(WISHLIST_DISCOUNTED_ITEM, 200, id="discounted item with £"),
            pytest.param(WISHLIST_COMING_SOON_ITEM, 200, id="coming soon, no price"),
            pytest.param(WISHLIST_EMPTY, 200, id="empty wishlist"),
            pytest.param('{"error_message": "unexpected error occurred}"', 500, id="500 error"),
            pytest.param('{"error_message": "invalid user}"', 400, id="400 error"),
        ],
    )
    def test_passes_steam_response_through_unmodified(self, http, lambda_context, valid_query_params, steam_body, status_code):
        http.get(
            STEAM_WISHLIST_URL,
            body=steam_body,
            status=status_code,
            content_type="application/json; charset=utf-8",
        )

        result = lambda_handler(event(valid_query_params), lambda_context)

        assert result["statusCode"] == status_code
        assert result["body"] == steam_body

    def test_does_not_forward_downstream_headers(self, http, lambda_context, valid_query_params):
        http.get(
            STEAM_WISHLIST_URL,
            body=WISHLIST_EMPTY,
            status=200,
            content_type="application/json; charset=utf-8",
            headers={
                "Set-Cookie": "steamCountry=GB%7Cabc123; path=/",
                "Cache-Control": "public, max-age=60",
                "X-Internal-Trace": "abc-123",
            },
        )

        result = lambda_handler(event(valid_query_params), lambda_context)

        assert result["headers"] == {"Content-Type": "application/json"}

    @pytest.mark.parametrize(
        "query_params, mock_kwargs, expected_status",
        [
            pytest.param(VALID_QUERY_PARAMS, {"body": WISHLIST_EMPTY, "status": 200}, 200, id="success"),
            pytest.param(VALID_QUERY_PARAMS, {"body": "{}", "status": 500}, 500, id="steam error"),
            pytest.param(None, None, 400, id="bad request"),
            pytest.param(VALID_QUERY_PARAMS, {"body": requests.exceptions.ReadTimeout()}, 504, id="timeout"),
            pytest.param(VALID_QUERY_PARAMS, {"body": requests.exceptions.ConnectionError()}, 502, id="unavailable"),
        ],
    )
    def test_every_response_is_json(self, http, lambda_context, query_params, mock_kwargs, expected_status):
        if mock_kwargs is not None:
            http.get(STEAM_WISHLIST_URL, **mock_kwargs)

        result = lambda_handler(event(query_params), lambda_context)

        assert result["statusCode"] == expected_status
        assert result["headers"] == {"Content-Type": "application/json"}
