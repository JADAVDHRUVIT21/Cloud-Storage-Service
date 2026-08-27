from fastapi import FastAPI

from app.core.database import Base, engine

from app.models import (
    User,
    Folder,
    File,
    FileVersion,
    Share,
    LinkShare,
    Star,
    Activity,
)

from app.routes.auth import router as auth_router
from app.routes.me import router as me_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Cloud Storage Service API",
    version="1.0.0",
)


app.include_router(
    auth_router,
    prefix="/api/v1"
)

app.include_router(
    me_router,
    prefix="/api/v1"
)


@app.get("/")
def root():
    return {
        "message": "Cloud Storage Service API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }