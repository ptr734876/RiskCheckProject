# страница авторизации и регистрации пользователей
from backend.models import UserRegister, UserLogin, TokenResponse
from fastapi import APIRouter, HTTPException, Depends
'''
APIRouter - класс построения роутеров в FastApi
HttpException - класс для генерации ошибок с кодами и сообщениями
Depends - класс для внедрения зависимостей в эндпоинты
По простому на примере текущего кода:
get_me(current_user: dict = Depends(get_current_user)
прежде чем принимать параметр для работы в методе он отправится на обработку 
в метод get_current_user и вернет результат в current_user, это может происходить рекурсивно
'''

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
''' HTTPBearer - извлекает токен из заголовка Authorization
получает что то вроде 'Authorization: Bearer ey...8E' на вход 
извлекает закоголовок проверяет что схема Bearer и возвращает токен в виде строки
HTTPAuthorizationCredentials - класс для работы с токенами'''

import jwt
''' Http не хранит информацию о ссесии, тоесть сервер не знает кто отправляет ему запрос
поэтому для идентификации используются токены, в данном случае JWT (JSON Web Token)
он отправляется с каждым запросом пользователя, сервер его расшифровывает и понимаем кто с ним общается

сам токен несет следующую информацию: заголовок - алгоритм шифрования и тип токена
полезную нагрузку - данные пользователя и жизненный цикл токена, после имтечения времени токен не будет валидным, jwt сам это проверяет
так же несет подпись она нужна для проверки целостности токена, если кто то изменит токен то подпись не будет совпадать и jwt вернет ошибку
в состав токена нельзя ставить секретные данные так как их можно расшифровать
Секретный ключ на прямую не находится в токене, он используеся для шифровки и расшифровки токена

далее используется utcnow() для шифровки и расшифровки чтобы не было путаницы
'''

from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

users_db = {}
SECRET_KEY = "future_secret_key"
ALGORITHM = "HS256"

# Хелперы

# создать токен
def create_token(username: str) -> str:
    payload = {
        "username": username,
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# понять что за пользователь по токену, проверить токен на валидность
def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("username")
        if username not in users_db:
            raise HTTPException(status_code=401, detail="User not found")
        return users_db[username]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Эндпоинты

# страница регистрации
@router.post("/register")
async def register(user: UserRegister):
    if user.username in users_db:
        raise HTTPException(status_code=400, detail="Username already exists")
    users_db[user.username] = {
        "id": len(users_db) + 1,
        "username": user.username,
        "email": user.email,
        "password": user.password
    }
    return {"message": "User registered successfully"}

# обработка аутентификации, вернем пользователю ответ типа TokenResponse с токеном
@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin):
    if user.username not in users_db:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if users_db[user.username]["password"] != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.username)
    return {"access_token": token, "token_type": "bearer"}

# получаем по надобности информацию о пользователе, если токен валидный
@router.get("/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"]
    }