from fastapi import FastAPI
from fastapi.openapi.models import HTTPBearer as HTTPBearerModel
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBearer

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