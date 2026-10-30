import json
import pytest

from handler import WISHLIST_API_PATH

STEAM_BASE_URL = "https://api.steampowered.com"
STEAM_WISHLIST_URL = f"{STEAM_BASE_URL}{WISHLIST_API_PATH}"

@pytest.fixture
def valid_payload() -> dict:
    return {"steamid": "76561198000000001", "context": {"country_code": "GB"}, "page_size": 1000}

@pytest.fixture
def valid_query_params(valid_payload) -> dict:
    return {"input_json": json.dumps(valid_payload)}

@pytest.fixture(autouse=True)
def env(monkeypatch):
    monkeypatch.setenv("STEAM_API_BASE_URL", STEAM_BASE_URL)
