import bcrypt
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from thread_lens_db import create_user, get_db, get_user_by_email

from research.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_OPTS = {
    "httponly": True,
    "samesite": "lax",
    "secure": False,
    "path": "/",
}


class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def _set_auth_cookies(response: JSONResponse, user_id: str) -> None:
    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)
    response.set_cookie("access_token", access, max_age=15 * 60, **COOKIE_OPTS)
    response.set_cookie("refresh_token", refresh, max_age=7 * 24 * 60 * 60, **COOKIE_OPTS)


@router.post("/register")
async def register(req: RegisterRequest):
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    async with get_db() as db:
        existing = await get_user_by_email(db, req.email)
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        user = await create_user(db, req.email, _hash_password(req.password))

    response = JSONResponse({"id": user["id"], "email": user["email"]})
    _set_auth_cookies(response, user["id"])
    return response


@router.post("/login")
async def login(req: LoginRequest):
    async with get_db() as db:
        user = await get_user_by_email(db, req.email)

    if not user or not _verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    response = JSONResponse({"id": user["id"], "email": user["email"]})
    _set_auth_cookies(response, user["id"])
    return response


@router.post("/logout")
async def logout():
    response = JSONResponse({"ok": True})
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return response


@router.post("/refresh")
async def refresh(request: Request):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    response = JSONResponse({"ok": True})
    response.set_cookie(
        "access_token",
        create_access_token(user_id),
        max_age=15 * 60,
        **COOKIE_OPTS,
    )
    return response


@router.get("/me")
async def me(request: Request):
    user = await get_current_user(request)
    return {"id": user["id"], "email": user["email"]}
