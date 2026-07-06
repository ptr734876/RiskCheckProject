from typing import Optional, Dict

from flask import Blueprint, jsonify, request

router = Blueprint("mapping", __name__, url_prefix="/mapping")

# Пример данных, позже их можно заменить на данные из базы
PROPERTIES = [
    {
        "id": 1,
        "x": 148,
        "y": 92,
        "address": "ул. Садовая, 14",
        "type": "Квартира",
        "area": "68 м^2",
        "legal": {
            "public": [
                {"Кадастровый номер": "77:01:0001234:56"},
                {"Граница и координаты": "установлены"},
                {"Площадь объекта": "68.4 кв.м"},
                {"Категория земель и ВРИ": "земли населённых пунктов"},
                {"Форма собственности": "индивидуальная"},
                {"Обременения и ограничения": "нет"},
                {"Природные территории": "отсутствуют"}
            ],
            "private": [
                {"Собственник": "Иванов Иван Иванович"},
                {"Документы проверены": "12.06.2025"}
            ]
        },
        "surroundings": {
            "surround_object": [
                {1: "Метро «Садовая» — 300 м"},
                {2: "Детский сад №15 — 500 м"},
                {3: "Школа №7 — 800 м"},
                {4: "Парк «Центральный» — 1.2 км"},
                {5: "Железная дорога — 1.8 км"},
                {6: "Промышленная зона — 2.5 км"}
            ]
        }
    },
]

# Вспомогательные функции

# Найти ближайший объект к заданным координатам
def find_closest_property(x:int, y:int, threshold: int = 50) -> Optional[Dict]:
    closest = None
    min_distance = float('inf')

    for prop in PROPERTIES:
        distance = ((prop["x"] - x) ** 2 + (prop["y"] - y) ** 2) ** 0.5
        if distance < min_distance and distance <= threshold:
            min_distance = distance
            closest = prop

    return closest

# Найти объект по адресу
def find_property_by_address(query: str) -> Optional[Dict]:
    for p in PROPERTIES:
        if query.lower() in p['address'].lower():
            return p
    return None

# Вернуть список объектов
@router.route("/properties", methods=["GET"])
def get_properties():
    return jsonify({"properties": PROPERTIES})

# Вернуть информацию по выбранному объекту
@router.route("/properties/<int:property_id>", methods=["GET"])
def get_property(property_id: int):
    for p in PROPERTIES:
        if p["id"] == property_id:
            return jsonify(p)
    return jsonify({"detail": "Property not found"}), 404

# Найти объект по строке поиска
@router.route("/search", methods=["GET"])
def search_property():
    query = request.args.get("query", "")
    found = next((p for p in PROPERTIES if query.lower() in p["address"].lower()), None)
    if found:
        return jsonify({"property": found, "location": {"x": found["x"], "y": found["y"]}})
    return jsonify({"property": None, "location": None})