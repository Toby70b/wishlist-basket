import logging
import json
from urllib.parse import urlencode

import requests

from models import InputJson, BadRequest
from config import load_config, Config

TIMEOUT_SECONDS = 5
WISHLIST_API_PATH = "/IWishlistService/GetWishlistSortedFiltered/v1/"

logger = logging.getLogger()
session = requests.Session()
session.headers.update({"Accept": "application/json"})

"""
Lambda handler function. This function acts as a proxy for the Steam Wishlist API designed to be invoked from the
Wishlist UI running on the same cloudfront distribution.
"""

def lambda_handler(event, context):
    """
    The handler receives a HTTP GET request for the Steam Wishlist API, it then forwards the request onto the real
    Steam Wishlist API. The results of the HTTP request are then propagated back to the client. In the event of a timeout
    or other unexpected error invoking the Steam Wishlist API, this handler will return an appropriate HTTP 5xx response
    with an error indicating that there was an error communicating with the Steam Wishlist API.

    :param event:
    :param context:
    :return: a dict with a HTTP status code and body containing a Steam user's wishlist information, if the request
    was successful, otherwise a dict with an error code
    """
    try:
        return _handle(event)
    except Exception:
        logger.exception("Unhandled error, request_id=%s", getattr(context, "aws_request_id", None))
        return api_response(500, {"error_message": "unexpected error occurred"})


def _handle(event):
    cfg = load_config()

    try:
        query = InputJson.from_query_params(event.get("queryStringParameters"))
    except BadRequest as e:
        return api_response(400, {"error_message": str(e)})

    try:
        resp = session.get(build_outbound_url(query, cfg), timeout=TIMEOUT_SECONDS)
    except requests.Timeout:
        return api_response(504, {"error_message": "Steam Wishlist API timed out"})
    except requests.RequestException:
        return api_response(502, {"error_message": "Steam Wishlist API unavailable"})

    return api_response(
        resp.status_code,
        resp.text,
        {"Content-Type": resp.headers.get("Content-Type", "application/json")},
    )


def api_response(status: int, body: dict | str, headers: dict | None = None) -> dict:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", **(headers or {})},
        "body": body if isinstance(body, str) else json.dumps(body),
    }


def build_outbound_url(query: InputJson, cfg: Config) -> str:
    input_json = query.model_dump_json(by_alias=True)
    return f"{cfg.base_url}{WISHLIST_API_PATH}?{urlencode({'input_json': input_json})}"
