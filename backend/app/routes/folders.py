import io
import os
import zipfile

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.file import File
from app.models.folder import Folder
from app.models.user import User

from app.schemas.folder import (
    FolderCreate,
    FolderUpdate,
    FolderResponse,
)


router = APIRouter(
    prefix="/folders",
    tags=["Folders"]
)


def get_owned_folder(
    folder_id: int,
    db: Session,
    current_user: User,
    is_deleted: int | None = 0,
):
    query = (
        db.query(Folder)
        .filter(
            Folder.id == folder_id,
            Folder.owner_id == current_user.id,
        )
    )

    if is_deleted is not None:
        query = query.filter(
            Folder.is_deleted == is_deleted
        )

    folder = query.first()

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    return folder


def get_all_child_folder_ids(
    folder_id: int,
    db: Session,
    user_id: int,
):
    folder_ids = [folder_id]

    pending_folder_ids = [folder_id]

    while pending_folder_ids:

        child_folders = (
            db.query(Folder)
            .filter(
                Folder.parent_id.in_(
                    pending_folder_ids
                ),
                Folder.owner_id == user_id,
            )
            .all()
        )

        pending_folder_ids = []

        for child_folder in child_folders:

            if (
                child_folder.id
                not in folder_ids
            ):
                folder_ids.append(
                    child_folder.id
                )

                pending_folder_ids.append(
                    child_folder.id
                )

    return folder_ids


@router.post(
    "/",
    response_model=FolderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_folder(
    data: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.parent_id is not None:

        parent_folder = (
            db.query(Folder)
            .filter(
                Folder.id == data.parent_id,
                Folder.owner_id == current_user.id,
                Folder.is_deleted == 0,
            )
            .first()
        )

        if not parent_folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent folder not found",
            )

    folder = Folder(
        name=data.name.strip(),
        owner_id=current_user.id,
        parent_id=data.parent_id,
        is_deleted=0,
    )

    db.add(folder)
    db.commit()
    db.refresh(folder)

    return folder


@router.get(
    "/",
    response_model=list[FolderResponse],
)
def get_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folders = (
        db.query(Folder)
        .filter(
            Folder.owner_id == current_user.id,
            Folder.is_deleted == 0,
        )
        .order_by(
            Folder.created_at.desc()
        )
        .all()
    )

    return folders


@router.get(
    "/trash/",
    response_model=list[FolderResponse],
)
def get_deleted_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folders = (
        db.query(Folder)
        .filter(
            Folder.owner_id == current_user.id,
            Folder.is_deleted == 1,
        )
        .order_by(
            Folder.created_at.desc()
        )
        .all()
    )

    return folders


@router.get(
    "/{folder_id}",
    response_model=FolderResponse,
)
def get_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owned_folder(
        folder_id=folder_id,
        db=db,
        current_user=current_user,
        is_deleted=0,
    )


@router.put(
    "/{folder_id}",
    response_model=FolderResponse,
)
def update_folder(
    folder_id: int,
    data: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = get_owned_folder(
        folder_id=folder_id,
        db=db,
        current_user=current_user,
        is_deleted=0,
    )

    folder.name = data.name.strip()

    db.commit()
    db.refresh(folder)

    return folder


@router.put(
    "/{folder_id}/rename",
    response_model=FolderResponse,
)
def rename_folder(
    folder_id: int,
    data: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = get_owned_folder(
        folder_id=folder_id,
        db=db,
        current_user=current_user,
        is_deleted=0,
    )

    folder.name = data.name.strip()

    db.commit()
    db.refresh(folder)

    return folder


@router.put(
    "/{folder_id}/restore",
    response_model=FolderResponse,
)
def restore_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = get_owned_folder(
        folder_id=folder_id,
        db=db,
        current_user=current_user,
        is_deleted=1,
    )

    folder_ids = get_all_child_folder_ids(
        folder_id=folder.id,
        db=db,
        user_id=current_user.id,
    )

    (
        db.query(Folder)
        .filter(
            Folder.id.in_(folder_ids),
            Folder.owner_id == current_user.id,
        )
        .update(
            {
                Folder.is_deleted: 0
            },
            synchronize_session=False,
        )
    )

    (
        db.query(File)
        .filter(
            File.folder_id.in_(folder_ids),
            File.owner_id == current_user.id,
            File.is_deleted == 1,
        )
        .update(
            {
                File.is_deleted: 0
            },
            synchronize_session=False,
        )
    )

    db.commit()
    db.refresh(folder)

    return folder


@router.delete(
    "/{folder_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
)
def permanently_delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = get_owned_folder(
        folder_id=folder_id,
        db=db,
        current_user=current_user,
        is_deleted=1,
    )

    folder_ids = get_all_child_folder_ids(
        folder_id=folder.id,
        db=db,
        user_id=current_user.id,
    )

    files = (
        db.query(File)
        .filter(
            File.folder_id.in_(folder_ids),
            File.owner_id == current_user.id,
        )
        .all()
    )

    for file in files:

        if (
            file.storage_path
            and os.path.exists(
                file.storage_path
            )
        ):
            os.remove(
                file.storage_path
            )

        db.delete(file)

    (
        db.query(Folder)
        .filter(
            Folder.id.in_(folder_ids),
            Folder.owner_id == current_user.id,
        )
        .delete(
            synchronize_session=False
        )
    )

    db.commit()

    return None


@router.get(
    "/{folder_id}/download",
)
def download_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = get_owned_folder(
        folder_id=folder_id,
        db=db,
        current_user=current_user,
        is_deleted=0,
    )

    folder_ids = get_all_child_folder_ids(
        folder_id=folder.id,
        db=db,
        user_id=current_user.id,
    )

    files = (
        db.query(File)
        .filter(
            File.folder_id.in_(folder_ids),
            File.owner_id == current_user.id,
            File.is_deleted == 0,
        )
        .all()
    )

    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(
        zip_buffer,
        "w",
        zipfile.ZIP_DEFLATED,
    ) as zip_file:

        for file in files:

            if (
                file.storage_path
                and os.path.exists(
                    file.storage_path
                )
            ):

                zip_file.write(
                    file.storage_path,
                    arcname=file.original_name,
                )

    zip_buffer.seek(0)

    safe_folder_name = (
        folder.name
        .replace("/", "_")
        .replace("\\", "_")
    )

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{safe_folder_name}.zip"'
            )
        },
    )


@router.delete(
    "/{folder_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = get_owned_folder(
        folder_id=folder_id,
        db=db,
        current_user=current_user,
        is_deleted=0,
    )

    folder_ids = get_all_child_folder_ids(
        folder_id=folder.id,
        db=db,
        user_id=current_user.id,
    )

    (
        db.query(Folder)
        .filter(
            Folder.id.in_(folder_ids),
            Folder.owner_id == current_user.id,
        )
        .update(
            {
                Folder.is_deleted: 1
            },
            synchronize_session=False,
        )
    )

    (
        db.query(File)
        .filter(
            File.folder_id.in_(folder_ids),
            File.owner_id == current_user.id,
            File.is_deleted == 0,
        )
        .update(
            {
                File.is_deleted: 1
            },
            synchronize_session=False,
        )
    )

    db.commit()

    return None

@router.get(
    "/{folder_id}/trash-files"
)
def get_deleted_files_in_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    folder = get_owned_folder(
        folder_id=folder_id,
        db=db,
        current_user=current_user,
        is_deleted=1,
    )

    files = (
        db.query(File)
        .filter(
            File.folder_id == folder.id,
            File.owner_id == current_user.id,
            File.is_deleted == 1,
        )
        .order_by(
            File.created_at.desc()
        )
        .all()
    )

    return files