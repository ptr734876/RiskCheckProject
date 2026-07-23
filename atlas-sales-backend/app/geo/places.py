from __future__ import annotations

from app.geo.overpass import (
    QUERY_TIMEOUT,
    _coords_of,
    _run_query,
    distance_m,
)

DEFAULT_PLACES_RADIUS = 10000

DEFAULT_LIMIT = 4


def _query_offices(lat: float, lon: float, radius: int) -> str:


    return f"""
[out:json][timeout:{QUERY_TIMEOUT}];

(
  nwr["office"="government"](around:{radius},{lat},{lon});
  nwr["amenity"="public_building"](around:{radius},{lat},{lon});
  nwr["government"](around:{radius},{lat},{lon});
);

out center;
"""


MFC_MARKERS = (
    "мфц",
    "мои документы",
    "многофункциональный центр",
    "мои док",
)

ROSREESTR_MARKERS = (
    "росреестр",
    "кадастров",
    "регистрации, кадастра",
    "бти",
)


def _classify_office(tags: dict) -> str | None:

    name = (tags.get("name") or "").lower()
    operator = (tags.get("operator") or "").lower()
    haystack = f"{name} {operator}"

    if any(marker in haystack for marker in ROSREESTR_MARKERS):
        return "rosreestr_office"

    if any(marker in haystack for marker in MFC_MARKERS):
        return "mfc"

    if tags.get("government") == "public_service" and name:
        return "mfc"

    return None


def _build_address(tags: dict) -> str:

    street = tags.get("addr:street", "").strip()
    house = tags.get("addr:housenumber", "").strip()
    city = tags.get("addr:city", "").strip()

    parts = []
    if street:
        parts.append(f"{street}, {house}" if house else street)
    if city and street:
        parts.insert(0, city)
    elif city:
        parts.append(city)

    return ", ".join(parts)


def _working_hours(tags: dict) -> str:

    return (tags.get("opening_hours") or "").strip()


def search_offices(
    lat: float,
    lon: float,
    radius: int = DEFAULT_PLACES_RADIUS,
    limit: int = DEFAULT_LIMIT,
) -> dict:

    buckets: dict[str, list[dict]] = {"mfc": [], "rosreestr_office": []}
    failed = False

    try:
        data = _run_query(_query_offices(lat, lon, radius))
    except RuntimeError:
        data = {"elements": []}
        failed = True

    seen: set[tuple] = set()

    for element in data.get("elements", []):
        tags = element.get("tags", {})

        category = _classify_office(tags)
        if category is None:
            continue

        obj_lat, obj_lon = _coords_of(element)
        if obj_lat is None:
            continue

        name = (tags.get("name") or "").strip()
        if not name:
            continue

        key = (name, round(obj_lat, 4), round(obj_lon, 4))
        if key in seen:
            continue
        seen.add(key)

        buckets[category].append(
            {
                "name": name,
                "address": _build_address(tags),
                "working_hours": _working_hours(tags),
                "distance_m": distance_m(lat, lon, obj_lat, obj_lon),
                "latitude": obj_lat,
                "longitude": obj_lon,
            }
        )

    for items in buckets.values():
        items.sort(key=lambda x: x["distance_m"])

    categories = [
        {
            "id": "mfc",
            "title": "МФЦ",
            "subtitle": "Ближайшие центры получения документов",
            "places": buckets["mfc"][:limit],
        },
        {
            "id": "rosreestr_office",
            "title": "Росреестр / кадастровая палата",
            "subtitle": "Офисы для подачи и получения документов",
            "places": buckets["rosreestr_office"][:limit],
        },
    ]

    return {"categories": categories, "failed": failed, "radius_m": radius}
