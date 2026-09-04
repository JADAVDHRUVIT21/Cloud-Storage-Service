from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr


class ShareFileRequest(BaseModel):
    email: EmailStr
    role: Literal["viewer", "editor"] = "viewer"


class ShareFolderRequest(BaseModel):
    email: EmailStr
    role: Literal["viewer", "editor"] = "viewer"


class ShareFileResponse(BaseModel):
    id: int
    file_id: int | None
    folder_id: int | None
    owner_id: int
    shared_with_id: int
    role: Literal["viewer", "editor"]
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class SharedUserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: Literal["viewer", "editor"]
    shared_at: datetime


class LinkShareUpdate(BaseModel):
    access_type: Literal[
        "restricted",
        "anyone_with_link",
    ]


class LinkShareResponse(BaseModel):
    id: int
    file_id: int
    owner_id: int
    token: str
    access_type: Literal[
        "restricted",
        "anyone_with_link",
    ]
    role: Literal["viewer", "editor"]
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class FileSharingResponse(BaseModel):
    file_id: int
    access_type: Literal[
        "restricted",
        "anyone_with_link",
    ]
    share_token: str | None
    shared_users: list[SharedUserResponse]


class FolderSharingResponse(BaseModel):
    folder_id: int
    shared_users: list[SharedUserResponse]