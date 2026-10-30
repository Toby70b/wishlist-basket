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

        assert input_json.steam_id == "1234556777"
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
            pytest.param({"input_json": '{"steamid":"1234567","page_size":1000}'},
                         "context: Field required",
                         id="missing context"),
            pytest.param({"input_json": '{"steamid":"1234567","context":{},"page_size":1000}'},
                         "context.country_code: Field required",
                         id="missing country_code"),
            pytest.param({"input_json": '{"steamid":"1234567", "context":{"country_code":"GB"}}'},
                         "page_size: Field required",
                         id="missing page_size"),
        ],
    )
    def test_rejects_invalid_fields(self, invalid_query_param, expected_message):
        with pytest.raises(BadRequest) as exc_info:
            InputJson.from_query_params(invalid_query_param)

        assert expected_message == str(exc_info.value)

    def test_ignores_unknown_keys(self, valid_payload):
        f = InputJson.model_validate({**valid_payload, "unknown_value": 1})
        assert not hasattr(f, "unknown_value")
