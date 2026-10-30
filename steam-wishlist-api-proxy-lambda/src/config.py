import os
from dataclasses import dataclass

@dataclass(frozen=True)
class Config:
    base_url: str

def load_config() -> Config:
    return Config(
        base_url = os.environ["STEAM_API_BASE_URL"]
    )
