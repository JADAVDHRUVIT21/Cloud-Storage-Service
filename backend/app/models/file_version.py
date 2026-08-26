from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class FileVersion(Base):
    __tablename__ = "file_versions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    file_id = Column(
        Integer,
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    version_number = Column(
        Integer,
        nullable=False
    )

    storage_path = Column(
        String(500),
        nullable=False
    )

    size = Column(
        BigInteger,
        nullable=False
    )

    mime_type = Column(
        String(150),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )