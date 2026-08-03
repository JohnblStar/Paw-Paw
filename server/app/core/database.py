from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient | None = None

async def connect_to_mongo() -> None:
    global client
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client["pawpaw"]
    await db.users.create_index("kakaoId", unique=True)
    await db.pets.create_index("ownerId")
    await db.weights.create_index([("petId", 1), ("date", 1)])
    await db.medications.create_index("petId")
    await db.schedules.create_index([("petId", 1), ("date", 1)])
    await db.reports.create_index([("petId", 1), ("year", 1), ("month", 1)])
    await db.notificationReads.create_index([("userId", 1), ("notificationId", 1)], unique=True)
    await db.chatCache.create_index("expiresAt", expireAfterSeconds=0)

async def close_mongo_connection() -> None:
    if client is not None:
        client.close()

def get_database():
    return client["pawpaw"]