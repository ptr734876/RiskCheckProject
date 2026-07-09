
from flask import Blueprint, request
from app.extensions import db
from app.models import Property

bp = Blueprint("property", __name__, url_prefix="/api/properties")

@bp.get("")
def list_properties():
    q = str(request.args.get("q","")).strip()
    stmt = db.select(Property).order_by(Property.id)
    if q:
        stmt = stmt.where(Property.address.ilike(f"%{q}%"))
    items = db.session.scalars(stmt).all()
    return {"items":[i.to_dict() for i in items]}

@bp.get("/<int:property_id>")
def get_property(property_id):
    item = db.session.get(Property, property_id)
    if item is None:
        return {"error":"property_not_found"}, 404
    return {"property":item.to_dict(include_nearby=True)}
