from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, documents, materials, algorithms, mapping

app = FastAPI(title="RiskCheck API", version="1.0.0")

# Разрешение браузеру от сервера на отправку запросов
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # определяет список доменов которым можно обращаться
    allow_credentials=True, # разрешение на отправку токенов вместе с запросами
    allow_methods=["*"], # определяет какими методами браузеру можно общаться с сервером
    allow_headers=["*"], # определяет какие заголовки может закреплять браузер
)

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(mapping.router)
app.include_router(documents.router)
app.include_router(materials.router)
app.include_router(algorithms.router)

# Для быстрой проверки работы сервиса
@app.get("/")
async def root():
    return {"message": "RiskCheck API is running"}

# Проверка состояния сервиса
@app.get("/health")
async def health():
    return {"status": "ok"}

# Получаем все варианты дальнейшей работы
@app.get("/variants")
async def get_variants():
    return {
        "variants": [
            {"id": 0, "label": "Вариант 1", "description": "Оценка и аналитика объекта"},
            {"id": 1, "label": "Вариант 2", "description": "Документы для продажи"},
            {"id": 2, "label": "Вариант 3", "description": "Полезные материалы"},
            {"id": 3, "label": "Вариант 4", "description": "Алгоритмы"}
        ]
    }