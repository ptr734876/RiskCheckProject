from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

from app import create_app
from app.extensions import db
from app.models import NearbyObject, Property


DATA_FILE = Path(__file__).with_name("addresses_geo_data.json")


def _as_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _as_float(value: Any) -> float | None:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _category(item: dict[str, Any]) -> str:
    category = item.get("category")
    if category in {"positive", "risk"}:
        return category

    item_type = item.get("type")
    if item_type in {"plus", "positive"}:
        return "positive"
    if item_type in {"minus", "risk"}:
        return "risk"

    return "positive"


def _load_payload(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(
            f"Не найден файл {path}. Положите addresses_geo_data.json рядом с этим скриптом."
        )

    payload = json.loads(path.read_text(encoding="utf-8"))

    if isinstance(payload, dict):
        payload = [{"requested_address": payload.get("query"), "status_code": 200, "data": payload}]

    if not isinstance(payload, list):
        raise ValueError("Ожидался JSON-список адресов.")

    return payload


def seed_real_addresses(path: Path = DATA_FILE) -> None:
    payload = _load_payload(path)

    # Удаляем старые демонстрационные объекты недвижимости и их окружение.
    # Пользователей, документы, материалы и другой контент не трогаем.
    db.session.query(NearbyObject).delete(synchronize_session=False)
    db.session.query(Property).delete(synchronize_session=False)
    db.session.flush()

    created_properties = 0
    created_nearby = 0
    skipped = 0

    for entry in payload:
        status_code = entry.get("status_code")
        data = entry.get("data") or {}

        if status_code != 200:
            skipped += 1
            print(f"Пропускаю {entry.get('requested_address')}: status_code={status_code}")
            continue

        center = data.get("center") or {}
        latitude = _as_float(center.get("latitude"))
        longitude = _as_float(center.get("longitude"))

        if latitude is None or longitude is None:
            skipped += 1
            print(f"Пропускаю {entry.get('requested_address')}: нет координат")
            continue

        address = (
            data.get("address")
            or entry.get("requested_address")
            or data.get("query")
            or "Адрес не указан"
        )

        prop = Property(
            address=address,
            cadastral_number=data.get("cadastral"),
            area=None,
            property_type="apartment",
            ownership_type=None,
            boundaries_status=None,
            land_category=None,
            permitted_use=None,
            encumbrances=None,
            owner_name=None,
            checked_at=str(date.today()),
            latitude=latitude,
            longitude=longitude,
        )
        db.session.add(prop)
        db.session.flush()

        created_properties += 1

        surroundings = data.get("surroundings") or []

        for item in surroundings:
            name = (
                item.get("name")
                or item.get("label")
                or item.get("title")
                or "Объект окружения"
            )

            nearby = NearbyObject(
                property_id=prop.id,
                kind=(item.get("kind") or "other")[:50],
                name=str(name)[:200],
                category=_category(item)[:20],
                distance_m=_as_int(item.get("distance_m")),
                latitude=_as_float(item.get("latitude")),
                longitude=_as_float(item.get("longitude")),
            )
            db.session.add(nearby)
            created_nearby += 1

    db.session.commit()

    print()
    print("Готово.")
    print(f"Добавлено объектов недвижимости: {created_properties}")
    print(f"Добавлено объектов окружения: {created_nearby}")
    print(f"Пропущено адресов: {skipped}")


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        seed_real_addresses()
