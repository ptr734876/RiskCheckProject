from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict
from backend.models import LegalInfo, Surroundings, Property, SearchResult
router = APIRouter(prefix="/mapping", tags=["Mapping"])

# пример данныйх, затем следует подгружать из базы данных
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

# Хелперы

# простой механизм чтобы найти ближайший объект к заданому адресу
def find_closest_property(x:int, y:int, threshold: int = 50) -> Optional[Dict]:
    closest = None
    min_distance = float('inf')

    for prop in PROPERTIES:
        distance = ((prop["x"] - x) ** 2 + (prop["y"] - y) ** 2) ** 0.5
        if distance < min_distance and distance <= threshold:
            min_distance = distance
            closest = prop

    return closest

# поиск по конкретному адресу
def find_property_by_address(query: str) -> Optional[Dict]:
    for p in PROPERTIES:
        if query.lower() in p['address'].lower():
            return p
    return None

# Возвращает список объектов по запросу пользователя
@router.get("/properties")
async def get_properties():
    return {"properties": PROPERTIES}

# Получение информации по выбранному объекту
@router.get("/properties/{property_id}")
async def get_property(property_id: int):
    for p in PROPERTIES:
        if p["id"] == property_id:
            return p
    raise HTTPException(status_code=404, detail="Property not found")

# ищем по тому, что написано в поиске
@router.get("/search")
async def search_property(query: str):
    found = next((p for p in PROPERTIES if query.lower() in p["address"].lower()), None)
    if found:
        return {"property": found, "location": {"x": found["x"], "y": found["y"]}}
    return {"property": None, "location": None}