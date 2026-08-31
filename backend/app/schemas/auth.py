from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=150
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=72
    )


class LoginRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=72
    )


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class SocialLoginRequest(BaseModel):
    supabase_user_id: str

    full_name: str = Field(
        min_length=1,
        max_length=150
    )

    email: EmailStr

    provider: str = Field(
        min_length=2,
        max_length=50
    )


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    model_config = {
        "from_attributes": True
    }