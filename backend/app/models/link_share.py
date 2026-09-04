import secrets

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.sql import func

from app.core.database import Base


class LinkShare(Base):
    __tablename__ = "link_shares"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    file_id = Column(
        Integer,
        ForeignKey(
            "files.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        unique=True,
        index=True,
    )

    owner_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    token = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        default=lambda: secrets.token_urlsafe(32),
    )

    access_type = Column(
        String(30),
        nullable=False,
        default="restricted",
    )

    role = Column(
        String(20),
        nullable=False,
        default="viewer",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )