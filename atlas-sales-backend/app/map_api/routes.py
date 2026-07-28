from flask import Blueprint, current_app, request

from app.extensions import db
from app.geo.geocoder import GeocoderNotConfigured, geocode
from app.geo.places import DEFAULT_PLACES_RADIUS, search_offices
from app.geo.rosreestr_parser import (
    ParserUnavailable,
    normalize_parser_result,
    parse_by_coords,
)
from app.geo.services import build_surroundings, markers_from_surroundings
from app.map_api.provider import get_map_provider
from app.models import Property
from app.rosreestr import get_property_provider

bp = Blueprint("map_api", __name__, url_prefix="/api/map")


def _normalize_text(value: str) -> str:
    text = (value or "").lower().replace("ё", "е")
    for ch in ",.;:()[]{}\"'«»":
        text = text.replace(ch, " ")
    text = text.replace("улица", " ").replace("ул", " ")
    text = text.replace("проспект", " ").replace("пр", " ")
    text = " ".join(text.split())
    return text


def _tokens(value: str) -> set[str]:
    return {part for part in _normalize_text(value).split() if len(part) > 1}


def _find_property_in_db(query: str) -> Property | None:
    q = (query or "").strip()
    if not q:
        return None

    q_norm = _normalize_text(q)
    q_tokens = _tokens(q)

    props = db.session.scalars(db.select(Property).order_by(Property.id)).all()

    # 1. Сначала точное/почти точное совпадение нормализованной строки.
    for prop in props:
        address_norm = _normalize_text(prop.address)
        if q_norm == address_norm or q_norm in address_norm or address_norm in q_norm:
            return prop

    # 2. Потом совпадение по токенам: город/улица/дом/корпус.
    for prop in props:
        address_tokens = _tokens(prop.address)
        if q_tokens and q_tokens.issubset(address_tokens):
            return prop

    return None


def _cadastral_from_property(prop: Property) -> dict | None:
    if not prop.cadastral_number:
        return None

    return {
        "cadastral_number": prop.cadastral_number,
        "area": prop.area,
        "property_type": prop.property_type,
        "ownership_type": prop.ownership_type,
        "boundaries_status": prop.boundaries_status,
        "land_category": prop.land_category,
        "permitted_use": prop.permitted_use,
        "encumbrances": prop.encumbrances,
        "owner_name": prop.owner_name,
        "checked_at": prop.checked_at,
        "source": "db",
    }


def _db_response(prop: Property, query: str) -> dict:
    provider_data = get_map_provider().get_property_map(prop.id) or {}

    property_data = prop.to_dict()
    property_data["source"] = "rosreestr_parser" if prop.cadastral_number else "db"

    return {
        "query": query,
        "source": "db",
        "address": prop.address,
        "center": {
            "latitude": prop.latitude,
            "longitude": prop.longitude,
        },
        "surroundings": provider_data.get("surroundings") or [],
        "failed": [],
        "radius_m": current_app.config.get("GEO_SEARCH_RADIUS", 3000),
        "markers": provider_data.get("markers") or [],
        "property": property_data,
        "cadastral": _cadastral_from_property(prop),
        "cadastral_error": None,
        "cadastral_message": None,
    }


@bp.get("/search")
def map_search():
    q = str(request.args.get("q", "")).strip()
    return get_map_provider().search(q)


@bp.get("/property/<int:property_id>")
def property_map_context(property_id):
    data = get_map_provider().get_property_map(property_id)
    if data is None:
        return {"error": "property_not_found"}, 404
    return data


@bp.get("/property/<int:property_id>/markers")
def property_markers(property_id):
    data = get_map_provider().get_property_map(property_id)
    if data is None:
        return {"error": "property_not_found"}, 404
    return {
        "property_id": data["property_id"],
        "center": data["center"],
        "markers": data["markers"],
        "source": data.get("source", "demo"),
    }


@bp.get("/document-points")
def document_points():
    property_id = request.args.get("property_id", type=int)
    provider = get_map_provider()
    if property_id is not None:
        data = provider.get_property_map(property_id)
        if data is None:
            return {"error": "property_not_found"}, 404
        return {
            "source": data.get("source", "demo"),
            "property_id": property_id,
            "categories": data.get("place_categories") or [],
        }

    first = db.session.scalar(db.select(Property).order_by(Property.id).limit(1))
    if first is None:
        return {"source": "demo", "categories": []}

    data = provider.get_property_map(first.id) or {}
    return {
        "source": data.get("source", "demo"),
        "categories": data.get("place_categories") or [],
    }


@bp.get("/lookup")
def map_lookup_with_property():
    q = str(request.args.get("q", "")).strip()
    if not q:
        return {"error": "query_required"}, 400
    map_data = get_map_provider().search(q)
    prop = get_property_provider().lookup_by_address(q)
    return {
        "query": q,
        "map": map_data,
        "property": prop.to_dict() if prop else None,
    }


@bp.get("/config")
def map_config():
    return {
        "yandex_js_api_key": current_app.config.get("YANDEX_JS_API_KEY", ""),
        "radius_m": current_app.config.get("GEO_SEARCH_RADIUS", 3000),
    }


@bp.get("/geo-lookup")
def geo_lookup():
    query = str(request.args.get("q", "")).strip()
    if not query:
        return {"error": "query_required"}, 400

    # Главное изменение:
    # для заранее загруженных адресов сразу отдаём SQLite,
    # не вызывая геокодер, OpenStreetMap и parser Росреестра.
    prop = _find_property_in_db(query)
    if prop is not None:
        return _db_response(prop, query)

    lat_arg = request.args.get("lat", type=float)
    lon_arg = request.args.get("lon", type=float)

    try:
        found = geocode(query)
        if found is not None and lat_arg is not None and lon_arg is not None:
            found = {**found, "lat": lat_arg, "lon": lon_arg}
    except GeocoderNotConfigured as e:
        return {"error": "geocoder_not_configured", "message": str(e)}, 503
    except Exception:
        return {
            "error": "geocoder_failed",
            "message": "Сервис геокодирования недоступен",
        }, 502

    if found is None:
        if lat_arg is None or lon_arg is None:
            return {
                "error": "address_not_found",
                "message": "Адрес не найден",
            }, 404
        found = {
            "lat": lat_arg,
            "lon": lon_arg,
            "address": f"Точка на карте ({lat_arg:.4f}, {lon_arg:.4f})",
        }

    radius = current_app.config.get("GEO_SEARCH_RADIUS", 3000)
    surroundings = build_surroundings(found["lat"], found["lon"], radius)

    local_property = None
    try:
        prop = get_property_provider().lookup_by_address(query)
        if prop is not None:
            local_property = prop.to_dict()
    except Exception:
        local_property = None

    cadastral = None
    cadastral_error = None
    cadastral_message = None

    if local_property is None and request.args.get("cadastral", "1") != "0":
        try:
            parsed = parse_by_coords(found["lat"], found["lon"])
            if parsed is not None:
                cadastral = normalize_parser_result(parsed)
            else:
                cadastral_error = "not_found"
        except ParserUnavailable as e:
            cadastral_error = "unavailable"
            cadastral_message = str(e)
            current_app.logger.info("Парсер Росреестра недоступен: %s", e)

    return {
        "query": query,
        "source": "yandex+osm",
        "address": found["address"],
        "center": {"latitude": found["lat"], "longitude": found["lon"]},
        "surroundings": surroundings["items"],
        "failed": surroundings["failed"],
        "radius_m": surroundings["radius_m"],
        "markers": markers_from_surroundings(
            found["lat"], found["lon"], found["address"], surroundings["items"]
        ),
        "property": local_property,
        "cadastral": cadastral,
        "cadastral_error": cadastral_error,
        "cadastral_message": cadastral_message,
    }


@bp.get("/offices")
def nearby_offices():
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)
    if lat is None or lon is None:
        return {
            "error": "coordinates_required",
            "message": "Нужны координаты объекта",
        }, 400

    radius = request.args.get("radius", type=int) or DEFAULT_PLACES_RADIUS
    result = search_offices(lat, lon, radius)
    return {
        "source": "osm",
        "center": {"latitude": lat, "longitude": lon},
        "categories": result["categories"],
        "failed": result["failed"],
        "radius_m": result["radius_m"],
    }
