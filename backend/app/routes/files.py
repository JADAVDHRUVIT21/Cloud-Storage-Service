import os
import uuid

from fastapi import (
    APIRouter,
    Depends,
    File as UploadFileType,
    HTTPException,
    Query,
    UploadFile,
    status
)
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.file import File
from app.models.folder import Folder
from app.models.user import User
from app.schemas.file import (
    FileResponse,
    FileMove,
    FileRename,
    StorageStatsResponse
)


router = APIRouter(
    prefix="/files",
    tags=["Files"]
)


STORAGE_DIR = "storage"

TOTAL_STORAGE_LIMIT = 20 * 1024 * 1024 * 1024


def get_user_used_storage(
    db: Session,
    user_id: int
):
    used_storage = (
        db.query(
            func.coalesce(
                func.sum(File.size),
                0
            )
        )
        .filter(
            File.owner_id == user_id,
            File.is_deleted == 0
        )
        .scalar()
    )

    return int(used_storage or 0)


def get_user_file(
    file_id: int,
    db: Session,
    user_id: int,
    is_deleted: int | None = None
):
    query = (
        db.query(File)
        .filter(
            File.id == file_id,
            File.owner_id == user_id
        )
    )

    if is_deleted is not None:
        query = query.filter(
            File.is_deleted == is_deleted
        )

    return query.first()


@router.post(
    "/upload",
    response_model=FileResponse,
    status_code=status.HTTP_201_CREATED
)
async def upload_file(
    file: UploadFile = UploadFileType(...),
    folder_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if folder_id is not None:
        folder = (
            db.query(Folder)
            .filter(
                Folder.id == folder_id,
                Folder.owner_id == current_user.id
            )
            .first()
        )

        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found"
            )

    content = await file.read()

    file_size = len(content)

    used_storage = get_user_used_storage(
        db,
        current_user.id
    )

    remaining_storage = (
        TOTAL_STORAGE_LIMIT - used_storage
    )

    if file_size > remaining_storage:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Storage limit exceeded. "
                "You have reached your 20 GB storage limit."
            )
        )

    user_storage_dir = os.path.join(
        STORAGE_DIR,
        str(current_user.id)
    )

    os.makedirs(
        user_storage_dir,
        exist_ok=True
    )

    unique_name = (
        f"{uuid.uuid4()}_{file.filename}"
    )

    storage_path = os.path.join(
        user_storage_dir,
        unique_name
    )

    with open(
        storage_path,
        "wb"
    ) as buffer:
        buffer.write(content)

    db_file = File(
        name=unique_name,
        original_name=file.filename,
        storage_path=storage_path,
        mime_type=file.content_type,
        size=file_size,
        owner_id=current_user.id,
        folder_id=folder_id,
        is_deleted=0
    )

    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return db_file


@router.get(
    "/",
    response_model=list[FileResponse]
)
def get_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    files = (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == 0
        )
        .order_by(
            File.created_at.desc()
        )
        .all()
    )

    return files


@router.get(
    "/search/",
    response_model=list[FileResponse]
)
def search_files(
    q: str = Query(
        ...,
        min_length=1
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    files = (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == 0,
            File.original_name.ilike(
                f"%{q}%"
            )
        )
        .order_by(
            File.created_at.desc()
        )
        .all()
    )

    return files


@router.get(
    "/type/",
    response_model=list[FileResponse]
)
def get_files_by_type(
    mime_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    files = (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.mime_type == mime_type,
            File.is_deleted == 0
        )
        .order_by(
            File.created_at.desc()
        )
        .all()
    )

    return files


@router.get(
    "/stats/",
    response_model=StorageStatsResponse
)
def get_storage_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    active_files = (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == 0
        )
        .all()
    )

    deleted_files = (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == 1
        )
        .all()
    )

    total_size = sum(
        file.size
        for file in active_files
    )

    deleted_size = sum(
        file.size
        for file in deleted_files
    )

    remaining_storage = max(
        TOTAL_STORAGE_LIMIT - total_size,
        0
    )

    return {
        "total_files": len(active_files),
        "total_size": total_size,
        "deleted_files": len(deleted_files),
        "deleted_size": deleted_size,
        "storage_limit": TOTAL_STORAGE_LIMIT,
        "remaining_storage": remaining_storage
    }


@router.get(
    "/trash/",
    response_model=list[FileResponse]
)
def get_deleted_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    files = (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == 1
        )
        .order_by(
            File.created_at.desc()
        )
        .all()
    )

    return files


@router.get(
    "/folder/{folder_id}",
    response_model=list[FileResponse]
)
def get_files_by_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = (
        db.query(Folder)
        .filter(
            Folder.id == folder_id,
            Folder.owner_id == current_user.id
        )
        .first()
    )

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )

    files = (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.folder_id == folder_id,
            File.is_deleted == 0
        )
        .order_by(
            File.created_at.desc()
        )
        .all()
    )

    return files


@router.get(
    "/size/",
    response_model=list[FileResponse]
)
def get_files_by_size(
    min_size: int | None = Query(
        None,
        ge=0
    ),
    max_size: int | None = Query(
        None,
        ge=0
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if (
        min_size is not None
        and max_size is not None
        and min_size > max_size
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "min_size cannot be greater "
                "than max_size"
            )
        )

    query = (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == 0
        )
    )

    if min_size is not None:
        query = query.filter(
            File.size >= min_size
        )

    if max_size is not None:
        query = query.filter(
            File.size <= max_size
        )

    files = (
        query
        .order_by(
            File.created_at.desc()
        )
        .all()
    )

    return files


@router.get(
    "/{file_id}/preview"
)
def preview_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=0
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    if not os.path.exists(
        db_file.storage_path
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found"
        )

    return FastAPIFileResponse(
        path=db_file.storage_path,
        media_type=(
            db_file.mime_type
            or "application/octet-stream"
        ),
        headers={
            "Content-Disposition": (
                f'inline; filename="{db_file.original_name}"'
            )
        }
    )


@router.get(
    "/{file_id}/download"
)
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=0
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    if not os.path.exists(
        db_file.storage_path
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found"
        )

    return FastAPIFileResponse(
        path=db_file.storage_path,
        filename=db_file.original_name,
        media_type=(
            db_file.mime_type
            or "application/octet-stream"
        )
    )


@router.get(
    "/{file_id}",
    response_model=FileResponse
)
def get_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=0
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return db_file


@router.delete(
    "/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=0
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    db_file.is_deleted = 1

    db.commit()

    return None


@router.put(
    "/{file_id}/restore",
    response_model=FileResponse
)
def restore_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=1
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deleted file not found"
        )

    used_storage = get_user_used_storage(
        db,
        current_user.id
    )

    if (
        used_storage + db_file.size
        > TOTAL_STORAGE_LIMIT
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cannot restore file. "
                "20 GB storage limit would be exceeded."
            )
        )

    db_file.is_deleted = 0

    db.commit()
    db.refresh(db_file)

    return db_file


@router.delete(
    "/{file_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT
)
def permanently_delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=1
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deleted file not found"
        )

    if os.path.exists(
        db_file.storage_path
    ):
        os.remove(
            db_file.storage_path
        )

    db.delete(db_file)
    db.commit()

    return None


@router.put(
    "/{file_id}/move",
    response_model=FileResponse
)
def move_file(
    file_id: int,
    data: FileMove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=0
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    if data.folder_id is not None:
        folder = (
            db.query(Folder)
            .filter(
                Folder.id == data.folder_id,
                Folder.owner_id == current_user.id
            )
            .first()
        )

        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found"
            )

    db_file.folder_id = data.folder_id

    db.commit()
    db.refresh(db_file)

    return db_file


@router.put(
    "/{file_id}/rename",
    response_model=FileResponse
)
def rename_file(
    file_id: int,
    data: FileRename,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=0
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    if not data.original_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name cannot be empty"
        )

    db_file.original_name = (
        data.original_name.strip()
    )

    db.commit()
    db.refresh(db_file)

    return db_file