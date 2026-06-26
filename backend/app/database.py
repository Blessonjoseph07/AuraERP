from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Determine if using SQLite or PostgreSQL
is_sqlite = settings.database_url.startswith("sqlite")

# For SQLite, we need to allow multiple threads to access it (common in local FastAPI dev)
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
