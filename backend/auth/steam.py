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
from typing import Dict, List, Any
from pathlib import Path
import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from datetime import datetime

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()

router = APIRouter()

STEAM_API_KEY = os.getenv("STEAM_API_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
REDIRECT_URI = os.getenv("REDIRECT_URI")

if not all([STEAM_API_KEY, JWT_SECRET_KEY, REDIRECT_URI]):
    raise ValueError("Missing required environment variables")

CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)
SCHEMA_CACHE_PATH = CACHE_DIR / "schemas"
SCHEMA_CACHE_PATH.mkdir(exist_ok=True)
PRICE_CACHE_PATH = CACHE_DIR / "prices.json"
HISTORY_CACHE_PATH = CACHE_DIR / "history.json"
POPULAR_ITEMS_CACHE_PATH = CACHE_DIR / "popular_items.json"

price_cache: Dict[str, Dict] = {}
history_cache: Dict[str, List] = {}
popular_items_cache: Dict[str, List] = {}

session = requests.Session()
retries = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
session.mount("https://", HTTPAdapter(max_retries=retries))

def load_price_cache() -> Dict[str, Dict]:
    if PRICE_CACHE_PATH.exists():
        with open(PRICE_CACHE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_price_cache(cache: Dict[str, Dict]):
    with open(PRICE_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False)

def load_history_cache() -> Dict[str, List]:
    if HISTORY_CACHE_PATH.exists():
        with open(HISTORY_CACHE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_history_cache(cache: Dict[str, List]):
    with open(HISTORY_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False)

def load_popular_items_cache() -> Dict[str, List]:
    if POPULAR_ITEMS_CACHE_PATH.exists():
        with open(POPULAR_ITEMS_CACHE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_popular_items_cache(cache: Dict[str, List]):
    with open(POPULAR_ITEMS_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False)

price_cache = load_price_cache()
history_cache = load_history_cache()
popular_items_cache = load_popular_items_cache()

def fetch_item_schema(appid: str) -> List[Dict[str, Any]]:
    schema_file = SCHEMA_CACHE_PATH / f"{appid}_schema.json"

    if schema_file.exists():
        logger.info(f"Loading cached schema for appid {appid}")
        with open(schema_file, "r", encoding="utf-8") as f:
            return json.load(f)

    logger.info(f"Fetching schema for appid {appid} from Steam API")
    try:
        time.sleep(1)
        url = f"https://api.steampowered.com/IEconItems_{appid}/GetSchema/v2/?key={STEAM_API_KEY}&language=en"
        response = session.get(url, timeout=10)
        response.raise_for_status()

        schema_data = response.json().get("result", {}).get("items", [])

        with open(schema_file, "w", encoding="utf-8") as f:
            json.dump(schema_data, f, ensure_ascii=False)
        logger.info(f"Schema for appid {appid} cached successfully")

        return schema_data
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch schema for appid {appid}: {str(e)}")
        return []

def normalize_market_hash_name(name: str) -> str:
    return re.sub(r'\s+', ' ', name.strip().lower())

def build_properties_map(schema_data: List[Dict[str, Any]], appid: str) -> Dict[str, Dict[str, Any]]:
    properties_map = {}

    for item in schema_data:
        market_hash_name = item.get("market_hash_name", item.get("name", ""))
        if not market_hash_name:
            continue

        normalized_key = normalize_market_hash_name(market_hash_name)
        properties = {}

        if appid == "730":
            item_type = item.get("item_type", "")
            if "weapon_" in item.get("defindex", ""):
                if "knife" in item_type.lower():
                    item_type = "Knife"
                elif "pistol" in item_type.lower():
                    item_type = "Pistol"
                elif "rifle" in item_type.lower():
                    item_type = "Rifle"
                elif "smg" in item_type.lower():
                    item_type = "SMG"
                elif "sniper" in item_type.lower():
                    item_type = "Sniper Rifle"
                elif "shotgun" in item_type.lower():
                    item_type = "Shotgun"
                elif "machinegun" in item_type.lower():
                    item_type = "Machine Gun"
            elif "gloves" in item_type.lower():
                item_type = "Gloves"
            properties["type"] = item_type

            rarity = item.get("rarity", "")
            if rarity:
                if "common" in rarity.lower():
                    rarity = "Consumer Grade"
                elif "uncommon" in rarity.lower():
                    rarity = "Industrial Grade"
                elif "rare" in rarity.lower():
                    rarity = "Mil-Spec"
                elif "mythical" in rarity.lower():
                    rarity = "Restricted"
                elif "legendary" in rarity.lower():
                    rarity = "Classified"
                elif "ancient" in rarity.lower():
                    rarity = "Covert"
            properties["rarity"] = rarity

            wear = []
            if "wear" in item:
                wear = item["wear"]
            elif "Factory New" in market_hash_name:
                wear = ["Factory New"]
            elif "Minimal Wear" in market_hash_name:
                wear = ["Minimal Wear"]
            elif "Field-Tested" in market_hash_name:
                wear = ["Field-Tested"]
            elif "Well-Worn" in market_hash_name:
                wear = ["Well-Worn"]
            elif "Battle-Scarred" in market_hash_name:
                wear = ["Battle-Scarred"]
            properties["wear"] = wear

            attributes = []
            if "StatTrak" in market_hash_name or any(
                    attr.get("name", "").lower() == "stattrak" for attr in item.get("attributes", [])):
                attributes.append("stattrak_available")
            properties["attributes"] = attributes

        elif appid == "570":
            properties["rarity"] = ""

            slot = item.get("slot", "")
            properties["slot"] = slot if slot else ""

            quality = item.get("quality", "")
            if quality:
                if "normal" in quality.lower():
                    quality = "Normal"
                elif "inscribed" in quality.lower():
                    quality = "Inscribed"
                elif "autographed" in quality.lower():
                    quality = "Autographed"
                elif "genuine" in quality.lower():
                    quality = "Genuine"
            properties["quality"] = quality

            hero = item.get("hero", "")
            for attr in item.get("attributes", []):
                if "hero" in attr.get("name", "").lower():
                    hero = attr.get("value", "")
                    break
            properties["hero"] = hero if hero else ""

        properties_map[normalized_key] = properties

    logger.info(f"Properties map for appid {appid} built with {len(properties_map)} items")
    return properties_map

cs2_properties_map = {}
dota2_properties_map = {}

try:
    cs2_schema = fetch_item_schema("730")
    cs2_properties_map = build_properties_map(cs2_schema, "730")
except Exception as e:
    logger.error(f"Failed to load schema for appid 730: {str(e)}. Proceeding without schema.")
    cs2_properties_map = {}

try:
    dota2_schema = fetch_item_schema("570")
    dota2_properties_map = build_properties_map(dota2_schema, "570")
except Exception as e:
    logger.error(f"Failed to load schema for appid 570: {str(e)}. Proceeding without schema.")
    dota2_properties_map = {}

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
    response = session.post("https://steamcommunity.com/openid/login", data=validation_params, timeout=10)
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

        response = session.get(
            f"https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={STEAM_API_KEY}&steamids={steam_id}",
            timeout=10)
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

        valid_appids = ["730", "570"]
        if appid not in valid_appids:
            raise HTTPException(status_code=400, detail="Invalid appid. Use 730 for CS2 or 570 for Dota 2")

        games = [{"appid": appid, "contextid": "2"}]
        items = []

        for game in games:
            url = f"https://steamcommunity.com/inventory/{steam_id}/{game['appid']}/{game['contextid']}"
            response = session.get(url, params={"l": "english"}, timeout=10)
            if response.status_code != 200:
                logger.warning(f"Failed to fetch inventory for appid {game['appid']}: HTTP {response.status_code}")
                continue

            data = response.json()
            if 'assets' not in data or 'descriptions' not in data:
                logger.info(f"No inventory items found for appid {game['appid']}")
                continue

            properties_map = cs2_properties_map if appid == "730" else dota2_properties_map

            for asset in data['assets']:
                for desc in data['descriptions']:
                    if desc['classid'] == asset['classid']:
                        market_hash_name = desc.get('market_hash_name', desc.get('name', ''))
                        if "Graffiti" in desc.get('name', '') and "Sealed" not in market_hash_name:
                            market_hash_name = f"Sealed {market_hash_name}"

                        normalized_key = normalize_market_hash_name(market_hash_name)
                        properties = properties_map.get(normalized_key, {
                            "type": "",
                            "rarity": "",
                            "wear": [],
                            "attributes": [],
                            "slot": "",
                            "quality": "",
                            "hero": ""
                        })

                        if appid == "730":
                            if not properties["wear"]:
                                if "Factory New" in market_hash_name:
                                    properties["wear"] = ["Factory New"]
                                elif "Minimal Wear" in market_hash_name:
                                    properties["wear"] = ["Minimal Wear"]
                                elif "Field-Tested" in market_hash_name:
                                    properties["wear"] = ["Field-Tested"]
                                elif "Well-Worn" in market_hash_name:
                                    properties["wear"] = ["Well-Worn"]
                                elif "Battle-Scarred" in market_hash_name:
                                    properties["wear"] = ["Battle-Scarred"]
                            if "StatTrak" in market_hash_name:
                                properties["attributes"] = ["stattrak_available"]
                            if not properties["type"]:
                                name_lower = market_hash_name.lower()
                                if "knife" in name_lower or "★" in market_hash_name:
                                    properties["type"] = "Knife"
                                elif "pistol" in name_lower or "deagle" in name_lower or "glock" in name_lower:
                                    properties["type"] = "Pistol"
                                elif "rifle" in name_lower or "ak-47" in name_lower or "m4a" in name_lower:
                                    properties["type"] = "Rifle"
                                elif "smg" in name_lower or "mp" in name_lower or "p90" in name_lower:
                                    properties["type"] = "SMG"
                                elif "sniper" in name_lower or "awp" in name_lower or "ssg" in name_lower:
                                    properties["type"] = "Sniper Rifle"
                                elif "shotgun" in name_lower or "nova" in name_lower or "xm1014" in name_lower:
                                    properties["type"] = "Shotgun"
                                elif "machine gun" in name_lower or "negev" in name_lower or "m249" in name_lower:
                                    properties["type"] = "Machine Gun"
                                elif "gloves" in name_lower:
                                    properties["type"] = "Gloves"
                            if not properties["rarity"]:
                                for tag in desc.get("tags", []):
                                    if tag.get("category") == "Rarity":
                                        rarity_value = tag.get("internal_name", "").lower()
                                        rarity_mapping = {
                                            "rarity_common_weapon": "Consumer Grade",
                                            "rarity_uncommon_weapon": "Industrial Grade",
                                            "rarity_rare_weapon": "Mil-Spec",
                                            "rarity_mythical_weapon": "Restricted",
                                            "rarity_legendary_weapon": "Classified",
                                            "rarity_ancient_weapon": "Covert",
                                            "rarity_contraband": "Contraband"
                                        }
                                        mapped_rarity = rarity_mapping.get(rarity_value, "")
                                        if mapped_rarity:
                                            properties["rarity"] = mapped_rarity
                                            break
                                        rarity_value = tag.get("localized_tag_name", "").lower()
                                        rarity_mapping_localized = {
                                            "consumer grade": "Consumer Grade",
                                            "industrial grade": "Industrial Grade",
                                            "mil-spec": "Mil-Spec",
                                            "restricted": "Restricted",
                                            "classified": "Classified",
                                            "covert": "Covert",
                                            "contraband": "Contraband"
                                        }
                                        mapped_rarity = rarity_mapping_localized.get(rarity_value, rarity_value.title())
                                        properties["rarity"] = mapped_rarity
                                        break

                        if appid == "570":
                            for tag in desc.get("tags", []):
                                category = tag.get("category")
                                if category == "Rarity" and not properties["rarity"]:
                                    rarity_value = tag.get("internal_name", "").lower()
                                    rarity_mapping = {
                                        "rarity_common": "Common",
                                        "rarity_uncommon": "Uncommon",
                                        "rarity_rare": "Rare",
                                        "rarity_mythical": "Mythical",
                                        "rarity_legendary": "Legendary",
                                        "rarity_immortal": "Immortal",
                                        "rarity_arcana": "Arcana",
                                        "rarity_ancient": "Ancient",
                                        "common": "Common",
                                        "uncommon": "Uncommon",
                                        "rare": "Rare",
                                        "mythical": "Mythical",
                                        "legendary": "Legendary",
                                        "immortal": "Immortal",
                                        "arcana": "Arcana",
                                        "ancient": "Ancient"
                                    }
                                    mapped_rarity = rarity_mapping.get(rarity_value, tag.get("localized_tag_name", "").title())
                                    properties["rarity"] = mapped_rarity.title()
                            if not properties["hero"]:
                                for desc_item in desc.get("descriptions", []):
                                    if "Used By:" in desc_item.get("value", ""):
                                        hero = desc_item["value"].replace("Used By: ", "").strip()
                                        properties["hero"] = hero
                                        break
                            if not properties["slot"]:
                                name_lower = market_hash_name.lower()
                                if "head" in name_lower:
                                    properties["slot"] = "Head"
                                elif "arms" in name_lower:
                                    properties["slot"] = "Arms"
                                elif "legs" in name_lower:
                                    properties["slot"] = "Legs"
                                elif "weapon" in name_lower:
                                    properties["slot"] = "Weapon"
                                elif "shoulders" in name_lower:
                                    properties["slot"] = "Shoulders"
                            logger.info(f"Dota 2 item: {market_hash_name}, Rarity: {properties['rarity']}, Hero: {properties['hero']}")

                        items.append({
                            "name": desc.get('name', 'Unknown Item'),
                            "appid": game['appid'],
                            "icon_url": f"https://steamcommunity-a.akamaihd.net/economy/image/{desc.get('icon_url', '')}",
                            "price": None,
                            "classid": desc['classid'],
                            "market_hash_name": market_hash_name,
                            "properties": properties
                        })
                        break

        if not items:
            logger.info(f"No inventory items found for SteamID: {steam_id} and appid: {appid}")
        else:
            logger.info(f"Returning {len(items)} items for SteamID: {steam_id} and appid: {appid}")
        return items
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        logger.error(f"Failed to fetch inventory: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch inventory: {str(e)}")

def fetch_market_csgo_prices():
    try:
        response = session.get("https://market.csgo.com/api/v2/prices/USD.json", timeout=10)
        response.raise_for_status()
        data = response.json()
        if not data.get("success"):
            raise HTTPException(status_code=500, detail="Ошибка получения цен с Market.CSGO")
        return {item["market_hash_name"]: item["price"] for item in data["items"]}
    except requests.RequestException as e:
        logger.error(f"Ошибка запроса к Market.CSGO: {e}")
        return {}

def get_market_csgo_price(market_hash_name: str):
    cache_key = "market_csgo_prices"
    if cache_key in price_cache:
        prices = price_cache[cache_key]
    else:
        prices = fetch_market_csgo_prices()
        price_cache[cache_key] = prices
        save_price_cache(price_cache)

    return prices.get(market_hash_name, "N/A")


def fetch_market_dota2_prices():
    try:
        response = session.get("https://market.dota2.net/api/v2/prices/USD.json", timeout=10)
        response.raise_for_status()
        data = response.json()
        if not data.get("success"):
            raise HTTPException(status_code=500, detail="Ошибка получения цен с Market.Dota2")
        return {item["market_hash_name"]: item["price"] for item in data["items"]}
    except requests.RequestException as e:
        logger.error(f"Ошибка запроса к Market.Dota2: {e}")
        return {}

def get_market_dota2_price(market_hash_name: str):
    cache_key = "market_dota2_prices"
    if cache_key in price_cache:
        prices = price_cache[cache_key]
    else:
        prices = fetch_market_dota2_prices()
        price_cache[cache_key] = prices
        save_price_cache(price_cache)

    return prices.get(market_hash_name, "N/A")


def fetch_lis_skins_prices(appid: str):
    try:
        url = "https://lis-skins.com/market_export_json/csgo.json" if appid == "730" else "https://lis-skins.com/market_export_json/dota2.json"
        response = session.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        return {item["name"]: item["price"] for item in data}
    except requests.RequestException as e:
        logger.error(f"Ошибка запроса к Lis-Skins для appid {appid}: {e}")
        return {}

def get_lis_skins_price(market_hash_name: str, appid: str):
    cache_key = f"lis_skins_prices_{appid}"
    if cache_key in price_cache:
        prices = price_cache[cache_key]
    else:
        prices = fetch_lis_skins_prices(appid)
        price_cache[cache_key] = prices
        save_price_cache(price_cache)

    return prices.get(market_hash_name, "N/A")

@router.get("/price")
async def get_price(token: str, market_hash_name: str, appid: str, force_refresh: bool = False):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        if not payload.get("steam_id"):
            raise HTTPException(status_code=401, detail="Invalid token payload")

        cache_key = f"{appid}:{market_hash_name}"
        if not force_refresh and cache_key in price_cache:
            logger.debug(f"Returning cached price for {cache_key}")
            return price_cache[cache_key]

        logger.debug(f"Fetching price for {market_hash_name} (appid: {appid})")
        price_url = f"https://steamcommunity.com/market/priceoverview/?appid={appid}¤cy=1&market_hash_name={quote(market_hash_name)}"
        price_response = session.get(price_url, timeout=10)
        logger.debug(f"Price URL: {price_url}")
        logger.debug(f"Price response: {price_response.status_code} - {price_response.text}")

        price_data = price_response.json() if price_response.status_code == 200 else {}
        steam_price = price_data.get('lowest_price', 'N/A')


        lis_skins_price = get_lis_skins_price(market_hash_name, appid)


        if appid == "730":
            market_csgo_price = get_market_csgo_price(market_hash_name)
            result = {
                "steam_price": steam_price,
                "market_csgo_price": market_csgo_price,
                "cs_money_price": "N/A",
                "lis_skins_price": f"${lis_skins_price}" if lis_skins_price != "N/A" else "N/A"
            }
        else:
            market_dota2_price = get_market_dota2_price(market_hash_name)
            result = {
                "steam_price": steam_price,
                "market_dota2_price": market_dota2_price,
                "lis_skins_price": f"${lis_skins_price}" if lis_skins_price != "N/A" else "N/A"
            }

        price_cache[cache_key] = result
        save_price_cache(price_cache)
        logger.info(f"Price fetched: {result}")
        return result
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        logger.error(f"Failed to fetch price: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch price: {str(e)}")

@router.get("/reset_cache")
async def reset_cache(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        if not payload.get("steam_id"):
            raise HTTPException(status_code=401, detail="Invalid token payload")

        price_cache.clear()
        history_cache.clear()
        popular_items_cache.clear()
        if PRICE_CACHE_PATH.exists():
            PRICE_CACHE_PATH.unlink()
        if HISTORY_CACHE_PATH.exists():
            HISTORY_CACHE_PATH.unlink()
        if POPULAR_ITEMS_CACHE_PATH.exists():
            POPULAR_ITEMS_CACHE_PATH.unlink()
        logger.info("Server price, history, and popular items cache cleared")
        return {"message": "Cache cleared"}
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        logger.error(f"Failed to reset cache: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reset cache: {str(e)}")

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
        history_response = session.get(history_url, timeout=10)
        logger.debug(f"History response: {history_response.status_code} - {history_response.text[:200]}")

        history_match = re.search(r'var line1=(.+?);', history_response.text)
        history_data = json.loads(history_match.group(1)) if history_match else []

        if not history_data:
            logger.warning(f"No history data found for {market_hash_name}")
            price_url = f"https://steamcommunity.com/market/priceoverview/?appid={appid}¤cy=1&market_hash_name={quote(market_hash_name)}"
            price_response = session.get(price_url, timeout=10)
            price_data = price_response.json() if price_response.status_code == 200 else {}
            if price_data.get('lowest_price'):
                current_time = datetime.utcnow().strftime("%b %d %Y %H: +0")
                price = float(price_data['lowest_price'].replace('$', ''))
                history_data = [[current_time, price, "1"]]

        history_cache[cache_key] = history_data
        save_history_cache(history_cache)
        logger.info(f"History fetched: {len(history_data)} entries")
        return {"history": history_data}
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        logger.error(f"Failed to fetch history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")

@router.get("/popular_items")
async def get_popular_items(appid: str, force_refresh: bool = False):
    try:
        valid_appids = ["730", "570"]
        if appid not in valid_appids:
            raise HTTPException(status_code=400, detail="Invalid appid. Use 730 for CS2 or 570 for Dota 2")

        cache_key = f"popular_items_{appid}"
        if force_refresh and cache_key in popular_items_cache:
            logger.debug(f"Clearing cache for appid {appid} due to force_refresh")
            del popular_items_cache[cache_key]
            if POPULAR_ITEMS_CACHE_PATH.exists():
                save_popular_items_cache(popular_items_cache)

        if not force_refresh and cache_key in popular_items_cache:
            logger.debug(f"Returning cached popular items for appid {appid}")
            return {"items": popular_items_cache[cache_key]}

        logger.debug(f"Fetching popular items for appid {appid} from Steam Market")

        if force_refresh:
            time.sleep(2)
        url = f"https://steamcommunity.com/market/search/render/?appid={appid}&norender=1&count=10"
        response = session.get(url, timeout=10)
        logger.debug(f"Popular items response: {response.status_code} - {response.text[:200]}")

        if response.status_code != 200:
            logger.error(f"Failed to fetch popular items for appid {appid}: HTTP {response.status_code}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch popular items: HTTP {response.status_code}")

        data = response.json()
        if not data.get("success"):
            logger.error(f"Failed to fetch popular items for appid {appid}: API returned success=false")
            raise HTTPException(status_code=500, detail="Failed to fetch popular items: API error")

        items = []
        for listing in data.get("results", [])[:10]:
            name = listing.get("name", "Unknown Item")
            price = listing.get("sell_price_text", "N/A")
            icon_url = listing.get("asset_description", {}).get("icon_url", "")
            icon_url = f"https://steamcommunity-a.akamaihd.net/economy/image/{icon_url}" if icon_url else "https://via.placeholder.com/150"
            item_url = f"https://steamcommunity.com/market/listings/{appid}/{quote(name)}"

            items.append({
                "name": name,
                "price": price,
                "icon_url": icon_url,
                "item_url": item_url
            })

        if not items:
            logger.warning(f"No popular items found for appid {appid}")
            raise HTTPException(status_code=404, detail="No popular items found")

        popular_items_cache[cache_key] = items
        save_popular_items_cache(popular_items_cache)
        logger.info(f"Popular items fetched for appid {appid}: {len(items)} items")
        return {"items": items}
    except Exception as e:
        logger.error(f"Failed to fetch popular items: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch popular items: {str(e)}")