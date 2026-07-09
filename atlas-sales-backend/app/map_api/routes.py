
from flask import Blueprint
from app.extensions import db
from app.models import Property

bp = Blueprint("map_api", __name__, url_prefix="/api/map")

@bp.get("/property/<int:property_id>/markers")
def property_markers(property_id):
    item = db.session.get(Property, property_id)
    if item is None:
        return {"error":"property_not_found"}, 404
    markers = [{
        "type":"property","label":item.address,
        "latitude":item.latitude,"longitude":item.longitude
    }]
    for obj in item.nearby_objects:
        markers.append({
            "type":obj.category,"kind":obj.kind,"label":obj.name,
            "distance_m":obj.distance_m,
            "latitude":obj.latitude,"longitude":obj.longitude
        })
    return {"property_id":item.id,"markers":markers}

@bp.get("/document-points")
def document_points():
    return {"items":[
        {
            "type":"mfc","name":"МФЦ Центрального района",
            "address":"ул. Примерная, 10","distance_m":1200,
            "working_hours":"09:00–20:00",
            "latitude":59.932,"longitude":30.320
        },
        {
            "type":"mfc","name":"МФЦ Адмиралтейского района",
            "address":"наб. Примерная, 5","distance_m":2400,
            "working_hours":"09:00–21:00",
            "latitude":59.925,"longitude":30.305
        }
    ]}
