import os
from urllib.parse import quote_plus
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
raw_port = os.getenv("DB_PORT", "").strip()
if not raw_port or raw_port == "3306":
    DB_PORT = "4000" if "tidbcloud.com" in DB_HOST else "3306"
else:
    DB_PORT = raw_port
DB_NAME = os.getenv("DB_NAME", "academiq")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# URL-encode password to handle special chars like @ # % etc.
encoded_password = quote_plus(DB_PASSWORD)

SQLALCHEMY_DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

import certifi

connect_args = {}
if DB_HOST != "localhost" and DB_HOST != "127.0.0.1":
    connect_args = {"ssl": {"ca": certifi.where()}}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
