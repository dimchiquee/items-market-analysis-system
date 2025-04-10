from fastapi import HTTPException, APIRouter, Request
from fastapi.responses import RedirectResponse
import os
from dotenv import load_dotenv
from steam.steamid import SteamID
import requests
from jose import jwt
from urllib.parse import urlencode, quote
import logging
import json
import re
from typing import Dict

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()

router = APIRouter()

STEAM_API_KEY = os.getenv("STEAM_API_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
REDIRECT_URI = os.getenv("REDIRECT_URI")

if not all([STEAM_API_KEY, JWT_SECRET_KEY, REDIRECT_URI]):
    raise ValueError("Missing required environment variables")

price_cache: Dict[str, Dict] = {}
history_cache: Dict[str, list] = {}

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
        raise HTTPException(status_code=400, detail="Authentication failed")

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
    if "is_valid:true" not in response.text:
        logger.error("Invalid Steam authentication")
        raise HTTPException(status_code=401, detail="Invalid Steam authentication")

    steam_id_str = openid_claimed_id.split('/')[-1]
    steam_id = SteamID(steam_id_str)

    if not steam_id or not steam_id.is_valid():
        logger.error(f"Invalid Steam ID: {steam_id_str}")
        raise HTTPException(status_code=400, detail="Invalid Steam ID")

    token_payload = {"steam_id": str(steam_id)}
    token = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm="HS256")

    logger.info(f"User authenticated: SteamID={steam_id}")
    return RedirectResponse(f"http://localhost:5173/callback?token={token}")

@router.get("/verify")
async def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        steam_id = payload.get("steam_id")
        if not steam_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        response = requests.get(f"https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={STEAM_API_KEY}&steamids={steam_id}")
        player = response.json()['response']['players'][0] if response.json()['response']['players'] else {}

        return {
            "steam_id": steam_id,
            "username": player.get("personaname", steam_id),
            "avatar": player.get("avatarfull", "https://via.placeholder.com/40")
        }
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        logger.error(f"Failed to fetch user info: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user info")

@router.get("/inventory")
async def get_inventory(token: str, appid: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        steam_id = payload.get("steam_id")
        if not steam_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        # Проверяем, что appid валидный
        valid_appids = ["730", "570"]
        if appid not in valid_appids:
            raise HTTPException(status_code=400, detail="Invalid appid. Use 730 for CS:GO or 570 for Dota 2")

        games = [{"appid": appid, "contextid": "2"}]  # Загружаем только одну игру
        items = []

        for game in games:
            url = f"https://steamcommunity.com/inventory/{steam_id}/{game['appid']}/{game['contextid']}"
            response = requests.get(url, params={"l": "english"})
            if response.status_code != 200:
                logger.warning(f"Failed to fetch inventory for appid {game['appid']}: HTTP {response.status_code}")
                continue

            data = response.json()
            if 'assets' not in data or 'descriptions' not in data:
                logger.info(f"No inventory items found for appid {game['appid']}")
                continue

            for asset in data['assets']:
                for desc in data['descriptions']:
                    if desc['classid'] == asset['classid']:
                        market_hash_name = desc.get('market_hash_name', desc.get('name', ''))
                        if "Graffiti" in desc.get('name', '') and "Sealed" not in market_hash_name:
                            market_hash_name = f"Sealed {market_hash_name}"
                        items.append({
                            "name": desc.get('name', 'Unknown Item'),
                            "appid": game['appid'],
                            "icon_url": f"https://steamcommunity-a.akamaihd.net/economy/image/{desc.get('icon_url', '')}",
                            "price": None,
                            "classid": desc['classid'],
                            "market_hash_name": market_hash_name
                        })
                        break

        if not items:
            logger.info(f"No inventory items found for SteamID: {steam_id} and appid: {appid}")
        return items
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        logger.error(f"Failed to fetch inventory: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch inventory: {str(e)}")

@router.get("/price")
async def get_price(token: str, market_hash_name: str, appid: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        if not payload.get("steam_id"):
            raise HTTPException(status_code=401, detail="Invalid token payload")

        cache_key = f"{appid}:{market_hash_name}"
        if cache_key in price_cache:
            logger.debug(f"Returning cached price for {cache_key}")
            return price_cache[cache_key]

        logger.debug(f"Fetching price for {market_hash_name} (appid: {appid})")
        price_url = f"https://steamcommunity.com/market/priceoverview/?appid={appid}&currency=1&market_hash_name={quote(market_hash_name)}"
        price_response = requests.get(price_url)
        logger.debug(f"Price URL: {price_url}")
        logger.debug(f"Price response: {price_response.status_code} - {price_response.text}")

        price_data = price_response.json() if price_response.status_code == 200 else {}
        price = price_data.get('lowest_price', 'N/A')

        result = {"price": price}
        price_cache[cache_key] = result
        logger.info(f"Price fetched: {price}")
        return result
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        logger.error(f"Failed to fetch price: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch price: {str(e)}")

@router.get("/history")
async def get_history(token: str, market_hash_name: str, appid: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        if not payload.get("steam_id"):
            raise HTTPException(status_code=401, detail="Invalid token payload")

        cache_key = f"{appid}:{market_hash_name}"
        if cache_key in history_cache:
            logger.debug(f"Returning cached history for {cache_key}")
            return {"history": history_cache[cache_key]}

        logger.debug(f"Fetching history for {market_hash_name} (appid: {appid})")
        history_url = f"https://steamcommunity.com/market/listings/{appid}/{quote(market_hash_name)}"
        history_response = requests.get(history_url)
        logger.debug(f"History response: {history_response.status_code} - {history_response.text[:200]}")

        history_match = re.search(r'var line1=(.+?);', history_response.text)
        history_data = json.loads(history_match.group(1)) if history_match else []

        if not history_data:
            logger.warning(f"No history data found for {market_hash_name}")
            price_url = f"https://steamcommunity.com/market/priceoverview/?appid={appid}&currency=1&market_hash_name={quote(market_hash_name)}"
            price_response = requests.get(price_url)
            price_data = price_response.json() if price_response.status_code == 200 else {}
            if price_data.get('lowest_price'):
                history_data = [[f"Apr 10 2025 00: +0", float(price_data['lowest_price'].replace('$', '')), "1"]]

        history_cache[cache_key] = history_data
        logger.info(f"History fetched: {len(history_data)} entries")
        return {"history": history_data}
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        logger.error(f"Failed to fetch history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")