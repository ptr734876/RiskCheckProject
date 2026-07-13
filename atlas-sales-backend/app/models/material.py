
from app.extensions import db

class Material(db.Model):
    __tablename__ = "materials"
    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(160), unique=True, nullable=False, index=True)
    title = db.Column(db.String(300), nullable=False)
    summary = db.Column(db.Text)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(80), nullable=False, index=True)
    keywords = db.Column(db.String(500))
    source_note = db.Column(db.String(500))

    def to_dict(self, include_content=False):
        data = {
            "id": self.id, "slug": self.slug, "title": self.title,
            "summary": self.summary, "category": self.category,
            "keywords": self.keywords, "source_note": self.source_note,
        }
        if include_content:
            data["content"] = self.content
        return data
