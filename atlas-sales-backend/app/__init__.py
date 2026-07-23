
from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, login_manager, migrate

def create_app(config_object=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if config_object:
        app.config.update(config_object)

    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)

    from app.models import User

    @login_manager.user_loader
    def load_user(user_id: str):
        try:
            return db.session.get(User, int(user_id))
        except (TypeError, ValueError):
            return None

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({"error": "authentication_required"}), 401

    from app.auth.routes import bp as auth_bp
    from app.questionnaire.routes import bp as questionnaire_bp
    from app.property.routes import bp as property_bp
    from app.risks.routes import bp as risks_bp
    from app.documents.routes import bp as documents_bp
    from app.algorithms.routes import bp as algorithms_bp
    from app.materials.routes import bp as materials_bp
    from app.map_api.routes import bp as map_bp

    for bp in [auth_bp, questionnaire_bp, property_bp, risks_bp,
               documents_bp, algorithms_bp, materials_bp, map_bp]:
        app.register_blueprint(bp)

    @app.get("/api/health")
    def health():
        return {"status": "ok", "service": "atlas-sales-backend"}

    from app.cli import register_cli
    register_cli(app)

    # Автозапуск парсера Росреестра как дочернего процесса.
    # Не критичен: если парсер не поднимется, сайт работает без
    # юридических данных. В тестах не нужен.
    if not app.config.get("TESTING"):
        from app.geo.parser_supervisor import init_app as init_parser

        init_parser(app)

    return app
