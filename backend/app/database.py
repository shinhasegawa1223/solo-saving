"""
Database configuration and session management.
"""

import os
from typing import AsyncGenerator

from pydantic_settings import BaseSettings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "appdb")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))

    @property
    def DATABASE_URL(self) -> str:
        """Generate async database URL for asyncpg."""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()


class Base(DeclarativeBase):
    """SQLAlchemy declarative base class."""

    pass


# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # Set to False in production
    future=True,
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
