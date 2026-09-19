"""Authentication and user schemas for RAILOPT AI."""
from pydantic import BaseModel, EmailStr
from typing import Optional, List


class UserLoginRequest(BaseModel):
    username: str
    password: str


class UserProfile(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    department: str
    avatar_initials: str = "AD"
    permissions: List[str] = []


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
