
from app.extensions import db

class Algorithm(db.Model):
    __tablename__ = "algorithms"
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(80), unique=True, nullable=False)
    title = db.Column(db.String(250), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(80), nullable=False, default="general")
    steps = db.relationship(
        "AlgorithmStep", back_populates="algorithm",
        order_by="AlgorithmStep.position", cascade="all, delete-orphan"
    )

    def to_dict(self, include_steps=False):
        data = {"id": self.id, "code": self.code, "title": self.title,
                "description": self.description, "category": self.category}
        if include_steps:
            data["steps"] = [s.to_dict() for s in self.steps]
        return data

class AlgorithmStep(db.Model):
    __tablename__ = "algorithm_steps"
    id = db.Column(db.Integer, primary_key=True)
    algorithm_id = db.Column(db.Integer, db.ForeignKey("algorithms.id", ondelete="CASCADE"),
                             nullable=False, index=True)
    position = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text)
    algorithm = db.relationship("Algorithm", back_populates="steps")

    def to_dict(self):
        return {"id": self.id, "position": self.position,
                "title": self.title, "description": self.description}

class UserAlgorithmStep(db.Model):
    __tablename__ = "user_algorithm_steps"
    __table_args__ = (db.UniqueConstraint("user_id","step_id",name="uq_user_algorithm_step"),)
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    step_id = db.Column(db.Integer, db.ForeignKey("algorithm_steps.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    completed = db.Column(db.Boolean, nullable=False, default=False)
    step = db.relationship("AlgorithmStep")
