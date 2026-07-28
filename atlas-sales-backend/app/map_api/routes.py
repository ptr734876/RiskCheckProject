from flask import Blueprint, current_app, request
from app.geo.geocoder import GeocoderNotConfigured, geocode
from app.geo.rosreestr_parser import (
    ParserUnavailable,
    normalize_parser_result,
    parse_by_coords,
)
from app.geo.places import DEFAULT_PLACES_RADIUS, search_offices
from app.geo.services import build_surroundings, markers_from_surroundings
from app.map_api.provider import get_map_provider
from app.rosreestr import get_property_provider
bp = Blueprint("map_api", __name__, url_prefix="/api/map")

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
    from app.extensions import db
    from app.models import Property
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

    lat_arg = request.args.get("lat", type=float)
    lon_arg = request.args.get("lon", type=float)

    def format_distance(distance_m) -> str:
        try:
            distance_m = int(round(float(distance_m or 0)))
        except (TypeError, ValueError):
            distance_m = 0

        if distance_m >= 1000:
            return f"{distance_m / 1000:.1f} км".replace(".", ",")
        return f"{distance_m} м"

    def haversine_m(lat1, lon1, lat2, lon2) -> int:
        import math

        r = 6371000
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        d_phi = math.radians(lat2 - lat1)
        d_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(d_phi / 2) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return int(round(r * c))

    def normalize_address(value: str) -> str:
        import re

        value = (value or "").lower().replace("ё", "е")
        return re.sub(r"[^0-9a-zа-я]+", "", value)

    def find_property_by_address(query: str):
        from app.extensions import db
        from app.models import Property

        normalized_query = normalize_address(query)
        if len(normalized_query) < 4:
            return None

        properties = db.session.scalars(
            db.select(Property).order_by(Property.id)
        ).all()

        for prop in properties:
            normalized_address = normalize_address(prop.address)
            if normalized_query in normalized_address or normalized_address in normalized_query:
                return prop

        return None

    def build_markers_from_db(lat, lon, address, surroundings):
        markers = [
            {
                "type": "property",
                "label": address,
                "latitude": lat,
                "longitude": lon,
            }
        ]

        for item in surroundings:
            markers.append(
                {
                    "type": "positive" if item["type"] == "plus" else "risk",
                    "kind": item["kind"],
                    "label": item["name"],
                    "distance_m": item["distance_m"],
                    "latitude": item["latitude"],
                    "longitude": item["longitude"],
                }
            )

        return markers

    def find_db_surroundings(lat, lon, radius_m):
        from app.extensions import db
        from app.models import NearbyObject

        objects = db.session.scalars(
            db.select(NearbyObject).where(
                NearbyObject.latitude.is_not(None),
                NearbyObject.longitude.is_not(None),
            )
        ).all()

        found_by_key = {}

        for obj in objects:
            distance_m = haversine_m(
                lat,
                lon,
                obj.latitude,
                obj.longitude,
            )

            if distance_m > radius_m:
                continue

            category = obj.category or "risk"
            item_type = "plus" if category == "positive" else "minus"

            item = {
                "kind": obj.kind,
                "name": obj.name,
                "category": category,
                "type": item_type,
                "distance_m": distance_m,
                "distance_text": format_distance(distance_m),
                "latitude": obj.latitude,
                "longitude": obj.longitude,
                "impact": None,
                "tip": None,
                "link": None,
            }

            # Убираем дубли: один и тот же объект мог попасть в БД от разных адресов.
            key = (
                obj.kind,
                obj.name.lower().strip(),
                round(float(obj.latitude or 0), 5),
                round(float(obj.longitude or 0), 5),
            )

            old = found_by_key.get(key)
            if old is None or item["distance_m"] < old["distance_m"]:
                found_by_key[key] = item

        items = list(found_by_key.values())

        # Сначала плюсы, потом минусы; внутри — по расстоянию.
        items.sort(key=lambda x: (0 if x["type"] == "plus" else 1, x["distance_m"]))

        return items

    radius = current_app.config.get("GEO_SEARCH_RADIUS", 3000)

    found = None
    local_property = None

    # 1. Если пришли координаты, геокодер вообще не нужен.
    if lat_arg is not None and lon_arg is not None:
        found = {
            "lat": lat_arg,
            "lon": lon_arg,
            "address": query or f"Точка на карте ({lat_arg:.4f}, {lon_arg:.4f})",
        }

    # 2. Если ввели адрес, сначала пробуем найти сам объект в БД.
    # Тогда не нужен даже Яндекс-геокодер.
    if found is None:
        local_property = find_property_by_address(query)
        if local_property is not None:
            found = {
                "lat": local_property.latitude,
                "lon": local_property.longitude,
                "address": local_property.address,
            }

    # 3. Если в БД такого адреса нет, только тогда геокодируем адрес.
    if found is None:
        try:
            found = geocode(query)
        except GeocoderNotConfigured as e:
            return {"error": "geocoder_not_configured", "message": str(e)}, 503
        except Exception:
            return {
                "error": "geocoder_failed",
                "message": "Сервис геокодирования недоступен",
            }, 502

    if found is None:
        return {
            "error": "address_not_found",
            "message": "Адрес не найден",
        }, 404

    # 4. Сначала ищем окружение рядом с координатами в нашей БД.
    # ВАЖНО: парсер Росреестра здесь НЕ вызывается, чтобы карта и факты об окружении
    # отображались быстро. Юридические данные нужно грузить отдельным запросом
    # /api/map/cadastral-lookup.
    db_surroundings = find_db_surroundings(
        found["lat"],
        found["lon"],
        radius,
    )

    if db_surroundings:
        if local_property is None:
            local_property = find_property_by_address(query)

        property_data = (
            local_property.to_dict(include_nearby=True)
            if local_property is not None
            else None
        )

        if property_data is not None:
            property_data["source"] = "db"

        return {
            "query": query,
            "source": "db_nearby",
            "address": found["address"],
            "center": {
                "latitude": found["lat"],
                "longitude": found["lon"],
            },
            "surroundings": db_surroundings,
            "failed": [],
            "radius_m": radius,
            "markers": build_markers_from_db(
                found["lat"],
                found["lon"],
                found["address"],
                db_surroundings,
            ),
            "property": property_data,
            "cadastral": None,
            "cadastral_error": None,
            "cadastral_message": None,
        }

    # 5. Если в БД рядом ничего нет — только тогда идём во внешние API для окружения.
    # Парсер Росреестра всё равно НЕ вызывается здесь: он вынесен в отдельный endpoint.
    surroundings = build_surroundings(found["lat"], found["lon"], radius)

    local_property_data = None
    try:
        prop = get_property_provider().lookup_by_address(query)
        if prop is not None:
            local_property_data = prop.to_dict()
    except Exception:
        local_property_data = None

    return {
        "query": query,
        "source": "yandex+osm",
        "address": found["address"],
        "center": {
            "latitude": found["lat"],
            "longitude": found["lon"],
        },
        "surroundings": surroundings["items"],
        "failed": surroundings["failed"],
        "radius_m": surroundings["radius_m"],
        "markers": markers_from_surroundings(
            found["lat"],
            found["lon"],
            found["address"],
            surroundings["items"],
        ),
        "property": local_property_data,
        "cadastral": None,
        "cadastral_error": None,
        "cadastral_message": None,
    }


@bp.get("/cadastral-lookup")
def cadastral_lookup():
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)

    if lat is None or lon is None:
        return {
            "error": "coordinates_required",
            "message": "Нужны координаты объекта",
        }, 400

    if request.args.get("cadastral", "1") == "0":
        return {
            "cadastral": None,
            "cadastral_error": None,
            "cadastral_message": None,
        }

    try:
        parsed = parse_by_coords(lat, lon)
        if parsed is not None:
            return {
                "cadastral": normalize_parser_result(parsed),
                "cadastral_error": None,
                "cadastral_message": None,
            }

        return {
            "cadastral": None,
            "cadastral_error": "not_found",
            "cadastral_message": "Публичная кадастровая карта не нашла объект по этим координатам",
        }
    except ParserUnavailable as e:
        current_app.logger.info("Парсер Росреестра недоступен: %s", e)
        return {
            "cadastral": None,
            "cadastral_error": "unavailable",
            "cadastral_message": str(e),
        }
    except Exception as e:
        current_app.logger.exception("Ошибка при получении кадастровых данных")
        return {
            "cadastral": None,
            "cadastral_error": "failed",
            "cadastral_message": str(e),
        }


@bp.get("/offices")
def nearby_offices():
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)
    if lat is None or lon is None:
        return {"error": "coordinates_required",
                "message": "Нужны координаты объекта"}, 400
    radius = request.args.get("radius", type=int) or DEFAULT_PLACES_RADIUS
    result = search_offices(lat, lon, radius)
    return {
        "source": "osm",
        "center": {"latitude": lat, "longitude": lon},
        "categories": result["categories"],
        "failed": result["failed"],
        "radius_m": result["radius_m"],
    }
