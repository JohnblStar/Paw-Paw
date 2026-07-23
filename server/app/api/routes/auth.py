from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.database import get_database
from app.core.security import create_access_token
from app.services.kakao import KakaoAuthError, exchange_code_for_token, fetch_kakao_profile

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

class KakaoCallbackRequest(BaseModel):
    code: str

class KakaoCallbackResponse(BaseModel):
    accessToken: str
    isNewUser: bool

@router.post("/kakao/callback", response_model=KakaoCallbackResponse)
async def kakao_callback(body: KakaoCallbackRequest):
    try:
        kakao_token = await exchange_code_for_token(body.code)
        profile = await fetch_kakao_profile(kakao_token)
    except KakaoAuthError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    users = get_database().users
    existing = await users.find_one({"kakaoId": profile["kakaoId"]})

    if existing:
        user_id = existing["_id"]
        is_new_user = False
    else:
        doc = {
            "kakaoId": profile["kakaoId"],
            "name": profile["name"],
            "profileImage": profile["profileImage"],
            "age": None,
            "createdAt": datetime.now(timezone.utc),
        }
        result = await users.insert_one(doc)
        user_id = result.inserted_id
        is_new_user = True

    access_token = create_access_token(str(user_id))
    return KakaoCallbackResponse(accessToken=access_token, isNewUser=is_new_user)