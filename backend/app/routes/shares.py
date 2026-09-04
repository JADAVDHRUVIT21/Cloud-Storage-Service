import os

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.file import File
from app.models.folder import Folder
from app.models.link_share import LinkShare
from app.models.share import Share
from app.models.user import User

from app.schemas.share import (
    FileSharingResponse,
    FolderSharingResponse,
    LinkShareResponse,
    LinkShareUpdate,
    ShareFileRequest,
    ShareFolderRequest,
    SharedUserResponse,
)


router = APIRouter(
    prefix="/shares",
    tags=["Sharing"],
)


def get_owned_file(
    file_id: int,
    db: Session,
    current_user: User,
):
    file = (
        db.query(File)
        .filter(
            File.id == file_id,
            File.owner_id == current_user.id,
            File.is_deleted == 0,
        )
        .first()
    )

    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or you do not own this file",
        )

    return file
def get_owned_folder(
    folder_id: int,
    db: Session,
    current_user: User,
):
    folder = (
        db.query(Folder)
        .filter(
            Folder.id == folder_id,
            Folder.owner_id == current_user.id,
        )
        .first()
    )

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found or you do not own this folder",
        )

    return folder

def get_file_by_id(
    file_id: int,
    db: Session,
):
    file = (
        db.query(File)
        .filter(
            File.id == file_id,
            File.is_deleted == 0,
        )
        .first()
    )

    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    return file


def get_owned_folder(
    folder_id: int,
    db: Session,
    current_user: User,
):
    folder = (
        db.query(Folder)
        .filter(
            Folder.id == folder_id,
            Folder.owner_id == current_user.id,
        )
        .first()
    )

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found or you do not own this folder",
        )

    return folder


@router.post(
    "/files/{file_id}",
    response_model=SharedUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def share_file_with_user(
    file_id: int,
    data: ShareFileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_file(
        file_id=file_id,
        db=db,
        current_user=current_user,
    )

    email = data.email.strip().lower()

    user_to_share = (
        db.query(User)
        .filter(
            User.email == email,
        )
        .first()
    )

    if not user_to_share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered user found with this email",
        )

    if user_to_share.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot share a file with yourself",
        )

    existing_share = (
        db.query(Share)
        .filter(
            Share.file_id == file_id,
            Share.shared_with_id == user_to_share.id,
        )
        .first()
    )

    try:
        if existing_share:
            existing_share.role = data.role

            db.commit()
            db.refresh(existing_share)

            return {
                "id": user_to_share.id,
                "full_name": user_to_share.full_name,
                "email": user_to_share.email,
                "role": existing_share.role,
                "shared_at": existing_share.created_at,
            }

        new_share = Share(
            file_id=file_id,
            folder_id=None,
            owner_id=current_user.id,
            shared_with_id=user_to_share.id,
            role=data.role,
        )

        db.add(new_share)
        db.commit()
        db.refresh(new_share)

        return {
            "id": user_to_share.id,
            "full_name": user_to_share.full_name,
            "email": user_to_share.email,
            "role": new_share.role,
            "shared_at": new_share.created_at,
        }

    except SQLAlchemyError as error:
        db.rollback()

        print("DATABASE ERROR:", str(error))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to share file",
        )


@router.get(
    "/files/{file_id}",
    response_model=FileSharingResponse,
)
def get_file_sharing(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_file(
        file_id=file_id,
        db=db,
        current_user=current_user,
    )

    try:
        shares = (
            db.query(Share, User)
            .join(
                User,
                Share.shared_with_id == User.id,
            )
            .filter(
                Share.file_id == file_id,
            )
            .order_by(
                Share.created_at.desc(),
            )
            .all()
        )

        link_share = (
            db.query(LinkShare)
            .filter(
                LinkShare.file_id == file_id,
            )
            .first()
        )

        shared_users = []

        for share, shared_user in shares:
            shared_users.append(
                {
                    "id": shared_user.id,
                    "full_name": shared_user.full_name,
                    "email": shared_user.email,
                    "role": share.role,
                    "shared_at": share.created_at,
                }
            )

        return {
            "file_id": file_id,
            "access_type": (
                link_share.access_type
                if link_share
                else "restricted"
            ),
            "share_token": (
                link_share.token
                if link_share
                else None
            ),
            "shared_users": shared_users,
        }

    except SQLAlchemyError as error:
        print("DATABASE ERROR:", str(error))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load sharing information",
        )


@router.delete(
    "/files/{file_id}/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_shared_user(
    file_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_file(
        file_id=file_id,
        db=db,
        current_user=current_user,
    )

    share = (
        db.query(Share)
        .filter(
            Share.file_id == file_id,
            Share.shared_with_id == user_id,
        )
        .first()
    )

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared user not found",
        )

    try:
        db.delete(share)
        db.commit()

    except SQLAlchemyError as error:
        db.rollback()

        print("DATABASE ERROR:", str(error))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to remove user access",
        )

    return None


@router.put(
    "/files/{file_id}/link",
    response_model=LinkShareResponse,
)
def update_file_link_access(
    file_id: int,
    data: LinkShareUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_file(
        file_id=file_id,
        db=db,
        current_user=current_user,
    )

    link_share = (
        db.query(LinkShare)
        .filter(
            LinkShare.file_id == file_id,
        )
        .first()
    )

    try:
        if not link_share:
            link_share = LinkShare(
                file_id=file_id,
                owner_id=current_user.id,
                access_type=data.access_type,
                role="viewer",
            )

            db.add(link_share)

        else:
            link_share.access_type = data.access_type

        db.commit()
        db.refresh(link_share)

        return link_share

    except SQLAlchemyError as error:
        db.rollback()

        print("DATABASE ERROR:", str(error))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update link access",
        )


@router.post(
    "/folders/{folder_id}",
    response_model=SharedUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def share_folder_with_user(
    folder_id: int,
    data: ShareFileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_folder(
        folder_id=folder_id,
        db=db,
        current_user=current_user,
    )

    email = data.email.strip().lower()

    user_to_share = (
        db.query(User)
        .filter(
            User.email == email,
        )
        .first()
    )

    if not user_to_share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered user found with this email",
        )

    if user_to_share.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot share a folder with yourself",
        )

    existing_share = (
        db.query(Share)
        .filter(
            Share.folder_id == folder_id,
            Share.shared_with_id == user_to_share.id,
        )
        .first()
    )

    try:
        if existing_share:
            existing_share.role = data.role

            db.commit()
            db.refresh(existing_share)

            return {
                "id": user_to_share.id,
                "full_name": user_to_share.full_name,
                "email": user_to_share.email,
                "role": existing_share.role,
                "shared_at": existing_share.created_at,
            }

        new_share = Share(
            file_id=None,
            folder_id=folder_id,
            owner_id=current_user.id,
            shared_with_id=user_to_share.id,
            role=data.role,
        )

        db.add(new_share)
        db.commit()
        db.refresh(new_share)

        return {
            "id": user_to_share.id,
            "full_name": user_to_share.full_name,
            "email": user_to_share.email,
            "role": new_share.role,
            "shared_at": new_share.created_at,
        }

    except SQLAlchemyError as error:
        db.rollback()

        print("DATABASE ERROR:", str(error))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to share folder",
        )


@router.get(
    "/folders/{folder_id}",
    response_model=FileSharingResponse,
)
def get_folder_sharing(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_folder(
        folder_id=folder_id,
        db=db,
        current_user=current_user,
    )

    try:
        shares = (
            db.query(Share, User)
            .join(
                User,
                Share.shared_with_id == User.id,
            )
            .filter(
                Share.folder_id == folder_id,
            )
            .order_by(
                Share.created_at.desc(),
            )
            .all()
        )

        shared_users = []

        for share, shared_user in shares:
            shared_users.append(
                {
                    "id": shared_user.id,
                    "full_name": shared_user.full_name,
                    "email": shared_user.email,
                    "role": share.role,
                    "shared_at": share.created_at,
                }
            )

        return {
            "file_id": folder_id,
            "access_type": "restricted",
            "share_token": None,
            "shared_users": shared_users,
        }

    except SQLAlchemyError as error:
        print("DATABASE ERROR:", str(error))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load folder sharing information",
        )


@router.delete(
    "/folders/{folder_id}/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_folder_shared_user(
    folder_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_folder(
        folder_id=folder_id,
        db=db,
        current_user=current_user,
    )

    share = (
        db.query(Share)
        .filter(
            Share.folder_id == folder_id,
            Share.shared_with_id == user_id,
        )
        .first()
    )

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared user not found",
        )

    try:
        db.delete(share)
        db.commit()

    except SQLAlchemyError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to remove user access",
        )

    return None


@router.get(
    "/public/{token}",
)
def open_public_shared_file(
    token: str,
    db: Session = Depends(get_db),
):
    link_share = (
        db.query(LinkShare)
        .filter(
            LinkShare.token == token,
            LinkShare.access_type == "anyone_with_link",
        )
        .first()
    )

    if not link_share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This share link is invalid, restricted, or disabled",
        )

    file = (
        db.query(File)
        .filter(
            File.id == link_share.file_id,
            File.is_deleted == 0,
        )
        .first()
    )

    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    if not os.path.exists(file.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found",
        )

    return FastAPIFileResponse(
        path=file.storage_path,
        media_type=(
            file.mime_type
            or "application/octet-stream"
        ),
        headers={
            "Content-Disposition": (
                f'inline; filename="{file.original_name}"'
            )
        },
    )


@router.get(
    "/files/{file_id}/access",
)
def access_shared_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file = get_file_by_id(
        file_id=file_id,
        db=db,
    )

    if file.owner_id == current_user.id:
        has_access = True

    else:
        share = (
            db.query(Share)
            .filter(
                Share.file_id == file_id,
                Share.shared_with_id == current_user.id,
            )
            .first()
        )

        has_access = share is not None

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this file",
        )

    if not os.path.exists(file.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found",
        )

    return FastAPIFileResponse(
        path=file.storage_path,
        media_type=(
            file.mime_type
            or "application/octet-stream"
        ),
        headers={
            "Content-Disposition": (
                f'inline; filename="{file.original_name}"'
            )
        },
    )


@router.get(
    "/files/{file_id}/permission",
)
@router.post(
    "/folders/{folder_id}",
    response_model=SharedUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def share_folder_with_user(
    folder_id: int,
    data: ShareFolderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_folder(
        folder_id=folder_id,
        db=db,
        current_user=current_user,
    )

    email = data.email.strip().lower()

    user_to_share = (
        db.query(User)
        .filter(
            User.email == email,
        )
        .first()
    )

    if not user_to_share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered user found with this email",
        )

    if user_to_share.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot share a folder with yourself",
        )

    existing_share = (
        db.query(Share)
        .filter(
            Share.folder_id == folder_id,
            Share.shared_with_id == user_to_share.id,
        )
        .first()
    )

    try:

        if existing_share:

            existing_share.role = data.role

            db.commit()
            db.refresh(existing_share)

            return {
                "id": user_to_share.id,
                "full_name": user_to_share.full_name,
                "email": user_to_share.email,
                "role": existing_share.role,
                "shared_at": existing_share.created_at,
            }

        new_share = Share(
            file_id=None,
            folder_id=folder_id,
            owner_id=current_user.id,
            shared_with_id=user_to_share.id,
            role=data.role,
        )

        db.add(new_share)
        db.commit()
        db.refresh(new_share)

        return {
            "id": user_to_share.id,
            "full_name": user_to_share.full_name,
            "email": user_to_share.email,
            "role": new_share.role,
            "shared_at": new_share.created_at,
        }

    except SQLAlchemyError as error:

        db.rollback()

        print(
            "DATABASE ERROR:",
            str(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to share folder",
        )
def get_file_permission(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file = get_file_by_id(
        file_id=file_id,
        db=db,
    )

    if file.owner_id == current_user.id:
        return {
            "file_id": file_id,
            "access": True,
            "role": "owner",
        }

    share = (
        db.query(Share)
        .filter(
            Share.file_id == file_id,
            Share.shared_with_id == current_user.id,
        )
        .first()
    )

    if not share:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this file",
        )

    return {
        "file_id": file_id,
        "access": True,
        "role": share.role,
    }
    
    