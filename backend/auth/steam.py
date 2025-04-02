from fastapi import HTTPException, APIRouter, Request
from fastapi.responses import RedirectResponse
import os
from dotenv import load_dotenv
from steam.steamid import SteamID
import requests
from jose import jwt
from urllib.parse import urlencode
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()

router = APIRouter()

STEAM_API_KEY = os.getenv("STEAM_API_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
REDIRECT_URI = os.getenv("REDIRECT_URI")

if not all([STEAM_API_KEY, JWT_SECRET_KEY, REDIRECT_URI]):
    raise ValueError("Missing required environment variables")

@router.get("/steam/login")
async def steam_login():
    params = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.realm": "http://localhost:8000",
        "openid.return_to": REDIRECT_URI,
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    }
    auth_url = f"https://steamcommunity.com/openid/login?{urlencode(params)}"
    logger.debug(f"Redirecting to Steam: {auth_url}")
    return RedirectResponse(auth_url)

@router.get("/steam/callback")
async def steam_callback(request: Request):
    params = dict(request.query_params)
    logger.debug(f"All query params: {params}")

    openid_mode = params.get("openid.mode")
    openid_ns = params.get("openid.ns")
    openid_claimed_id = params.get("openid.claimed_id")
    openid_identity = params.get("openid.identity")
    openid_sig = params.get("openid.sig")
    openid_signed = params.get("openid.signed")
    openid_assoc_handle = params.get("openid.assoc_handle")
    openid_response_nonce = params.get("openid.response_nonce")
    openid_op_endpoint = params.get("openid.op_endpoint")
    openid_return_to = params.get("openid.return_to")

    if not openid_mode or openid_mode != "id_res":
        logger.error(f"Authentication failed: openid_mode={openid_mode}")
        raise HTTPException(status_code=400, detail="Authentication failed: invalid or missing openid_mode")

    if not all([openid_ns, openid_claimed_id, openid_sig, openid_signed, openid_assoc_handle]):
        logger.error("Missing required OpenID parameters")
        raise HTTPException(status_code=400, detail="Missing required OpenID parameters")

    validation_params = {
        "openid.ns": openid_ns,
        "openid.mode": "check_authentication",
        "openid.op_endpoint": openid_op_endpoint,
        "openid.claimed_id": openid_claimed_id,
        "openid.identity": openid_identity,
        "openid.return_to": openid_return_to,
        "openid.response_nonce": openid_response_nonce,
        "openid.assoc_handle": openid_assoc_handle,
        "openid.signed": openid_signed,
        "openid.sig": openid_sig,
    }
    response = requests.post("https://steamcommunity.com/openid/login", data=validation_params)
    logger.debug(f"Steam validation response: {response.text}")

    if "is_valid:true" not in response.text:
        logger.error("Invalid Steam authentication")
        raise HTTPException(status_code=401, detail="Invalid Steam authentication")

    try:
        steam_id_str = openid_claimed_id.split('/')[-1]
        logger.debug(f"Extracted SteamID string: {steam_id_str}")
        steam_id = SteamID(steam_id_str)
    except Exception as e:
        logger.error(f"Failed to parse SteamID from {openid_claimed_id}: {e}")
        raise HTTPException(status_code=400, detail="Invalid Steam ID format")

    if not steam_id or not steam_id.is_valid():
        logger.error(f"Invalid Steam ID: {steam_id_str}")
        raise HTTPException(status_code=400, detail="Invalid Steam ID")

    token_payload = {"steam_id": str(steam_id)}
    token = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm="HS256")

    logger.info(f"User authenticated: SteamID={steam_id}")
    return {"access_token": token, "token_type": "bearer"}