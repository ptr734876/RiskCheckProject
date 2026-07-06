# страница авторизации и регистрации пользователей
from datetime import datetime, timedelta

import jwt
from flask import Blueprint, jsonify, request
from pydantic import ValidationError
from backend.models import UserRegister, UserLogin, TokenResponse

# JWT используется для аутентификации запросов.
# Токен передаётся в заголовке Authorization в формате Bearer <token>.

router = Blueprint("auth", __name__, url_prefix="/auth")

users_db = {}
SECRET_KEY = "future_secret_key"
ALGORITHM = "HS256"

# Вспомогательные функции

# Создать JWT-токен
def create_token(username: str) -> str:
    payload = {
        "username": username,
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# Определить пользователя по токену и проверить его валидность
def get_current_user():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, (jsonify({"detail": "Authorization header required"}), 401)

    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("username")
        if username not in users_db:
            return None, (jsonify({"detail": "User not found"}), 401)
        return users_db[username], None
    except jwt.ExpiredSignatureError:
        return None, (jsonify({"detail": "Token expired"}), 401)
    except jwt.InvalidTokenError:
        return None, (jsonify({"detail": "Invalid token"}), 401)

# Маршруты

# Регистрация пользователя
@router.route("/register", methods=["POST"])
def register():
    payload = request.get_json(silent=True) or {}
    try:
        user = UserRegister.model_validate(payload)
    except ValidationError as exc:
        return jsonify({"detail": exc.errors()}), 400

    if user.username in users_db:
        return jsonify({"detail": "Username already exists"}), 400

    users_db[user.username] = {
        "id": len(users_db) + 1,
        "username": user.username,
        "email": str(user.email),
        "password": user.password
    }
    return jsonify({"message": "User registered successfully"})

# Аутентификация пользователя и выдача токена
@router.route("/login", methods=["POST"])
def login():
    payload = request.get_json(silent=True) or {}
    try:
        user = UserLogin.model_validate(payload)
    except ValidationError as exc:
        return jsonify({"detail": exc.errors()}), 400

    if user.username not in users_db:
        return jsonify({"detail": "Invalid credentials"}), 401
    if users_db[user.username]["password"] != user.password:
        return jsonify({"detail": "Invalid credentials"}), 401
    token = create_token(user.username)
    return jsonify({"access_token": token, "token_type": "bearer"})

# Получить информацию о текущем пользователе по валидному токену
@router.route("/me", methods=["GET"])
def get_me():
    current_user, error = get_current_user()
    if error:
        return error
    return jsonify({
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"]
    })