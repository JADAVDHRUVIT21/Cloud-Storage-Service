from fastapi import FastAPI

from app.core.database import Base, engine
from app.models import User, Folder


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Cloud Storage Service API",
    version="1.0.0",
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