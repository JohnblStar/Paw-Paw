from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.security import decode_access_token

bearer_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> str:
    try:
        return decode_access_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc
