from fastapi import APIRouter, HTTPException
from typing import Optional
from backend.models import Article

router = APIRouter(prefix="/materials", tags=["Materials"])

ARTICLES = [
    {
        "id": "egrn",
        "title": "Выписка из ЕГРН",
        "description": "Как получить и что содержит",
        "content": [
            "Выписка из ЕГРН — официальный документ о праве собственности.",
            "Способы получения: через Госуслуги, МФЦ, Росреестр.",
            "Срок действия: 30 дней.",
            "Стоимость: 400-800 рублей."
        ]
    },
    {
        "id": "passport",
        "title": "Паспорт собственника",
        "description": "Требования к копии паспорта",
        "content": [
            "Копия всех страниц с отметками.",
            "Заверение нотариусом или сверка с оригиналом."
        ]
    },
    {
        "id": "bti",
        "title": "Технический паспорт БТИ",
        "description": "Заказ и получение",
        "content": [
            "Содержит планы помещений и характеристики.",
            "Заказ в БТИ или МФЦ.",
            "Срок: до 14 рабочих дней."
        ]
    },
    {
        "id": "jkx",
        "title": "Справка об отсутствии задолженности по ЖКХ",
        "description": "Где и как получить",
        "content": [
            "Выдаётся управляющей компанией.",
            "Срок действия: 30 дней."
        ]
    }
]

# выписать статьи либо все либо соответствующие поисковой строке
@router.get("/")
async def get_articles(search: Optional[str] = None):
    if search:
        filtered = [
            a for a in ARTICLES 
            if search.lower() in a["title"].lower() 
            or search.lower() in a["description"].lower()
        ]
        return {"articles": filtered}
    return {"articles": ARTICLES}

# переход по конкретной статье чтобы прочитать ее
@router.get("/{article_id}")
async def get_article(article_id: str):
    for a in ARTICLES:
        if a["id"] == article_id:
            return a
    raise HTTPException(status_code=404, detail="Article not found")