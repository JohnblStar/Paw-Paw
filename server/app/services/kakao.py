import httpx

from app.core.config import settings

KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token"
KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me"


class KakaoAuthError(Exception):
    pass


async def exchange_code_for_token(code: str) -> str:
    data = {
        "grant_type": "authorization_code",
        "client_id": settings.KAKAO_CLIENT_ID,
        "redirect_uri": settings.KAKAO_REDIRECT_URI,
        "code": code,
    }
    if settings.KAKAO_CLIENT_SECRET:
        data["client_secret"] = settings.KAKAO_CLIENT_SECRET

    async with httpx.AsyncClient() as client:
        response = await client.post(KAKAO_TOKEN_URL, data=data)

    if response.status_code != 200:
        raise KakaoAuthError(f"Kakao token exchange failed: {response.text}")

    return response.json()["access_token"]


async def fetch_kakao_profile(kakao_access_token: str) -> dict:
    headers = {"Authorization": f"Bearer {kakao_access_token}"}

    async with httpx.AsyncClient() as client:
        response = await client.get(KAKAO_USER_INFO_URL, headers=headers)

    if response.status_code != 200:
        raise KakaoAuthError(f"Kakao profile fetch failed: {response.text}")

    payload = response.json()
    kakao_account = payload.get("kakao_account", {})
    profile = kakao_account.get("profile", {})

    return {
        "kakaoId": str(payload["id"]),
        "name": profile.get("nickname", ""),
        "profileImage": profile.get("profile_image_url"),
    }