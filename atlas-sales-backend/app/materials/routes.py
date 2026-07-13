
from flask import Blueprint, request
from sqlalchemy import or_
from app.extensions import db
from app.models import Material

bp = Blueprint("materials", __name__, url_prefix="/api/materials")

@bp.get("")
def list_materials():
    q = str(request.args.get("q","")).strip()
    category = str(request.args.get("category","")).strip()
    stmt = db.select(Material).order_by(Material.id)
    if category:
        stmt = stmt.where(Material.category == category)
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(or_(
            Material.title.ilike(pattern),
            Material.summary.ilike(pattern),
            Material.content.ilike(pattern),
            Material.keywords.ilike(pattern),
        ))
    items = db.session.scalars(stmt).all()
    return {"items":[i.to_dict() for i in items]}

@bp.get("/<int:material_id>")
def get_material(material_id):
    item = db.session.get(Material, material_id)
    if item is None:
        return {"error":"material_not_found"}, 404
    return {"material":item.to_dict(include_content=True)}
