from supabase import create_client
from app.core.config import settings


supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY
)


BUCKET_NAME = settings.SUPABASE_BUCKET