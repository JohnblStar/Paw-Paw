# 기능: 인증 (Kakao 로그인 + JWT)

## 목표
반려인은 별도 회원가입 폼 없이 Kakao 소셜 로그인만으로 가입/로그인한다.

## 플로우
1. 인트로 페이지(`docs/features/intro.md`)의 로그인 카드에서 "카카오톡 로그인" 클릭
2. Kakao OAuth 인증 → 서버가 사용자 정보(이름, 프로필사진) 수신
3. 최초 로그인이면 신규 유저로 DB 생성, 아니면 기존 유저 조회
4. 서버가 JWT 발급 → 이후 요청은 `Authorization: Bearer {token}`

## API
- `POST /api/v1/auth/kakao/callback` — Kakao 인가 코드 수신 → JWT 반환
  - Request: `{ code: string }`
  - Response: `{ accessToken: string, isNewUser: boolean }`

## 데이터 모델 (users)
```json
{
  "_id": "ObjectId",
  "kakaoId": "string",
  "name": "string",
  "profileImage": "string | null",
  "age": "number | null",
  "createdAt": "datetime"
}
```

## 주의사항
- 연령(age)은 카카오에서 항상 제공되지 않으므로, 최초 로그인 후 별도로 수동 입력받아야 할 수 있음 (마이페이지에서 편집 가능하게)
- 별도 회원가입 폼은 만들지 않는다 — 로그인 성공 시 온보딩 없이 바로 메인페이지로 이동 (반려동물이 없으면 빈 상태 버튼 노출, `docs/features/dashboard.md` 참고)
