from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class File(Base):
    __tablename__ = "files"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(255),
        nullable=False
    )

    original_name = Column(
        String(255),
        nullable=False
    )

    storage_path = Column(
        String(500),
        nullable=False
    )

    mime_type = Column(
        String(150),
        nullable=True
    )

    size = Column(
        BigInteger,
        nullable=False
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    folder_id = Column(
        Integer,
        ForeignKey("folders.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    is_deleted = Column(
        Integer,
        nullable=False,
        default=0,
        index=True
    )

    is_starred = Column(
        Integer,
        nullable=False,
        default=0,
        index=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )