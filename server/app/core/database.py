from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

client: AsyncIOMotorClient | None = None


async def connect_to_mongo() -> None:
    global client
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client["pawpaw"]
    await db.users.create_index("kakaoId", unique=True)


async def close_mongo_connection() -> None:
    if client is not None:
        client.close()


def get_database():
    return client["pawpaw"]