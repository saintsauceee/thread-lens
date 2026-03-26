from unittest.mock import AsyncMock, patch

import bcrypt

from research.auth import create_access_token, create_refresh_token

HASHED = bcrypt.hashpw(b"testpass123", bcrypt.gensalt()).decode()
FAKE_USER = {"id": "u1", "email": "test@test.com", "password_hash": HASHED, "created_at": "2025-01-01T00:00:00Z"}


# ── Register ──────────────────────────────────────────────────────────────────


async def test_register_success(client, mock_db):
    with patch("research.routes.auth.get_user_by_email", new_callable=AsyncMock, return_value=None), \
         patch("research.routes.auth.create_user", new_callable=AsyncMock, return_value=FAKE_USER):
        r = await client.post("/auth/register", json={"email": "new@test.com", "password": "longpassword"})
    assert r.status_code == 200
    assert r.json()["email"] == "test@test.com"
    assert "access_token" in r.cookies
    assert "refresh_token" in r.cookies


async def test_register_short_password(client, mock_db):
    r = await client.post("/auth/register", json={"email": "new@test.com", "password": "short"})
    assert r.status_code == 400
    assert "8 characters" in r.json()["detail"]


async def test_register_duplicate_email(client, mock_db):
    with patch("research.routes.auth.get_user_by_email", new_callable=AsyncMock, return_value=FAKE_USER):
        r = await client.post("/auth/register", json={"email": "test@test.com", "password": "longpassword"})
    assert r.status_code == 409


# ── Login ─────────────────────────────────────────────────────────────────────


async def test_login_success(client, mock_db):
    with patch("research.routes.auth.get_user_by_email", new_callable=AsyncMock, return_value=FAKE_USER):
        r = await client.post("/auth/login", json={"email": "test@test.com", "password": "testpass123"})
    assert r.status_code == 200
    assert "access_token" in r.cookies


async def test_login_wrong_password(client, mock_db):
    with patch("research.routes.auth.get_user_by_email", new_callable=AsyncMock, return_value=FAKE_USER):
        r = await client.post("/auth/login", json={"email": "test@test.com", "password": "wrongpassword"})
    assert r.status_code == 401


async def test_login_nonexistent_user(client, mock_db):
    with patch("research.routes.auth.get_user_by_email", new_callable=AsyncMock, return_value=None):
        r = await client.post("/auth/login", json={"email": "noone@test.com", "password": "whatever1"})
    assert r.status_code == 401


# ── Logout ────────────────────────────────────────────────────────────────────


async def test_logout_clears_cookies(client):
    r = await client.post("/auth/logout")
    assert r.status_code == 200
    # Cookies are cleared by setting max-age=0
    for cookie in r.headers.get_list("set-cookie"):
        assert 'Max-Age=0' in cookie or '="";' in cookie


# ── Refresh ───────────────────────────────────────────────────────────────────


async def test_refresh_success(client):
    token = create_refresh_token("u1")
    client.cookies.set("refresh_token", token)
    r = await client.post("/auth/refresh")
    assert r.status_code == 200
    assert "access_token" in r.cookies


async def test_refresh_no_token(client):
    r = await client.post("/auth/refresh")
    assert r.status_code == 401


async def test_refresh_rejects_access_token(client):
    token = create_access_token("u1")
    client.cookies.set("refresh_token", token)
    r = await client.post("/auth/refresh")
    assert r.status_code == 401


# ── Me ────────────────────────────────────────────────────────────────────────


async def test_me_returns_user(client, mock_db):
    token = create_access_token("u1")
    client.cookies.set("access_token", token)
    safe_user = {"id": "u1", "email": "test@test.com", "created_at": "2025-01-01T00:00:00Z"}
    with patch("research.auth.get_user_by_id", new_callable=AsyncMock, return_value=safe_user):
        r = await client.get("/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "test@test.com"


async def test_me_no_token(client):
    # Clear any cookies from dependency override
    client.cookies.clear()
    # Also remove the dependency override so real auth runs
    from research.auth import get_current_user
    from research.main import app
    app.dependency_overrides.pop(get_current_user, None)
    try:
        r = await client.get("/auth/me")
        assert r.status_code == 401
    finally:
        app.dependency_overrides[get_current_user] = lambda: {"id": "test-user-id", "email": "test@test.com"}
