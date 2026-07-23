from __future__ import annotations

import os

import requests

GEOCODER_URL = "https://geocode-maps.yandex.ru/1.x/"

REQUEST_TIMEOUT = 15


class GeocoderNotConfigured(RuntimeError):
    """Ключ Яндекс.Геокодера не задан."""


def geocode(address: str) -> dict | None:
    address = (address or "").strip()
    if not address:
        return None

    api_key = os.getenv("YANDEX_GEOCODER_KEY", "").strip()
    if not api_key:
        raise GeocoderNotConfigured(
            "Не задан YANDEX_GEOCODER_KEY. Получите ключ Geocoder API "
            "в кабинете разработчика Яндекса и добавьте его в .env"
        )

    response = requests.get(
        GEOCODER_URL,
        params={
            "apikey": api_key,
            "geocode": address,
            "format": "json",
            "results": 1,
            "lang": "ru_RU",
        },
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()

    data = response.json()

    try:
        members = data["response"]["GeoObjectCollection"]["featureMember"]
    except (KeyError, TypeError):
        return None

    if not members:
        return None

    geo_object = members[0]["GeoObject"]

    lon_str, lat_str = geo_object["Point"]["pos"].split()

    meta = geo_object.get("metaDataProperty", {}).get("GeocoderMetaData", {})
    full_address = meta.get("text") or geo_object.get("name") or address

    return {
        "lat": float(lat_str),
        "lon": float(lon_str),
        "address": full_address,
    }
