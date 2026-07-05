from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from backend.models import Document, ToggleRequest, MFCLocation

router = APIRouter(prefix="/documents", tags=["Documents"])

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

# Хранилище состояний галочек, подгружать из бд, только по кнкретному пользователю
# передавать имя пользователя, id доков которые отмечены
user_checks: dict[str, set] = {}

# просто список документов с их статусом
@router.get("/")
async def get_documents(user_id: Optional[str] = None):
    checked_titles = user_checks.get(user_id, set()) if user_id else set()
    
    # создаем список документов с состояниями того прочерены ли они
    docs = []
    for doc in DOCUMENTS:
        doc_copy = doc.copy()
        doc_copy["checked"] = doc["title"] in checked_titles
        docs.append(doc_copy)
    
    return {
        "documents": docs,
        "total": len(docs),
        "checked_count": sum(1 for d in docs if d["checked"])
    }

# переключение статуса состояния документов
@router.patch("/{doc_title}/toggle")
async def toggle_document(doc_title: str, request: ToggleRequest, user_id: str):
    if doc_title not in [d["title"] for d in DOCUMENTS]:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if user_id not in user_checks:
        user_checks[user_id] = set()
    
    if request.checked:
        user_checks[user_id].add(doc_title)
    else:
        user_checks[user_id].discard(doc_title)
    
    return {
        "message": f"Document {'checked' if request.checked else 'unchecked'}",
        "checked": request.checked,
        "total_checked": len(user_checks[user_id])
    }

# возвращает список МФЦ
@router.get("/mfc")
async def get_mfc():
    return {"locations": MFC_LOCATIONS}

# расчет процента собранных доков (мб не надо выше тоггл докс может тоже самое сделать впринципе)
@router.get("/stats")
async def get_stats(user_id: Optional[str] = None):
    total = len(DOCUMENTS)
    checked = len(user_checks.get(user_id, set())) if user_id else 0
    return {
        "total": total,
        "checked": checked,
        "unchecked": total - checked,
        "progress": round((checked / total * 100) if total > 0 else 0, 1)
    }