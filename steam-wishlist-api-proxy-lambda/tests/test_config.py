import pytest

from config import Config, load_config

CONFIG_VARS = ["STEAM_API_BASE_URL"]

@pytest.fixture(autouse=True)
def env(monkeypatch):
    """Overrides the conftest fixture: start every test with no config set."""
    for var in CONFIG_VARS:
        monkeypatch.delenv(var, raising=False)


class TestConfig:
    def test_reads_config_from_env(self, monkeypatch):
        monkeypatch.setenv("STEAM_API_BASE_URL", "http://localhost:5000")
        assert load_config() == Config(base_url="http://localhost:5000")

    def test_missing_config_raises_error(self, monkeypatch):
        with pytest.raises(Exception):
            load_config()
