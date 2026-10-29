# 기능: AI 챗봇 — 자유 상담 모드

## 목표
사용자가 자유롭게 증상/질문을 입력하면 완곡한 어조로 답변하고, 특이사항은 대시보드에 자동 기록한다.
`docs/features/chatbot-registration.md`(등록 감지기)와 **매 메시지마다 병렬로 함께 동작**한다 — 자세한 아키텍처는 `docs/SPEC.md` 6장 참고.

## 컨텍스트 주입
대화 시작 시 아래를 백그라운드로 읽어와 프롬프트에 **요약 형태로만** 포함 (전체 기록 통째로 넣지 않기 — 토큰 절약):
- 반려동물 기본정보(나이/체중/복용약)
- 최근 체중 1~2개 값
- 복용 중인 약 리스트
- 최근 특이사항 1~2개
- 캐싱된 품종 가이드 — **사용자에게는 비노출**, 답변 품질 향상 용도로만 조용히 포함 (`docs/features/breed-guide.md` 참고)

## 응답 규칙
- 병명 언급 가능하지만 반드시 완곡한 추정형("~일지도 모릅니다")
- 신뢰할 수 있는 출처 표기 필수, **실존하지 않는 링크는 지어내지 않는다**
- 이미 걸린 질병에 대한 질문이면 "이런 걸 조심하세요" 형태로 답변

## 출처 표기 규칙
`answerText`/`suspectedSymptom`에 붙는 `[출처: ...]`는 아래 고정 카테고리 라벨 3종 중 하나만 쓴다. 구체적인 논문/문서명을 생성하지 않는다 (`docs/SPEC.md` 6.4 참고).
- 일반 수의학 상식
- 품종별 유전질환 정보
- 등록된 데이터 기반 추정

## 답변 스타일 (순서 고정)
1. 진단 가설 제시 ("~일지도 모릅니다" 식 완곡한 추정)
2. 판단 가능한 기준 제시 (수치/증상 등 사용자가 직접 확인할 수 있는 근거)
3. 잘못된 대처 시 경고
4. 단계별 행동지침
5. 필요시 "수의사 상담을 권장합니다"로 마무리

## 증상 감지 방식
- 명백히 무증상인 메시지는 규칙 기반으로 우선 걸러낸다 (LLM 호출 자체를 줄이는 용도는 아님 — 자유 상담은 항상 답변 생성이 필요하므로, 여기서는 대시보드 자동 기록 여부만 사전 필터링).
- 애매한 경우 별도 API를 추가 호출하지 않고, 아래 "LLM 호출 최소화" 절의 통합 호출 결과(`isSymptomDetected`)를 그대로 판별 기준으로 사용한다.

## 반복 질문 캐싱
- 정규화된 질문 텍스트(공백/조사 등 정리 후 비교)를 기준으로 동일 질문의 응답을 캐싱한다.
- TTL을 두어 일정 시간 지나면 캐시를 만료시키고 새로 호출한다.

## LLM 호출 최소화 (중요)
한 번의 API 호출에서 아래 3가지를 함께 받도록 프롬프트/구조화 출력을 설계한다. 호출을 나누지 않는다.
```json
{
  "answerText": "string (사용자에게 보여줄 답변, 병명 언급 가능)",
  "isSymptomDetected": "boolean",
  "symptomSummary": "string | null (병명 금지, 대시보드 저장용)",
  "suspectedSymptom": "string | null (병명 가능, 요약 모달 전용, 출처 포함)"
}
```
이 JSON은 **내부 LLM 출력 스키마**이며, 이미 `scripts/prompt-test/prompts.py`로 검증 완료되어 변경하지 않는다. HTTP 응답(`/chat/query`)에서는 아래 매핑을 거쳐 반환한다 (`docs/SPEC.md` 6.6 참고).

## API
- `POST /api/v1/chat/query` — 아래 매핑된 응답 반환 (`docs/API_SPEC.md` §2.3과 정합화, 라우트 핸들러에서 순수 후처리 — LLM 재호출 없음)
  ```json
  {
    "reply": "string (= answerText 그대로)",
    "isSymptomDetected": true,
    "detectedSymptom": {
      "area": "string | null (symptomSummary에서 정규식/키워드로 부위 추출 — 발/귀/눈/피부 등, LLM 미호출)",
      "description": "string | null (= symptomSummary 그대로, 병명 없음)"
    },
    "suspectedSymptom": "string | null (= suspectedSymptom 그대로 — API_SPEC.md엔 없는 추가 필드, 요약모달용으로 유지)"
  }
  ```
  > ✅ 구현 완료 — `detectedSymptom`은 자동저장 방식으로 확정. `isSymptomDetected===true`면 `/chat/query` 응답 시점에 바로 `pet.healthNotes`에 병명 없이 push된다(확인 단계 없음). 이때 `suspectedSymptom`도 같은 healthNotes 서브도큐먼트에 함께 저장해(`HealthNote.suspectedSymptom` 필드 추가) `/chat/summary`가 재구성할 수 있게 한다.
- `POST /api/v1/chat/summary` — 세션리스(요청 바디 없음, `docs/API_SPEC.md` §2.3과 일치하도록 `sessionId` 경로 제거). "답변 요약" 모달용
  ```json
  {
    "summaryTitle": "string",
    "uploadedSymptoms": ["string, ... (세션 내 저장된 symptomSummary들)"],
    "suspectedSymptoms": ["string (각 suspectedSymptom + [출처: 카테고리]), ..."],
    "notice": "string (고정 면책 문구)"
  }
  ```
  > ✅ 구현 완료 — 서버는 별도 `sessionId`를 추적하지 않고, "현재 세션"을 **오늘 이 반려동물에 대해 감지된 증상 전체**로 정의한다. `pet.healthNotes`가 이미 날짜별로 쌓이므로 당일(`date == today`) 항목만 필터링해 `uploadedSymptoms`/`suspectedSymptoms`로 재구성 — 별도 저장소 없이 healthNotes를 재사용한다.

## UI 흐름
1. 사용자 질문 입력
2. 답변 표시
3. `isSymptomDetected === true`면 대시보드에 자동 반영 + "요약 완료" 로그 노출
4. "요약 완료" 클릭 → 답변 요약 모달 (증상 기록 / AI 의심증상 / 전체 답변 확인 유도)

## 주의사항
- 이 모드는 항상 켜져 있다. 등록 감지기가 동시에 반응해도 이 모드의 동작을 막지 않는다
- 개발 중에는 `MOCK_AI_RESPONSE` 플래그로 목업 응답 사용 (`server/CLAUDE.md` 참고)

## 구현 반영 — 서버측 안전장치 및 문맥 처리
- **병명 필터 (절대 규칙 1)**: `symptomSummary`는 저장 전 `app/services/symptom_guard.py`로 한 번 더 검사한다. 진단명 목록 + 접미사 규칙(~염/~병/~암/~증후군)에 걸리는 구절만 제거하고, 전부 걸리면 "OO 관련 이상 증상이 있었어요"로 대체한다. LLM 재호출 없음.
- **같은 날 같은 부위 기록 병합**: 부위를 특정한 기록은 같은 날 한 건으로 합친다 (`기타`는 합치지 않음).
- **부위 추출**: 목록 순서가 아니라 문장 내 첫 등장 위치 기준. "발진"→피부, "발작/발열/배변/입맛"은 부위로 보지 않는다.
- **등록 감지기**: "등록"이 없는 의문문(`?`, "언제/어떻게/뭐" 등)은 등록을 제안하지 않는다. 예방접종 키워드만 있으면 `single_date`.
- **후속 질문 문맥**: 요청에 `previousTurn{question, answer}`(선택)를 받아 질문 100자/답변 200자로 잘라 user 메시지 앞에 붙인다. 캐시 키에도 직전 질문을 포함한다.
- **하루 상담 횟수 제한**: `CHAT_DAILY_LIMIT_PER_USER`(기본 20, 0=무제한). 캐시 응답은 횟수에 포함하지 않는다.
