from flask import Flask, jsonify
from flask_cors import CORS
from routers import auth, documents, materials, algorithms, mapping


def create_app() -> Flask:
    app = Flask(__name__)

    # Разрешение браузеру от сервера на отправку запросов
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    # Подключаем роутеры
    app.register_blueprint(auth.router)
    app.register_blueprint(mapping.router)
    app.register_blueprint(documents.router)
    app.register_blueprint(materials.router)
    app.register_blueprint(algorithms.router)

    # Для быстрой проверки работы сервиса
    @app.route("/", methods=["GET"])
    def root():
        return jsonify({"message": "RiskCheck API is running"})

    # Проверка состояния сервиса
    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"})

    # Получаем все варианты дальнейшей работы
    @app.route("/variants", methods=["GET"])
    def get_variants():
        return jsonify({
            "variants": [
                {"id": 0, "label": "Вариант 1", "description": "Оценка и аналитика объекта"},
                {"id": 1, "label": "Вариант 2", "description": "Документы для продажи"},
                {"id": 2, "label": "Вариант 3", "description": "Полезные материалы"},
                {"id": 3, "label": "Вариант 4", "description": "Алгоритмы"}
            ]
        })

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)