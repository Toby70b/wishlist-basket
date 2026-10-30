"""Inbound request models for the pass-through adapter."""
from pydantic import BaseModel, ConfigDict, Field, ValidationError


class BadRequest(Exception):
    """Caller sent invalid input; the handler maps this to a 400."""


class ApiModel(BaseModel):
    """Shared config for all Pydantic API models."""
    model_config = ConfigDict(extra="ignore", populate_by_name=True, frozen=True)


class Context(ApiModel):
    country_code: str


class InputJson(ApiModel):
    """Inbound wishlist query params parsed from the `input_json` query param."""
    steam_id: str = Field(alias="steamid")
    context: Context
    page_size: int

    @classmethod
    def from_query_params(cls, params: dict | None) -> "InputJson":
        raw = (params or {}).get("input_json")
        if raw is None:
            raise BadRequest("missing 'input_json' query param")
        try:
            return cls.model_validate_json(raw)
        except ValidationError as e:
            raise BadRequest(_format_errors(e)) from e


def _format_errors(e: ValidationError) -> str:
    """Turn Pydantic's error list into a short, caller-friendly message."""
    parts = []
    for err in e.errors():
        path = ".".join(map(str, err["loc"]))
        parts.append(f"{path}: {err['msg']}" if path else err["msg"])
    return "; ".join(parts)
