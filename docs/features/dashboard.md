# 기능: 대시보드

## 목표
선택된 반려동물(Active Pet ID)의 건강 현황을 한눈에 보여준다.

## 화면 2종
- **메인페이지**(로그인 후 첫 화면, 간소화 대시보드): 아래 "메인페이지 상세" 참고. "자세히 보기"로 전체 대시보드 전환.
- **전체 대시보드**: 기본정보, 체중그래프, 오늘 복용한 약, 월간 복약 캘린더, 뽀삐의 건강(증상 기록), 예방접종/검진 D-Day

## 메인페이지 상세 (레이아웃 & 로직)

### 레이아웃
- 좌측: 작은 정보 위젯 — 반려동물 이름, 현재 체중, D-Day 메모, 주간 복약 캘린더 (전체 대시보드보다 축소된 정보만)
- 중앙: **마스코트 Lottie 애니메이션**(`client/src/components/mainpage/Mascot.jsx`). 반려동물 종(dog/cat)에 맞는 애니메이션을 지연 로드해서 재생 — 현재는 종당 1개 애니메이션(상태별 세분화 없음). 에셋은 `client/src/assets/lottie/mascot-{dog,cat}.json`
- 우측: 말풍선 — 아래 "말풍선 알림 로직" 참고

### 말풍선 알림 로직 (장식용 랜덤 멘트 아님)
말풍선 문구는 아래 우선순위로 결정한다. 위 조건에 해당하는 게 있으면 그것을 표시하고, 없으면 기본 flavor 멘트로 내려간다.
1. 오늘 미복용 약이 있음 → 예: "오늘 약 아직 안 먹었어요!"
2. 예방접종/검진 D-Day가 3일 이내로 임박 → 예: "예방접종이 D-3예요!"
3. 오늘 챗봇을 통해 새로운 특이사항이 기록됨 → 예: "오늘 좀 컨디션이 안 좋았어요..."
4. 위 조건 모두 없음 → 기본 flavor 멘트 (기존 "배고파여" 같은 감성적 랜덤 멘트)
   - flavor 멘트도 장식이 아니라 종/시간대에 맞는 행동 가이드를 겸한다 — 강아지 전용 행동(산책 등)이
     고양이에게 나오면 안 되므로, 반려동물 종(dog/cat) × 시간대(아침/낮/저녁/밤)로 멘트 풀을 분리해
     그 조합에 맞는 멘트만 무작위로 고른다 (`client/src/constants/flavorMessages.js`,
     `client/src/utils/bubbleMessage.js`).

### 빈 상태 (반려동물 미등록)
신규 가입 직후처럼 등록된 반려동물이 없으면, 위 위젯들 대신 **"반려동물을 등록해주세요" 버튼 하나만** 노출한다. 클릭 시 반려동물 추가 화면(`docs/features/mypetsy.md`)으로 이동.

## 핵심 로직
- **체중 그래프 보간**: 미입력일은 직전 값으로 채워 선이 끊기지 않게 (`GET /api/v1/pets/{petId}/weights/monthly`가 1일~말일 빈틈없는 배열을 반환)
- **오늘 복용한 약**: `완료/전체` 형식으로 표기 (예: 2/3). 전체 완료 시 검정, 미완료 있으면 빨간색
- **캘린더**: 간소화 대시보드는 이번주 7일(월~일), 전체 대시보드는 월 단위 그리드. 날짜 클릭 시 해당일 복약 목록 확인/정정 팝오버
- 과거/오늘뿐 아니라 미래 날짜도 `endDate` 기준으로 계산해 표시한다 (`docs/features/chatbot-registration.md`의 "월간 캘린더 집계 규칙" 참고). 미래 칸은 완료/미완료 색과 구분되는 옅은 스타일로 표시.
- **뽀삐의 건강**: AI 챗봇이 감지한 특이사항이 자동으로 쌓이는 목록. 병명 없이 증상 서술만. "편집하기"로 사용자가 직접 수정 가능

## API
- `GET /api/v1/pets/{petId}/dashboard` — 대시보드 전체 데이터 조합 응답
- `GET /api/v1/pets/{petId}/weights/monthly?month=YYYY-MM`
- `GET /api/v1/pets/{petId}/medications/today`
- `GET /api/v1/pets/{petId}/medications/calendar?month=YYYY-MM`
- `PATCH /api/v1/pets/{petId}/medications/{medicationId}/check` — 복약 완료 토글

## 데이터 모델 (pets)
```json
{
  "_id": "ObjectId",
  "ownerId": "ObjectId",
  "name": "string",
  "species": "dog | cat",
  "breed": "string | null",
  "birthDate": "date",
  "managedConditions": ["string"],
  "healthNotes": [
    { "date": "date", "bodyPart": "string", "note": "string (병명 없음)" }
  ]
}
```

## 주의사항
- 반려동물 추가/설정 화면의 실시간 미리보기 패널은 만들지 않는다 (스코프 아웃 확정)
- 개발자 로그 버튼 등 디버그 UI는 프로덕션 화면에 노출하지 않는다
