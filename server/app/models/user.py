from datetime import datetime

from pydantic import BaseModel


class UserOut(BaseModel):
    id: str
    kakaoId: str
    name: str
    profileImage: str | None = None
    age: int | None = None
    createdAt: datetime

    @classmethod
    def from_mongo(cls, doc: dict) -> "UserOut":
        return cls(
            id=str(doc["_id"]),
            kakaoId=doc["kakaoId"],
            name=doc["name"],
            profileImage=doc.get("profileImage"),
            age=doc.get("age"),
            createdAt=doc["createdAt"],
        )