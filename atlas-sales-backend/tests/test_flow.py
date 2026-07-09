
def register(client):
    response = client.post("/api/auth/register", json={
        "full_name":"Ирина Иванова",
        "email":"ira@example.com",
        "password":"secret123",
    })
    assert response.status_code == 201

def test_questionnaire_personalizes_documents(client):
    register(client)
    response = client.put("/api/questionnaire", json={
        "owners_count":"multiple",
        "maternity_capital":True,
        "property_type":"apartment",
        "redevelopment":"unauthorized",
        "sale_urgency":"three_months",
        "current_step":3,
        "completed":True,
    })
    assert response.status_code == 200
    payload = client.get("/api/documents").get_json()
    codes = {x["code"] for x in payload["items"]}
    assert "all_owners_documents" in codes
    assert "maternity_capital_documents" in codes
    assert "children_share_confirmation" in codes
    assert "redevelopment_approval_documents" in codes
    assert payload["personalized"] is True

def test_property_risk_analysis(client):
    items = client.get("/api/properties?q=Садовая").get_json()["items"]
    assert items
    response = client.get(f'/api/risks/property/{items[0]["id"]}')
    assert response.status_code == 200
    analysis = response.get_json()["analysis"]
    assert analysis["risks"]
    assert analysis["positive_factors"]
    assert analysis["overall_risk"] in {"low","medium","high"}
