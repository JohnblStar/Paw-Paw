# 기능: AI 챗봇 — 등록 모드 (복약/예방접종 슬롯필링)

## 목표
자유 텍스트를 LLM으로 파싱하는 대신, **키워드 감지 + 버튼/피커 기반 슬롯필링**으로
복약·예방접종 정보를 정확하게 등록한다. LLM을 호출하지 않는다 (토큰 절약 핵심 지점).
`docs/API_SPEC.md` §2.3은 `/chat/query`+`/chat/summary` 자유대화 흐름만 다루고 등록 API를 명시하지 않는데,
이 문서의 슬롯필링은 그와 무관하게 별도로 유지한다 — CLAUDE.md 절대 규칙 4번(키워드/버튼 처리 가능 로직은 LLM 호출 안 함)과
자유 텍스트 파싱 시 카카오 알림 시간/횟수 오등록 리스크 때문.

## 트리거
- 자유 상담 중 "약 먹었어요", "접종했어요" 등 키워드가 감지되면 자동으로 "등록할까요?" 제안
- 또는 대시보드/리스트 모달의 "복약 추가" 버튼에서 직접 시작

## 슬롯필링 순서
1. 반려동물 선택 (다묘/다견 시 버튼으로 지정 — 텍스트 오귀속 방지)
2. 타입에 따라 분기:
   - **복약(반복형)**: 약이름(텍스트) → 하루 횟수(1~5 버튼) → 알림시간(시간피커, 최대 3개) → 복용 기간(시작일 + 종료일, 종료일은 "계속 복용" 선택 시 비워둘 수 있음)
   - **예방접종(단일날짜형)**: 항목명(텍스트) → 날짜(날짜피커) — 리마인드 시점은 1주전/1일전/당일 고정값이라 별도로 묻지 않음
3. 요약 카드 표시 → 확인/수정
4. 저장 → 대시보드 반영, 이후에도 리스트 모달에서 언제든 수정/삭제 가능

## 데이터 스키마
```json
{
  "petId": "string",
  "type": "medication | single_date",
  "title": "string",
  "frequencyPerDay": "number, 1~5 (medication만)",
  "alertTimes": ["HH:mm"],
  "startDate": "YYYY-MM-DD (medication만) — 복용 시작일",
  "endDate": "YYYY-MM-DD | null (medication만) — 복용 종료일, null이면 계속 복용",
  "date": "YYYY-MM-DD (single_date만)"
}
```

## 월간 캘린더 집계 규칙
- 특정 날짜의 `taken/total`은 그 날짜가 `startDate`~`endDate` 범위에 걸쳐 있는 약만 합산한다(등록된 전체 약 무조건 합산 아님).
- 그 날짜에 활성화된 약이 하나도 없으면 `0/0`을 표시하지 않고 해당 날짜를 빈칸(데이터 없음)으로 둔다.

## API
`docs/API_SPEC.md` §2.2(약 관리)는 조회/체크 API만 다루며, 슬롯필링 등록 API는 이 문서가 유일한 명세다.
- `POST /api/v1/pets/{petId}/medications` — 복약 등록
- `POST /api/v1/pets/{petId}/schedules` — 예방접종 등록 (single_date 공용, 검진 등 확장 가능)
- `PATCH /api/v1/pets/{petId}/medications/{id}` — 이름/시간 수정
- `DELETE /api/v1/pets/{petId}/medications/{id}`
- `PATCH /api/v1/pets/{petId}/schedules/{id}` — 항목명/날짜 수정 (대시보드 `ScheduleEditModal`에서 사용)
- `DELETE /api/v1/pets/{petId}/schedules/{id}` (대시보드 `ScheduleEditModal`에서 사용)

## 카카오 알림 연동
- 복약: 지정 시간마다 발송 (하루 최대 3회), 말풍선 [복용 완료] 클릭 시 `POST /api/v1/callback/kakao-medication`으로 즉시 반영
- 예방접종: D-7/D-1/D-day 자동 리마인드

## 다묘/다견 처리
- 리스트 모달에 표시되는 약 이름은 `(반려동물이름)약이름` 형식 권장 (예: "(돌리)알러지 약")

## 주의사항
- 이 흐름은 텍스트 생성이 필요 없으므로 LLM을 호출하지 않는다
- 등록 감지와 증상 감지(`chatbot-consult.md`)는 동시에 독립적으로 동작 — 한 메시지에 둘 다 걸릴 수 있음
