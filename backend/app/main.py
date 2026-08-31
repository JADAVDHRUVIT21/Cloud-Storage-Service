from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

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
from app.routes.folders import router as folders_router
from app.routes.files import router as files_router
from app.routes.me import router as me_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Cloud Storage Service API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    auth_router,
    prefix="/api/v1"
)

app.include_router(
    folders_router,
    prefix="/api/v1"
)

app.include_router(
    files_router,
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


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description="Cloud Storage Service API",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "HTTPBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    app.openapi_schema = openapi_schema

    return app.openapi_schema


app.openapi = custom_openapi