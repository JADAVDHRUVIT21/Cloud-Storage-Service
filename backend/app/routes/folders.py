from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.folder import Folder
from app.models.user import User
from app.schemas.folder import FolderCreate, FolderUpdate, FolderResponse


router = APIRouter(
    prefix="/folders",
    tags=["Folders"]
)


@router.post(
    "/",
    response_model=FolderResponse,
    status_code=status.HTTP_201_CREATED
)
def create_folder(
    data: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.parent_id is not None:
        parent_folder = (
            db.query(Folder)
            .filter(
                Folder.id == data.parent_id,
                Folder.owner_id == current_user.id
            )
            .first()
        )

        if not parent_folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent folder not found"
            )

    folder = Folder(
        name=data.name,
        owner_id=current_user.id,
        parent_id=data.parent_id
    )

    db.add(folder)
    db.commit()
    db.refresh(folder)

    return folder


@router.get(
    "/",
    response_model=list[FolderResponse]
)
def get_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folders = (
        db.query(Folder)
        .filter(Folder.owner_id == current_user.id)
        .order_by(Folder.created_at.desc())
        .all()
    )
    
    

    return folders

@router.get(
    "/{folder_id}",
    response_model=FolderResponse
)
def get_folder(
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

    return folder

@router.put(
    "/{folder_id}",
    response_model=FolderResponse
)
def update_folder(
    folder_id: int,
    data: FolderUpdate,
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

    folder.name = data.name

    db.commit()
    db.refresh(folder)

    return folder

@router.delete(
    "/{folder_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_folder(
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

    db.delete(folder)
    db.commit()

    return None