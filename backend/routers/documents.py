from typing import Optional

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from backend.models import ToggleRequest

router = Blueprint("documents", __name__, url_prefix="/documents")

DOCUMENTS = [
    {"title": "Выписка из ЕГРН", "note": "Срок действия — 30 дней с момента получения", "required": True, "link": "egrn"},
    {"title": "Паспорт собственника", "note": "Все страницы, включая прописку", "required": True},
    {"title": "Технический паспорт / план БТИ", "note": "При наличии перепланировок — обязательно", "required": True},
    {"title": "Справка об отсутствии задолженности по ЖКХ", "note": "Выдаётся управляющей компанией", "required": True},
]

MFC_LOCATIONS = [
    {"name": "МФЦ «Мои документы»", "address": "ул. Ленина, 45", "time": "9:00–20:00", "distance": "0.8 км"},
    {"name": "МФЦ Центральный", "address": "пр. Победы, 12", "time": "8:00–20:00", "distance": "1.4 км"},
    {"name": "МФЦ «Гражданин»", "address": "ул. Советская, 88", "time": "9:00–18:00", "distance": "2.1 км"},
]

# Хранилище отметок документов по пользователю.
user_checks: dict[str, set] = {}

# Список документов с текущим состоянием отметок
@router.route("/", methods=["GET"])
def get_documents():
    user_id = request.args.get("user_id")
    checked_titles = user_checks.get(user_id, set()) if user_id else set()

    # создаем список документов с состояниями того прочерены ли они
    docs = []
    for doc in DOCUMENTS:
        doc_copy = doc.copy()
        doc_copy["checked"] = doc["title"] in checked_titles
        docs.append(doc_copy)

    return jsonify({
        "documents": docs,
        "total": len(docs),
        "checked_count": sum(1 for d in docs if d["checked"])
    })

# Переключение статуса документа
@router.route("/<doc_title>/toggle", methods=["PATCH"])
def toggle_document(doc_title: str):
    if doc_title not in [d["title"] for d in DOCUMENTS]:
        return jsonify({"detail": "Document not found"}), 404

    payload = request.get_json(silent=True) or {}
    try:
        request_data = ToggleRequest.model_validate(payload)
    except ValidationError as exc:
        return jsonify({"detail": exc.errors()}), 400

    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"detail": "user_id is required"}), 400

    if user_id not in user_checks:
        user_checks[user_id] = set()

    if request_data.checked:
        user_checks[user_id].add(doc_title)
    else:
        user_checks[user_id].discard(doc_title)

    return jsonify({
        "message": f"Document {'checked' if request_data.checked else 'unchecked'}",
        "checked": request_data.checked,
        "total_checked": len(user_checks[user_id])
    })

# Получить список МФЦ
@router.route("/mfc", methods=["GET"])
def get_mfc():
    return jsonify({"locations": MFC_LOCATIONS})

# Получить прогресс по собранным документам
@router.route("/stats", methods=["GET"])
def get_stats():
    user_id = request.args.get("user_id")
    total = len(DOCUMENTS)
    checked = len(user_checks.get(user_id, set())) if user_id else 0
    return jsonify({
        "total": total,
        "checked": checked,
        "unchecked": total - checked,
        "progress": round((checked / total * 100) if total > 0 else 0, 1)
    })