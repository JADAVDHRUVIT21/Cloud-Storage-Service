from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import UserResponse
from pydantic import BaseModel

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(
    prefix="/me",
    tags=["User"]
)

# Schemas for requests
class UpdateProfileRequest(BaseModel):
    full_name: str

class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.get(
    "",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.put(
    "",  # REMOVED THE SLASH HERE
    response_model=UserResponse
)
def update_profile(
    profile_data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile (full_name)"""
    current_user.full_name = profile_data.full_name
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put(
    "/password",
    response_model=dict
)
def update_password(
    password_data: UpdatePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user password"""
    # Verify current password
    if not pwd_context.verify(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    current_user.hashed_password = pwd_context.hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}