"""
Tests unitaires pour le microservice FastAPI Maw3ed.tn
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["platform"] == "maw3ed.tn"
    assert data["status"] == "OPERATIONAL"

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["service"] == "maw3ed-triage"

def test_triage_emergency():
    response = client.post(
        "/api/v1/triage/analyze",
        json={"symptoms": "J'ai une forte douleur thoracique irradiant dans le bras gauche", "language": "fr"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["emergency"] is True
    assert data["urgencyLevel"] == "CRITICAL"
    assert "198" in str(data["emergencyNumbers"])

def test_triage_general():
    response = client.post(
        "/api/v1/triage/analyze",
        json={"symptoms": "J'ai mal aux dents et à la mâchoire depuis hier", "language": "fr"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["emergency"] is False
    assert data["recommendedSpecialty"] == "Chirurgie Dentaire"
