from datetime import datetime

from pydantic import BaseModel


class FileResponse(BaseModel):
    id: int
    name: str
    original_name: str
    mime_type: str | None
    size: int
    owner_id: int
    folder_id: int | None
    is_deleted: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class FileMove(BaseModel):
    folder_id: int | None = None


class FileRename(BaseModel):
    original_name: str


class StorageStatsResponse(BaseModel):
    total_files: int
    total_size: int
    deleted_files: int
    deleted_size: int
    storage_limit: int
    remaining_storage: int