"""Authentication endpoints for RAILOPT AI with JWT and RBAC."""
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from rail_opti.database.session import get_db
from rail_opti.database.models import User
from rail_opti.models.auth import UserLoginRequest, TokenResponse, UserProfile
from rail_opti.core.security import create_access_token, verify_password
from rail_opti.core.auth_deps import get_current_user as get_current_user_dep, ROLE_PERMISSIONS

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Predefined demo users matching the login modal roles
DEMO_USERS = {
    "admin": UserProfile(
        id="USR-ADM-01",
        username="admin",
        email="admin@railopt.ai",
        full_name="Shri Rajesh Sharma",
        role="ADMIN",
        department="Operations",
        avatar_initials="AD",
        permissions=list(ROLE_PERMISSIONS.get("ADMIN", set())),
    ),
    "control_office": UserProfile(
        id="USR-CTL-01",
        username="control_office",
        email="srdom@railopt.ai",
        full_name="Sr. DOM / Section Controller",
        role="CONTROL_OFFICE",
        department="Operations",
        avatar_initials="CO",
        permissions=list(ROLE_PERMISSIONS.get("CONTROL_OFFICE", set())),
    ),
    "engineering": UserProfile(
        id="USR-ENG-01",
        username="engineering",
        email="den@railopt.ai",
        full_name="Divisional Engineer (Track)",
        role="ENGINEERING",
        department="Civil Engineering",
        avatar_initials="EN",
        permissions=list(ROLE_PERMISSIONS.get("ENGINEERING", set())),
    ),
    "trd": UserProfile(
        id="USR-TRD-01",
        username="trd",
        email="deetr_d@railopt.ai",
        full_name="Divisional Electrical Engineer (TRD)",
        role="TRD",
        department="Traction Distribution",
        avatar_initials="TR",
        permissions=list(ROLE_PERMISSIONS.get("TRD", set())),
    ),
    "snt": UserProfile(
        id="USR-SNT-01",
        username="snt",
        email="dste@railopt.ai",
        full_name="Divisional Signal & Telecom Engineer",
        role="SNT",
        department="Signal & Telecom",
        avatar_initials="ST",
        permissions=list(ROLE_PERMISSIONS.get("SNT", set())),
    ),
    "demo_user": UserProfile(
        id="USR-DEMO-01",
        username="demo_user",
        email="demo@railopt.ai",
        full_name="Guest Evaluator (SIH26027)",
        role="DEMO_USER",
        department="Operations",
        avatar_initials="GU",
        permissions=list(ROLE_PERMISSIONS.get("DEMO_USER", set())),
    ),
}


@router.post("/login", response_model=TokenResponse)
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with username and password. Supports demo user aliases and real database users."""
    normalized_username = request.username.lower().strip()
    
    # 1. Query database for user
    db_user = db.query(User).filter(
        (User.username == normalized_username) | (User.email == normalized_username)
    ).first()

    if db_user:
        # Check password
        if not verify_password(request.password, db_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
            )
        
        dept_name = db_user.department.name if db_user.department else "Operations"
        user_profile = UserProfile(
            id=db_user.id,
            username=db_user.username,
            email=db_user.email,
            full_name=db_user.full_name,
            role=db_user.role,
            department=dept_name,
            avatar_initials=db_user.username[:2].upper(),
            permissions=list(ROLE_PERMISSIONS.get(db_user.role, set())),
        )
        token = create_access_token({
            "sub": db_user.id,
            "role": db_user.role,
            "dept": db_user.department_id,
            "username": db_user.username,
        })
        return TokenResponse(access_token=token, token_type="bearer", user=user_profile)

    # 2. Check demo users dictionary
    user = DEMO_USERS.get(normalized_username)
    if not user:
        if "admin" in normalized_username:
            user = DEMO_USERS["admin"]
        elif "control" in normalized_username or "srdom" in normalized_username:
            user = DEMO_USERS["control_office"]
        elif "eng" in normalized_username or "den" in normalized_username:
            user = DEMO_USERS["engineering"]
        elif "trd" in normalized_username or "dee" in normalized_username:
            user = DEMO_USERS["trd"]
        elif "snt" in normalized_username or "dste" in normalized_username:
            user = DEMO_USERS["snt"]
        else:
            user = DEMO_USERS["demo_user"]

    token = create_access_token({
        "sub": user.id,
        "role": user.role,
        "dept": "ENG" if user.role == "ENGINEERING" else ("TRD" if user.role == "TRD" else ("SNT" if user.role == "SNT" else "OPT")),
        "username": user.username,
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user,
    )


@router.get("/me", response_model=UserProfile)
def get_current_user(user: User = Depends(get_current_user_dep)):
    """Return profile and permissions of currently authenticated user."""
    dept_name = user.department.name if getattr(user, 'department', None) else "Operations"
    return UserProfile(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        department=dept_name,
        avatar_initials=user.username[:2].upper(),
        permissions=list(ROLE_PERMISSIONS.get(user.role, set())),
    )
