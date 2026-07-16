from flask import Blueprint, request

from app.map_api.provider import get_map_provider
from app.rosreestr import get_property_provider

bp = Blueprint("map_api", __name__, url_prefix="/api/map")


@bp.get("/search")
def map_search():
    q = str(request.args.get("q", "")).strip()
    return get_map_provider().search(q)


@bp.get("/property/<int:property_id>")
def property_map_context(property_id):
    data = get_map_provider().get_property_map(property_id)
    if data is None:
        return {"error": "property_not_found"}, 404
    return data


@bp.get("/property/<int:property_id>/markers")
def property_markers(property_id):
    data = get_map_provider().get_property_map(property_id)
    if data is None:
        return {"error": "property_not_found"}, 404
    return {
        "property_id": data["property_id"],
        "center": data["center"],
        "markers": data["markers"],
        "source": data.get("source", "demo"),
    }


@bp.get("/document-points")
def document_points():
    property_id = request.args.get("property_id", type=int)
    provider = get_map_provider()
    if property_id is not None:
        data = provider.get_property_map(property_id)
        if data is None:
            return {"error": "property_not_found"}, 404
        return {
            "source": data.get("source", "demo"),
            "property_id": property_id,
            "categories": data.get("place_categories") or [],
        }

    from app.extensions import db
    from app.models import Property

    first = db.session.scalar(db.select(Property).order_by(Property.id).limit(1))
    if first is None:
        return {"source": "demo", "categories": []}
    data = provider.get_property_map(first.id) or {}
    return {
        "source": data.get("source", "demo"),
        "categories": data.get("place_categories") or [],
    }


@bp.get("/lookup")
def map_lookup_with_property():
    q = str(request.args.get("q", "")).strip()
    if not q:
        return {"error": "query_required"}, 400

    map_data = get_map_provider().search(q)
    prop = get_property_provider().lookup_by_address(q)
    return {
        "query": q,
        "map": map_data,
        "property": prop.to_dict() if prop else None,
    }
