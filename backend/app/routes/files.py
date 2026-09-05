import os
import uuid
import traceback
import tempfile

from fastapi import (
    APIRouter,
    Depends,
    File as FastAPIFile,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)

from fastapi.responses import Response

from sqlalchemy import func
from sqlalchemy.orm import Session

from supabase import Client, create_client

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.file import File
from app.models.folder import Folder
from app.models.user import User

from app.schemas.file import (
    FileResponse,
    FileMove,
    FileRename,
    StorageStatsResponse,
)


router = APIRouter(
    prefix="/files",
    tags=["Files"],
)


TOTAL_STORAGE_LIMIT = 20 * 1024 * 1024 * 1024

MAX_FILE_SIZE = 600 * 1024 * 1024

CHUNK_SIZE = 5 * 1024 * 1024


supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY,
)


def get_user_used_storage(
    db: Session,
    user_id: int,
):
    used_storage = (
        db.query(
            func.coalesce(
                func.sum(File.size),
                0,
            )
        )
        .filter(
            File.owner_id == user_id,
            File.is_deleted == 0,
        )
        .scalar()
    )

    return int(used_storage or 0)


def get_user_file(
    file_id: int,
    db: Session,
    user_id: int,
    is_deleted: int | None = None,
):
    query = (
        db.query(File)
        .filter(
            File.id == file_id,
            File.owner_id == user_id,
        )
    )

    if is_deleted is not None:
        query = query.filter(
            File.is_deleted == is_deleted
        )

    return query.first()


def get_user_folder(
    folder_id: int,
    db: Session,
    user_id: int,
):
    return (
        db.query(Folder)
        .filter(
            Folder.id == folder_id,
            Folder.owner_id == user_id,
        )
        .first()
    )


def is_old_local_path(
    storage_path: str | None,
) -> bool:
    if not storage_path:
        return True

    return (
        storage_path.startswith("storage/")
        or storage_path.startswith("storage\\")
        or ":/" in storage_path
        or ":\\" in storage_path
    )


def safe_filename(
    filename: str,
) -> str:
    filename = filename.replace('"', "")
    filename = filename.replace("\r", "")
    filename = filename.replace("\n", "")

    return filename


async def save_upload_to_temp_file(
    file: UploadFile,
):
    temp_file = tempfile.NamedTemporaryFile(
        mode="w+b",
        delete=False,
    )

    total_size = 0

    try:
        while True:
            chunk = await file.read(
                CHUNK_SIZE
            )

            if not chunk:
                break

            total_size += len(chunk)

            if total_size > MAX_FILE_SIZE:
                temp_file.close()

                try:
                    os.unlink(
                        temp_file.name
                    )
                except Exception:
                    pass

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "File size exceeds the maximum "
                        "allowed limit of 600 MB."
                    ),
                )

            temp_file.write(chunk)

        temp_file.flush()
        temp_file.close()

        return (
            temp_file.name,
            total_size,
        )

    except HTTPException:
        raise

    except Exception:
        try:
            temp_file.close()
        except Exception:
            pass

        try:
            if os.path.exists(
                temp_file.name
            ):
                os.unlink(
                    temp_file.name
                )
        except Exception:
            pass

        raise


@router.post(
    "/upload",
    response_model=FileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    folder_id: int | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    object_path = None
    temp_file_path = None
    supabase_uploaded = False

    try:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file selected",
            )

        if folder_id is not None:
            folder = get_user_folder(
                folder_id=folder_id,
                db=db,
                user_id=current_user.id,
            )

            if not folder:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Folder not found",
                )

        used_storage = get_user_used_storage(
            db=db,
            user_id=current_user.id,
        )

        remaining_storage = (
            TOTAL_STORAGE_LIMIT
            - used_storage
        )

        temp_file_path, file_size = (
            await save_upload_to_temp_file(
                file
            )
        )

        if file_size <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot upload an empty file",
            )

        if file_size > remaining_storage:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Storage limit exceeded. "
                    "You do not have enough available "
                    "storage for this file."
                ),
            )

        safe_original_name = os.path.basename(
            file.filename
        )

        unique_name = (
            f"{uuid.uuid4()}_"
            f"{safe_original_name}"
        )

        object_path = (
            f"users/"
            f"{current_user.id}/"
            f"{unique_name}"
        )

        content_type = (
            file.content_type
            or "application/octet-stream"
        )

        print(
            "\n========== UPLOAD START =========="
        )
        print(
            "Original name:",
            safe_original_name,
        )
        print(
            "File size:",
            file_size,
            "bytes",
        )
        print(
            "Content type:",
            content_type,
        )
        print(
            "Bucket:",
            settings.SUPABASE_BUCKET,
        )
        print(
            "Object path:",
            object_path,
        )
        print(
            "==================================\n"
        )

        try:
            with open(
                temp_file_path,
                "rb",
            ) as uploaded_file:

                file_bytes = uploaded_file.read()

            upload_response = (
                supabase.storage
                .from_(
                    settings.SUPABASE_BUCKET
                )
                .upload(
                    path=object_path,
                    file=file_bytes,
                    file_options={
                        "content-type": content_type,
                        "upsert": "false",
                    },
                )
            )

            print(
                "Supabase upload response:",
                upload_response,
            )

            supabase_uploaded = True

        except Exception as storage_error:
            print(
                "Supabase upload error:",
                str(storage_error),
            )

            print(
                traceback.format_exc()
            )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Storage upload failed: "
                    f"{str(storage_error)}"
                ),
            )

        db_file = File(
            name=unique_name,
            original_name=safe_original_name,
            storage_path=object_path,
            mime_type=content_type,
            size=file_size,
            owner_id=current_user.id,
            folder_id=folder_id,
            is_deleted=0,
            is_starred=0,
        )

        db.add(db_file)
        db.commit()
        db.refresh(db_file)

        print(
            "\n========== UPLOAD SUCCESS =========="
        )
        print(
            "Database file ID:",
            db_file.id,
        )
        print(
            "====================================\n"
        )

        return db_file

    except HTTPException:
        db.rollback()

        if (
            supabase_uploaded
            and object_path
        ):
            try:
                (
                    supabase.storage
                    .from_(
                        settings.SUPABASE_BUCKET
                    )
                    .remove(
                        [object_path]
                    )
                )
            except Exception:
                pass

        raise

    except Exception as error:
        db.rollback()

        print(
            "\n========== FILE UPLOAD ERROR =========="
        )
        print(
            traceback.format_exc()
        )
        print(
            "Error message:",
            str(error),
        )
        print(
            "=======================================\n"
        )

        if (
            supabase_uploaded
            and object_path
        ):
            try:
                (
                    supabase.storage
                    .from_(
                        settings.SUPABASE_BUCKET
                    )
                    .remove(
                        [object_path]
                    )
                )
            except Exception as remove_error:
                print(
                    "Failed to remove uploaded file:",
                    str(remove_error),
                )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "File upload failed: "
                f"{str(error)}"
            ),
        )

    finally:
        if (
            temp_file_path
            and os.path.exists(
                temp_file_path
            )
        ):
            try:
                os.unlink(
                    temp_file_path
                )
            except Exception:
                pass

        try:
            await file.close()
        except Exception:
            pass


@router.get(
    "/",
    response_model=list[FileResponse],
)
def get_files(
    folder_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == 0,
        )
    )

    if folder_id is None:
        query = query.filter(
            File.folder_id.is_(None)
        )

    else:
        folder = get_user_folder(
            folder_id=folder_id,
            db=db,
            user_id=current_user.id,
        )

        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found",
            )

        query = query.filter(
            File.folder_id == folder_id
        )

    return (
        query
        .order_by(
            File.created_at.desc()
        )
        .all()
    )


@router.get(
    "/all",
    response_model=list[FileResponse],
)
def get_all_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == 0,
        )
        .order_by(
            File.created_at.desc()
        )
        .all()
    )


@router.get(
    "/starred",
    response_model=list[FileResponse],
)
def get_starred_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == 0,
            File.is_starred == 1,
        )
        .order_by(
            File.created_at.desc()
        )
        .all()
    )


@router.get(
    "/trash",
    response_model=list[FileResponse],
)
def get_deleted_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == 1,
        )
        .order_by(
            File.created_at.desc()
        )
        .all()
    )


@router.get(
    "/stats",
    response_model=StorageStatsResponse,
)
def get_storage_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    active_stats = (
        db.query(
            func.count(File.id),
            func.coalesce(
                func.sum(File.size),
                0,
            ),
        )
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == 0,
        )
        .first()
    )

    deleted_stats = (
        db.query(
            func.count(File.id),
            func.coalesce(
                func.sum(File.size),
                0,
            ),
        )
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == 1,
        )
        .first()
    )

    total_files = int(
        active_stats[0] or 0
    )

    total_size = int(
        active_stats[1] or 0
    )

    deleted_files = int(
        deleted_stats[0] or 0
    )

    deleted_size = int(
        deleted_stats[1] or 0
    )

    remaining_storage = max(
        TOTAL_STORAGE_LIMIT
        - total_size,
        0,
    )

    return {
        "total_files": total_files,
        "total_size": total_size,
        "deleted_files": deleted_files,
        "deleted_size": deleted_size,
        "storage_limit": TOTAL_STORAGE_LIMIT,
        "remaining_storage": remaining_storage,
    }


@router.get(
    "/folder/{folder_id}",
    response_model=list[FileResponse],
)
def get_files_by_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = get_user_folder(
        folder_id=folder_id,
        db=db,
        user_id=current_user.id,
    )

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    return (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.folder_id == folder_id,
            File.is_deleted == 0,
        )
        .order_by(
            File.created_at.desc()
        )
        .all()
    )


@router.get(
    "/search",
    response_model=list[FileResponse],
)
def search_files(
    q: str = Query(
        ...,
        min_length=1,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == 0,
            File.original_name.ilike(
                f"%{q.strip()}%"
            ),
        )
        .order_by(
            File.created_at.desc()
        )
        .all()
    )


@router.get(
    "/type",
    response_model=list[FileResponse],
)
def get_files_by_type(
    mime_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.mime_type == mime_type,
            File.is_deleted == 0,
        )
        .order_by(
            File.created_at.desc()
        )
        .all()
    )


@router.get(
    "/size",
    response_model=list[FileResponse],
)
def get_files_by_size(
    min_size: int | None = Query(
        None,
        ge=0,
    ),
    max_size: int | None = Query(
        None,
        ge=0,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
            ),
        )

    query = (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == 0,
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

    return (
        query
        .order_by(
            File.created_at.desc()
        )
        .all()
    )


@router.put(
    "/{file_id}/star",
    response_model=FileResponse,
)
def toggle_star_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=0,
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    db_file.is_starred = (
        0
        if db_file.is_starred == 1
        else 1
    )

    try:
        db.commit()
        db.refresh(db_file)

        return db_file

    except Exception:
        db.rollback()
        raise


@router.put(
    "/{file_id}/move",
    response_model=FileResponse,
)
def move_file(
    file_id: int,
    data: FileMove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=0,
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    if data.folder_id is not None:
        folder = get_user_folder(
            folder_id=data.folder_id,
            db=db,
            user_id=current_user.id,
        )

        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found",
            )

    try:
        db_file.folder_id = data.folder_id

        db.commit()
        db.refresh(db_file)

        return db_file

    except Exception:
        db.rollback()
        raise


@router.put(
    "/{file_id}/rename",
    response_model=FileResponse,
)
def rename_file(
    file_id: int,
    data: FileRename,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=0,
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    new_name = data.original_name.strip()

    if not new_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name cannot be empty",
        )

    try:
        db_file.original_name = new_name

        db.commit()
        db.refresh(db_file)

        return db_file

    except Exception:
        db.rollback()
        raise


@router.put(
    "/{file_id}/restore",
    response_model=FileResponse,
)
def restore_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=1,
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deleted file not found",
        )

    used_storage = get_user_used_storage(
        db,
        current_user.id,
    )

    if (
        used_storage
        + db_file.size
        > TOTAL_STORAGE_LIMIT
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cannot restore file. "
                "20 GB storage limit would "
                "be exceeded."
            ),
        )

    try:
        db_file.is_deleted = 0

        db.commit()
        db.refresh(db_file)

        return db_file

    except Exception:
        db.rollback()
        raise


@router.get(
    "/{file_id}/preview"
)
def preview_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=0,
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    if is_old_local_path(
        db_file.storage_path
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "This file was uploaded before "
                "Supabase Storage was configured. "
                "Please upload the file again."
            ),
        )

    try:
        file_data = (
            supabase.storage
            .from_(
                settings.SUPABASE_BUCKET
            )
            .download(
                db_file.storage_path
            )
        )

        filename = safe_filename(
            db_file.original_name
        )

        return Response(
            content=file_data,
            media_type=(
                db_file.mime_type
                or "application/octet-stream"
            ),
            headers={
                "Content-Disposition": (
                    f'inline; filename="{filename}"'
                ),
            },
        )

    except Exception as error:
        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "File not found in Supabase Storage. "
                f"{str(error)}"
            ),
        )


@router.get(
    "/{file_id}/download"
)
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=0,
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    if is_old_local_path(
        db_file.storage_path
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "This file was uploaded before "
                "Supabase Storage was configured. "
                "Please upload the file again."
            ),
        )

    try:
        file_data = (
            supabase.storage
            .from_(
                settings.SUPABASE_BUCKET
            )
            .download(
                db_file.storage_path
            )
        )

        filename = safe_filename(
            db_file.original_name
        )

        return Response(
            content=file_data,
            media_type=(
                db_file.mime_type
                or "application/octet-stream"
            ),
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{filename}"'
                ),
            },
        )

    except Exception as error:
        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "File not found in Supabase Storage. "
                f"{str(error)}"
            ),
        )


@router.delete(
    "/{file_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
)
def permanently_delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=1,
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deleted file not found",
        )

    if not is_old_local_path(
        db_file.storage_path
    ):
        try:
            (
                supabase.storage
                .from_(
                    settings.SUPABASE_BUCKET
                )
                .remove(
                    [db_file.storage_path]
                )
            )

        except Exception as error:
            print(
                traceback.format_exc()
            )

            raise HTTPException(
                status_code=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
                detail=(
                    "Failed to delete file from "
                    "Supabase Storage: "
                    f"{str(error)}"
                ),
            )

    try:
        db.delete(db_file)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return None


@router.delete(
    "/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=0,
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    try:
        db_file.is_deleted = 1

        db.commit()

    except Exception:
        db.rollback()
        raise

    return None


@router.get(
    "/{file_id}",
    response_model=FileResponse,
)
def get_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_file = get_user_file(
        file_id=file_id,
        db=db,
        user_id=current_user.id,
        is_deleted=0,
    )

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    return db_file