
import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///atlas.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False

    # Ключ Geocoder API — используется на бэкенде для поиска адреса.
    YANDEX_GEOCODER_KEY = os.getenv("YANDEX_GEOCODER_KEY", "")

    # Ключ JavaScript API — отдаётся фронтенду для отрисовки карты.
    YANDEX_JS_API_KEY = os.getenv("YANDEX_JS_API_KEY", "")

    # Радиус поиска объектов окружения, м.
    GEO_SEARCH_RADIUS = int(os.getenv("GEO_SEARCH_RADIUS", "3000"))
