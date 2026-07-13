
import click
from app.extensions import db
from app.seed import seed_demo_data

def register_cli(app):
    @app.cli.command("init-db")
    def init_db():
        db.create_all()
        click.echo("Database tables created.")

    @app.cli.command("drop-db")
    @click.confirmation_option(prompt="Удалить все таблицы?")
    def drop_db():
        db.drop_all()
        click.echo("Database tables dropped.")

    @app.cli.command("seed-demo")
    def seed_demo():
        db.create_all()
        seed_demo_data()
        click.echo("Demo data seeded.")
