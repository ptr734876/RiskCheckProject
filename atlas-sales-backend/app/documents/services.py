
from app.extensions import db
from app.models import Document

BASE_CODES = {"egrn_extract","owner_passport","bti_plan","utilities_debt_certificate"}

def selected_document_codes(user=None):
    codes = set(BASE_CODES)
    if user is None or user.questionnaire is None:
        return codes
    q = user.questionnaire
    if q.owners_count == "multiple":
        codes.add("all_owners_documents")
    if q.maternity_capital is True:
        codes.update({"maternity_capital_documents","children_share_confirmation"})
    if q.redevelopment == "unauthorized":
        codes.add("redevelopment_approval_documents")
    if q.property_type == "house":
        codes.add("land_plot_documents")
    if q.property_type == "commercial":
        codes.add("commercial_title_documents")
    return codes

def get_selected_documents(user=None):
    codes = selected_document_codes(user)
    stmt = db.select(Document).where(Document.code.in_(codes)).order_by(Document.id)
    return db.session.scalars(stmt).all()
