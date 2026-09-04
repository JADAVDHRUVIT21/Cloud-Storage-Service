from datetime import datetime

from pydantic import BaseModel, Field


class FolderCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=255
    )

    parent_id: int | None = None


class FolderUpdate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=255
    )


class FolderResponse(BaseModel):
    id: int
    name: str
    owner_id: int
    parent_id: int | None
    is_deleted: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }