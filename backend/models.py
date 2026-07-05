from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict
''' Избавляет от питоноской проблемы с типами данных, проверяет их и выдает ошибки валидации
BaseModel - базовый класс для моделей данных
Иммет множество методово и классов для работы с данными их валидации и тп'''

# AUTH
# класс для валидации данных при регистрации
class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)

# класс для валидации данных при логине
class UserLogin(BaseModel):
    username: str
    password: str

# такой ответ будет возвращаться при успешной авторизации
# затем сохранится на стороне пользователя
# токен будет отправляться с каждым запросом нам в заголовке Authorization
class TokenResponse(BaseModel): 
    access_token: str
    token_type: str = "bearer"

# MAPPING
# Юр информация объекта, публичная - словарь название элемента+сам элемент
# приватная тот же принцип но может отсутствовать
class LegalInfo(BaseModel):
    public: List[str]
    private: Optional[List[str]] = None

# окружающие объекты, индекс объекта и его описание, может быть пустым
class Surroundings(BaseModel):
    surround_object: Optional[List[Dict[int, str]]] = None

# Полная информация об объекте недвижимости
class Property(BaseModel):
    id: int
    x: int
    y: int
    address: str
    type: str
    area: str
    legal: LegalInfo
    surroundings: Surroundings

# результаты поиска, должно заполняться при интерактивном взаимодействии с картой
# тут и информация о найденном объекте и его координаты
class SearchResult(BaseModel):
    property: Optional[Property]

#  DOCUMENTS
# Шаблон документа
class Document(BaseModel):
    title: str
    note: str
    required: bool = False
    link: Optional[str] = None
    checked: bool = False

# для интерактивных галочек на странице - как в макете
class ToggleRequest(BaseModel):
    checked: bool

# объект мфц, и для клиента и для объекта продаж
class MFCLocation(BaseModel):
    name: str
    address: str
    time: str
    distance: str

#   MATERIALS
# Объект статьи\полезного материала
class Article(BaseModel):
    id: str
    title: str
    description: str
    content: List[str]

#   ALGORITHMS
# класс для шага любого алгоритма
class AlgorithmStep(BaseModel):
    step: int
    title: str
    description: str
    is_completed: bool = False

# класс для самого алгоритма
class Algorithm(BaseModel):
    id: int
    title: str
    description: str
    steps: List[AlgorithmStep]
    total_steps: int
    completed_steps: int