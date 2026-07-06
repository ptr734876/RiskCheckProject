from typing import Optional

from flask import Blueprint, jsonify, request

router = Blueprint("materials", __name__, url_prefix="/materials")

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

# Вернуть статьи: все или отфильтрованные по поисковому запросу
@router.route("/", methods=["GET"])
def get_articles():
    search = request.args.get("search")
    if search:
        filtered = [
            a for a in ARTICLES
            if search.lower() in a["title"].lower()
            or search.lower() in a["description"].lower()
        ]
        return jsonify({"articles": filtered})
    return jsonify({"articles": ARTICLES})

# Вернуть одну статью по идентификатору
@router.route("/<article_id>", methods=["GET"])
def get_article(article_id: str):
    for a in ARTICLES:
        if a["id"] == article_id:
            return jsonify(a)
    return jsonify({"detail": "Article not found"}), 404