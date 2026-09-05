from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    SECRET_KEY,
    ALGORITHM,
)
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    SocialLoginRequest,
    TokenResponse,
    UserResponse,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ============================================================
# REGISTER - EMAIL/PASSWORD
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    # Check if email already exists
    existing_user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    # Create user
    user = User(
        full_name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password),
        auth_provider="email",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# ============================================================
# LOGIN - EMAIL/PASSWORD
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    # Find user
    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Make sure this is an email/password account
    if user.auth_provider != "email" or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This account uses {user.auth_provider} login",
        )

    # Verify password
    if not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create access token
    access_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )

    # Create refresh token
    refresh_token = create_refresh_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


# ============================================================
# SOCIAL LOGIN - GOOGLE / GITHUB / OTHER SUPABASE PROVIDERS
# ============================================================

@router.post(
    "/social-login",
    response_model=TokenResponse,
)
def social_login(
    data: SocialLoginRequest,
    db: Session = Depends(get_db),
):
    # First try to find the user by Supabase user ID
    user = (
        db.query(User)
        .filter(
            User.supabase_user_id == data.supabase_user_id
        )
        .first()
    )

    # If not found, try email
    if not user:
        user = (
            db.query(User)
            .filter(User.email == data.email)
            .first()
        )

    # ========================================================
    # CREATE NEW SOCIAL USER
    # ========================================================

    if not user:
        user = User(
            full_name=data.full_name,
            email=data.email,
            password_hash=None,
            auth_provider=data.provider,
            supabase_user_id=data.supabase_user_id,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    # ========================================================
    # UPDATE EXISTING USER
    # ========================================================

    else:
        user.full_name = data.full_name
        user.auth_provider = data.provider
        user.supabase_user_id = data.supabase_user_id

        db.commit()
        db.refresh(user)

    # ========================================================
    # CREATE TOKENS
    # ========================================================

    access_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )

    refresh_token = create_refresh_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


# ============================================================
# REFRESH TOKEN
# ============================================================

@router.post(
    "/refresh",
    response_model=TokenResponse,
)
def refresh_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    try:
        # Decode refresh token
        payload = jwt.decode(
            data.refresh_token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        # Make sure token is a refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        # Get user ID
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Find user
    user = (
        db.query(User)
        .filter(User.id == int(user_id))
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Create new access token
    new_access_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )

    # Create new refresh token
    new_refresh_token = create_refresh_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }