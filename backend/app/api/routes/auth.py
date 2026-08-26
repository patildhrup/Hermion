import time
import uuid
import hashlib
import jwt
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from app.database.database import db

router = APIRouter(prefix="/auth", tags=["Authentication"])

JWT_SECRET = "hermion-secret-key-echo-sphere-2026"


class AuthLoginRequest(BaseModel):
    email: str
    password: str


class AuthSignupRequest(BaseModel):
    email: str
    password: str
    username: Optional[str] = ""


def get_deterministic_user_id(email: str) -> str:
    """Generate a consistent, deterministic user ID from email for fallback mode."""
    cleaned = email.lower().strip()
    return "user-" + hashlib.sha256(cleaned.encode()).hexdigest()[:16]


def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": int(time.time()) + 86400 * 7
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@router.post("/signup")
def signup(req: AuthSignupRequest):
    # Prefer real Supabase auth when configured
    if db.use_supabase and db.supabase_client:
        try:
            res = db.supabase_client.auth.sign_up({
                "email": req.email,
                "password": req.password,
                "options": {"data": {"username": req.username or req.email.split("@")[0]}}
            })
            if res.user:
                token = create_jwt_token(str(res.user.id), req.email)
                return {
                    "id": str(res.user.id),
                    "email": req.email,
                    "username": req.username or req.email.split("@")[0],
                    "token": token
                }
        except Exception as e:
            print(f"[Auth] Supabase signup error: {e}")

    # Fallback JWT with deterministic user_id
    user_id = get_deterministic_user_id(req.email)
    token = create_jwt_token(user_id, req.email)
    return {
        "id": user_id,
        "email": req.email,
        "username": req.username or req.email.split("@")[0],
        "token": token
    }


@router.post("/login")
def login(req: AuthLoginRequest):
    if db.use_supabase and db.supabase_client:
        try:
            res = db.supabase_client.auth.sign_in_with_password({
                "email": req.email,
                "password": req.password
            })
            if res.user:
                token = create_jwt_token(str(res.user.id), req.email)
                return {
                    "id": str(res.user.id),
                    "email": req.email,
                    "username": req.email.split("@")[0],
                    "token": token
                }
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Login failed: {e}")

    # Fallback JWT with deterministic user_id
    user_id = get_deterministic_user_id(req.email)
    token = create_jwt_token(user_id, req.email)
    return {
        "id": user_id,
        "email": req.email,
        "username": req.email.split("@")[0],
        "token": token
    }


@router.get("/me")
def me(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return {"authenticated": False, "user": None}
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {
            "authenticated": True,
            "user": {
                "id": payload["sub"],
                "email": payload["email"],
                "username": payload["email"].split("@")[0]
            }
        }
    except Exception:
        return {"authenticated": False, "user": None}
