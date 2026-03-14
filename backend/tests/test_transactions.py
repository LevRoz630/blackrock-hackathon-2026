def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_marqeta_webhook_returns_prompt(client):
    payload = {
        "token": "txn_001",
        "user_token": "user_001",
        "amount": 25.00,
        "currency_code": "GBP",
        "merchant_name": "Pub",
    }
    resp = client.post("/webhooks/marqeta", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["should_prompt"] is True
    assert data["delay_seconds"] > 0


def test_decide_approve(client):
    decision = {"transaction_token": "txn_001", "approved": True}
    resp = client.post("/transactions/decide", json=decision)
    assert resp.status_code == 200
    assert resp.json()["status"] == "approved"


def test_decide_decline(client):
    decision = {"transaction_token": "txn_002", "approved": False}
    resp = client.post("/transactions/decide", json=decision)
    assert resp.status_code == 200
    assert resp.json()["status"] == "declined"
