
from app.extensions import db

class Document(db.Model):
    __tablename__ = "documents"
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(80), unique=True, nullable=False, index=True)
    title = db.Column(db.String(250), nullable=False)
    description = db.Column(db.Text)
    is_required = db.Column(db.Boolean, nullable=False, default=True)
    validity_period = db.Column(db.String(120))
    category = db.Column(db.String(80), nullable=False, default="general")
    obtain_algorithm = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id, "code": self.code, "title": self.title,
            "description": self.description, "is_required": self.is_required,
            "validity_period": self.validity_period, "category": self.category,
            "obtain_algorithm": self.obtain_algorithm,
        }

class UserDocument(db.Model):
    __tablename__ = "user_documents"
    __table_args__ = (db.UniqueConstraint("user_id","document_id",name="uq_user_document"),)
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    document_id = db.Column(db.Integer, db.ForeignKey("documents.id", ondelete="CASCADE"),
                            nullable=False, index=True)
    collected = db.Column(db.Boolean, nullable=False, default=False)
    document = db.relationship("Document")
