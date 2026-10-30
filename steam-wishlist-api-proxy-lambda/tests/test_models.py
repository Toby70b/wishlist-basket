import json

import pytest

from models import BadRequest, InputJson


# ---------- Helpers / fixtures local to this file ----------

def query_params(payload: dict | None = None, *, raw: str | None = None) -> dict:
    """Build a queryStringParameters dict as API Gateway would."""
    return {"input_json": raw if raw is not None else json.dumps(payload)}

class TestInputJson:

    def test_parses_valid_input_json(self, valid_payload):
        input_json = InputJson.from_query_params(query_params(valid_payload))

        assert input_json.steam_id == "76561198000000001"
        assert input_json.context is not None
        assert input_json.context.country_code == "GB"
        assert input_json.page_size == 1000

    @pytest.mark.parametrize(
        "invalid_query_param, expected_message",
        [
            pytest.param(None, "missing 'input_json' query param", id="no params"),
            pytest.param({"input_json": "This is not json"}, "Invalid JSON: expected value at line 1 column 1",
                         id="malformed json"),
        ],
    )
    def test_rejects_missing_or_malformed_request(self, invalid_query_param: dict | None, expected_message: str):
        with pytest.raises(BadRequest) as exc_info:
            InputJson.from_query_params(invalid_query_param)

        assert expected_message == str(exc_info.value)

    @pytest.mark.parametrize(
        "invalid_query_param, expected_message",
        [
            pytest.param({"input_json": '{"context":{"country_code":"GB"},"page_size":1000}'},
                         "steamid: Field required",
                         id="missing steamid"),
            pytest.param({"input_json": '{"steamid":"76561198000000001","page_size":1000}'},
                         "context: Field required",
                         id="missing context"),
            pytest.param({"input_json": '{"steamid":"76561198000000001","context":{},"page_size":1000}'},
                         "context.country_code: Field required",
                         id="missing country_code"),
            pytest.param({"input_json": '{"steamid":"76561198000000001", "context":{"country_code":"GB"}}'},
                         "page_size: Field required",
                         id="missing page_size"),
        ],
    )
    def test_rejects_invalid_fields(self, invalid_query_param, expected_message):
        with pytest.raises(BadRequest) as exc_info:
            InputJson.from_query_params(invalid_query_param)

        assert expected_message == str(exc_info.value)

    @pytest.mark.parametrize(
        "steam_id",
        [
            pytest.param("7656119800000000", id="16 digits"),
            pytest.param("765611980000000011", id="18 digits"),
            pytest.param("7656119800000000x", id="non-digit"),
            pytest.param(" 76561198000000001", id="leading space"),
            pytest.param("", id="empty"),
        ],
    )
    def test_rejects_steam_id_that_is_not_17_digits(self, valid_payload, steam_id):
        with pytest.raises(BadRequest) as exc_info:
            InputJson.from_query_params(query_params({**valid_payload, "steamid": steam_id}))

        assert str(exc_info.value).startswith("steamid: String should match pattern")

    def test_rejects_numeric_steam_id(self, valid_payload):
        # A number would lose precision in JavaScript, so the app always sends a string.
        with pytest.raises(BadRequest) as exc_info:
            InputJson.from_query_params(query_params({**valid_payload, "steamid": 76561198000000001}))

        assert "steamid: Input should be a valid string" == str(exc_info.value)

    @pytest.mark.parametrize(
        "page_size, expected_message",
        [
            pytest.param(0, "page_size: Input should be greater than or equal to 1", id="zero"),
            pytest.param(-1, "page_size: Input should be greater than or equal to 1", id="negative"),
            pytest.param(1001, "page_size: Input should be less than or equal to 1000", id="over 1000"),
        ],
    )
    def test_rejects_page_size_outside_1_to_1000(self, valid_payload, page_size, expected_message):
        with pytest.raises(BadRequest) as exc_info:
            InputJson.from_query_params(query_params({**valid_payload, "page_size": page_size}))

        assert expected_message == str(exc_info.value)

    @pytest.mark.parametrize("page_size", [1, 1000])
    def test_accepts_page_size_at_the_limits(self, valid_payload, page_size):
        assert InputJson.from_query_params(query_params({**valid_payload, "page_size": page_size})).page_size == page_size

    def test_ignores_unknown_keys(self, valid_payload):
        f = InputJson.model_validate({**valid_payload, "unknown_value": 1})
        assert not hasattr(f, "unknown_value")
