from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.database import get_database
from app.core.deps import get_current_user
from app.models.pet import PetOut
from app.models.user import UserOut

router = APIRouter(prefix="/api/v1/users", tags=["users"])

@router.get("/me", response_model=UserOut)
async def get_my_profile(user_id: str = Depends(get_current_user)):
    db = get_database()
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if user_doc is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut.from_mongo(user_doc)

@router.get("/pets", response_model=list[PetOut])
async def list_my_pets(user_id: str = Depends(get_current_user)):
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    active_pet_id = user.get("activePetId") if user else None

    pets = []
    cursor = db.pets.find({"ownerId": ObjectId(user_id)})
    async for doc in cursor:
        latest_weight = await db.weights.find_one({"petId": doc["_id"]}, sort=[("date", -1)])
        if latest_weight is not None:
            doc["weight"] = latest_weight["value"]
        pet = PetOut.from_mongo(doc)
        pet.isActive = doc["_id"] == active_pet_id
        pets.append(pet)
    return pets

class CallPetResponse(BaseModel):
    success: bool
    calledPetId: str
    message: str

@router.patch("/pets/{petId}/call", response_model=CallPetResponse)
async def call_pet(petId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    pet_doc = await db.pets.find_one({"_id": ObjectId(petId), "ownerId": ObjectId(user_id)})
    if pet_doc is None:
        raise HTTPException(status_code=404, detail="Pet not found")

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"activePetId": ObjectId(petId)}},
    )
    return CallPetResponse(
        success=True,
        calledPetId=petId,
        message=f"현재 대시보드가 '{pet_doc['name']}'의 정보로 전환되었습니다.",
    )
