from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Share(Base):
    __tablename__ = "shares"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    file_id = Column(
        Integer,
        ForeignKey(
            "files.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    folder_id = Column(
        Integer,
        ForeignKey(
            "folders.id",
            ondelete="CASCADE"
        ),
        nullable=True,
        index=True
    )

    owner_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    shared_with_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    role = Column(
        String(20),
        nullable=False,
        default="viewer"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )