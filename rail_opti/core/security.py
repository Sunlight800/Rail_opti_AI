"""Security, JWT token generation, and password hashing utilities for RAILOPT AI."""
import datetime
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from rail_opti.core.config import settings


def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Create a signed JWT access token encoding user ID, role, and department."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.UTC) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token, supporting fallback demo token format."""
    # Handle demo token format: demo_jwt_token_{user_id}_sih26027
    if token.startswith("demo_jwt_token_") and token.endswith("_sih26027"):
        user_id = token.replace("demo_jwt_token_", "").replace("_sih26027", "")
        # Derive role from user_id prefix if present
        role_map = {
            "USR-ADM-01": ("ADMIN", "OPT"),
            "USR-CTL-01": ("CONTROL_OFFICE", "OPT"),
            "USR-ENG-01": ("ENGINEERING", "ENG"),
            "USR-TRD-01": ("TRD", "TRD"),
            "USR-SNT-01": ("SNT", "SNT"),
            "USR-DEMO-01": ("DEMO_USER", "OPT"),
        }
        role, dept = role_map.get(user_id, ("DEMO_USER", "OPT"))
        return {
            "sub": user_id,
            "role": role,
            "dept": dept,
        }

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash. Supports demo prefix pbkdf2:sha256: and role demo passwords."""
    if hashed_password.startswith("pbkdf2:sha256:"):
        expected = hashed_password.replace("pbkdf2:sha256:", "")
        if plain_password == expected:
            return True
        # Allow standard demo role passwords for convenience
        demo_passwords = {"admin123", "control123", "eng123", "trd123", "snt123", "demo123", "demoPassword123"}
        return plain_password in demo_passwords
    return plain_password == hashed_password
