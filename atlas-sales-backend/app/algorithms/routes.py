
from flask import Blueprint
from flask_login import current_user, login_required
from app.extensions import db
from app.models import Algorithm, AlgorithmStep, UserAlgorithmStep

bp = Blueprint("algorithms", __name__, url_prefix="/api/algorithms")

@bp.get("")
def list_algorithms():
    items = db.session.scalars(db.select(Algorithm).order_by(Algorithm.id)).all()
    return {"items":[i.to_dict() for i in items]}

@bp.get("/<int:algorithm_id>")
def get_algorithm(algorithm_id):
    algorithm = db.session.get(Algorithm, algorithm_id)
    if algorithm is None:
        return {"error":"algorithm_not_found"}, 404
    completed_ids = set()
    if current_user.is_authenticated:
        rows = db.session.scalars(
            db.select(UserAlgorithmStep).where(UserAlgorithmStep.user_id == current_user.id)
        ).all()
        completed_ids = {r.step_id for r in rows if r.completed}
    data = algorithm.to_dict()
    data["steps"] = []
    for step in algorithm.steps:
        item = step.to_dict()
        item["completed"] = step.id in completed_ids
        data["steps"].append(item)
    total = len(data["steps"])
    completed = sum(1 for x in data["steps"] if x["completed"])
    data["progress"] = {
        "completed":completed,"total":total,
        "percent":round(completed/total*100) if total else 0
    }
    return {"algorithm":data}

@bp.post("/steps/<int:step_id>/toggle")
@login_required
def toggle_step(step_id):
    step = db.session.get(AlgorithmStep, step_id)
    if step is None:
        return {"error":"algorithm_step_not_found"}, 404
    row = db.session.scalar(
        db.select(UserAlgorithmStep).where(
            UserAlgorithmStep.user_id == current_user.id,
            UserAlgorithmStep.step_id == step_id
        )
    )
    if row is None:
        row = UserAlgorithmStep(user_id=current_user.id, step_id=step_id, completed=True)
        db.session.add(row)
    else:
        row.completed = not row.completed
    db.session.commit()
    return {"step_id":step_id,"completed":row.completed}
