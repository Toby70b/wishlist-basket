import json
from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse
import pytest
import requests
import responses

from handler import lambda_handler
from tests.conftest import STEAM_WISHLIST_URL
from tests.data import WISHLIST_DISCOUNTED_ITEM, WISHLIST_COMING_SOON_ITEM, WISHLIST_EMPTY, VALID_QUERY_PARAMS, \
    VALID_PAYLOAD, STEAM_JSON, STEAM_HTML, STEAM_BAD_REQUEST_HTML, STEAM_TOO_MANY_REQUESTS_HTML


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
        query = parse_qs(urlparse(request.url).query, strict_parsing=True)
        decoded = {name: json.loads(value) for name, [value] in query.items()}

        assert decoded == {"input_json": VALID_PAYLOAD}
        assert request.headers["Accept"] == "application/json"

    @pytest.mark.parametrize(
        "steam_body, status_code, content_type",
        [
            pytest.param(WISHLIST_DISCOUNTED_ITEM, 200, STEAM_JSON, id="discounted item with £"),
            pytest.param(WISHLIST_COMING_SOON_ITEM, 200, STEAM_JSON, id="coming soon, no price"),
            pytest.param(WISHLIST_EMPTY, 200, STEAM_JSON, id="empty wishlist"),
            pytest.param(STEAM_BAD_REQUEST_HTML, 400, STEAM_HTML, id="400 bad steam id (html)"),
            pytest.param(STEAM_TOO_MANY_REQUESTS_HTML, 429, STEAM_HTML, id="429 rate limited (html)"),
            pytest.param('{"error_message": "unexpected error occurred"}', 500, STEAM_JSON, id="500 error (json)"),
        ],
    )
    def test_passes_steam_response_through_unmodified(self, http, lambda_context, valid_query_params, steam_body,
                                                      status_code, content_type):
        http.get(
            STEAM_WISHLIST_URL,
            body=steam_body,
            status=status_code,
            content_type=content_type,
        )

        result = lambda_handler(event(valid_query_params), lambda_context)

        assert result["statusCode"] == status_code
        assert result["body"] == steam_body
        assert result["headers"] == {"Content-Type": content_type}

    def test_defaults_to_json_content_type_when_steam_sends_none(self, http, lambda_context, valid_query_params):
        http.get(STEAM_WISHLIST_URL, body=WISHLIST_EMPTY, status=200, content_type=None)

        result = lambda_handler(event(valid_query_params), lambda_context)

        assert result["headers"] == {"Content-Type": "application/json"}

    def test_does_not_forward_downstream_headers(self, http, lambda_context, valid_query_params):
        http.get(
            STEAM_WISHLIST_URL,
            body=WISHLIST_EMPTY,
            status=200,
            content_type=STEAM_JSON,
            headers={
                "Set-Cookie": "steamCountry=GB%7Cabc123; path=/",
                "Cache-Control": "public, max-age=60",
                "X-Internal-Trace": "abc-123",
            },
        )

        result = lambda_handler(event(valid_query_params), lambda_context)

        # Only Steam's Content-Type is passed on
        assert result["headers"] == {"Content-Type": STEAM_JSON}

    @pytest.mark.parametrize(
        "query_params, mock_kwargs, expected_status",
        [
            pytest.param(None, None, 400, id="bad request"),
            pytest.param(VALID_QUERY_PARAMS, {"body": requests.exceptions.ReadTimeout()}, 504, id="timeout"),
            pytest.param(VALID_QUERY_PARAMS, {"body": requests.exceptions.ConnectionError()}, 502, id="unavailable"),
        ],
    )
    def test_lambda_errors_are_json(self, http, lambda_context, query_params, mock_kwargs, expected_status):
        if mock_kwargs is not None:
            http.get(STEAM_WISHLIST_URL, **mock_kwargs)

        result = lambda_handler(event(query_params), lambda_context)

        assert result["statusCode"] == expected_status
        assert result["headers"] == {"Content-Type": "application/json"}
