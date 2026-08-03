# 🐾 Paw:Paw 프로젝트 - API 및 데이터 규격 가이드라인

본 문서는 프론트엔드(FE)와 백엔드(BE)의 원활한 협업을 위해 정의된 공통 데이터 규격 및 API 명세입니다. 모든 데이터 교환은 JSON 형식을 원칙으로 합니다.

> 📌 이 문서는 백엔드 개발자가 작성한 원본 명세서를 프로젝트 내 참조용으로 정리한 버전입니다. 원본 수정 시 이 파일도 함께 갱신해야 합니다.

---

## 1. 공통 데이터 모델 (Data Schemas)

### 1.1 반려인 (User)

```json
{
  "userId": 101,
  "userName": "정재훈",
  "userAge": 26,
  "profileImageUrl": "https://cdn.pawpaw.com/profiles/user_101.png"
}
```

### 1.2 반려동물 (Pet)

```json
{
  "petId": 12,
  "name": "뽀삐",
  "age": 3,
  "type": "DOG",
  "breed": "푸들",
  "profileImageUrl": "https://cdn.pawpaw.com/profiles/poodle.png",
  "isCalled": true,
  "diseases": ["췌장염", "안구 건조증"],
  "guideDocumentUrl": "https://cdn.pawpaw.com/guides/poodle_3.pdf"
}
```

| 필드 | 설명 |
|---|---|
| `type` | `DOG`, `CAT` 중 하나 |
| `isCalled` | 현재 대시보드에 활성화된 펫 여부 |
| `diseases` | 직접 입력 및 관리 중인 질병 목록 |
| `guideDocumentUrl` | 내 반려동물 가이드 다운로드 경로 |

### 1.3 복용 약 (Medication)

```json
{
  "medicationId": 201,
  "petId": 12,
  "medicationName": "(뽀삐)십이지장 궤양약",
  "targetTime": "14:30",
  "isCompleted": true
}
```

| 필드 | 설명 |
|---|---|
| `targetTime` | 카톡 복약 알림 시간 (HH:mm) |
| `isCompleted` | 오늘 복용 여부 |

---

## 2. 기능별 API 명세 (API Specifications)

### 2.1 대시보드 (Dashboard API)

#### `GET /api/v1/dashboard`

현재 활성화된 반려동물(`isCalled: true`)의 대시보드 정보를 조회합니다. (간소화/기본 모드 공통 사용)

**Response**

```json
{
  "petInfo": {
    "petId": 12,
    "name": "뽀삐",
    "age": 3,
    "breed": "푸들",
    "characterImageUrl": "https://cdn.pawpaw.com/characters/poodle_normal.png",
    "characterComment": "오늘 하루도 아프지 않고 건강하게 보낼게! (조건부 자동 대사)"
  },
  "todayMedication": {
    "completedCount": 2,
    "totalCount": 3,
    "isAllCompleted": false
  },
  "dDayList": [
    { "title": "예방 접종", "daysLeft": 5 },
    { "title": "다음 검진", "daysLeft": 152 }
  ],
  "currentWeight": 5.2,
  "healthStatus": {
    "affectedAreas": ["발", "귀"],
    "symptoms": [
      "발바닥 만질시 아파함",
      "절뚝거림",
      "왼쪽 귀 피부에 작게 두드러기가 남"
    ]
  }
}
```

#### `POST /api/v1/dashboard/weight`

새로운 체중을 기록합니다.

**Request**

```json
{
  "weight": 5.2
}
```

---

### 2.2 약 관리 및 캘린더 (Medication & Calendar API)

#### `GET /api/v1/medications`

현재 활성화된 펫의 오늘 복용 약 목록을 모달창에 노출하기 위해 조회합니다.

**Response**

```json
[
  { "medicationId": 201, "medicationName": "(뽀삐)십이지장 궤양약", "targetTime": "09:00", "isCompleted": true },
  { "medicationId": 202, "medicationName": "(뽀삐)십이지장 궤양약", "targetTime": "13:00", "isCompleted": true },
  { "medicationId": 203, "medicationName": "(뽀삐)십이지장 궤양약", "targetTime": "19:00", "isCompleted": false }
]
```

#### `PATCH /api/v1/medications/{medicationId}/check`

약 복용 상태를 토글합니다 (완료/미완료 처리).

**Request**

```json
{
  "isCompleted": true
}
```

#### `GET /api/v1/calendar/monthly?year=2026&month=07`

월간 약 복용 캘린더용 데이터를 조회합니다.

**Response**

```json
{
  "year": 2026,
  "month": 7,
  "records": {
    "2026-07-08": { "completed": 3, "total": 3 },
    "2026-07-09": { "completed": 3, "total": 3 },
    "2026-07-14": { "completed": 2, "total": 3 },
    "2026-07-15": { "completed": 2, "total": 3 }
  }
}
```

---

### 2.3 AI 챗봇 (Chatbot API)

#### `POST /api/v1/chat/query`

유저가 챗봇에 메시지를 보낼 때 호출합니다. 백엔드는 이 요청을 받으면 현재 펫의 데이터(체중 변화, 복약 정보, 증상 등)를 AI Context에 함께 주입하여 진단 소견을 생성합니다.

**Request**

```json
{
  "message": "우리 뽀삐가 발바닥을 만지면 아파하고 절뚝거려요."
}
```

**Response**

```json
{
  "reply": "다리 절뚝임이 있다면 관절염이나 통풍이 의심될 지도 모릅니다. [출처: 수의학 가이드북]",
  "isSymptomDetected": true,
  "detectedSymptom": {
    "area": "발",
    "description": "절뚝거림, 발바닥 만질 시 아파함"
  }
}
```

> ⚠️ **확인 필요**: 감지된 `detectedSymptom`이 실제로 `dashboard.healthStatus.symptoms`에 저장되는 시점/엔드포인트가 명세에 없음. `/chat/summary` 확인 후 자동 저장되는지, 별도 확정(confirm) API가 필요한지 백엔드와 협의 필요.

#### `POST /api/v1/chat/summary`

챗봇 답변이 완료된 후 '요약완료 로그' 버튼 클릭 시 의심증상 및 주의사항을 요약해 문서를 반환합니다.

**Response**

```json
{
  "summaryTitle": "뽀삐 답변 요약 문서",
  "uploadedSymptoms": ["다리절뚝임 (시작: 3일전)"],
  "suspectedSymptoms": [
    "관절염 - 무거워진 몸 때문에 다리에 부담이 생긴 걸지도 모릅니다. [출처]",
    "통풍 - 발바닥 통증과 연관이 있을 수 있습니다. [출처]"
  ],
  "notice": "본 요약에 대한 자세한 근거는 답변 전체를 확인해 주세요."
}
```

> ⚠️ **확인 필요**: `[출처]` 표기를 실제 구체적 자료명으로 생성할지, 고정된 카테고리 라벨(예: "일반 수의학 상식", "품종별 유전질환 정보", "등록된 데이터 기반 추정")로 제한할지 미정. AI가 실재하지 않는 자료명을 지어내는 리스크 방지 차원에서 논의 필요.

---

### 2.4 건강 리포트 (Health Report API)

#### `GET /api/v1/reports/monthly?year=2026&month=07`

건강 리포트 페이지의 종합 진단 데이터를 가져옵니다.

**Response**

```json
{
  "petProfile": {
    "name": "뽀삐",
    "age": 3,
    "breed": "푸들"
  },
  "weightChange": {
    "thisMonthStart": 4.2,
    "current": 5.2,
    "oneMonthAgo": 4.2,
    "analysisMessage": "몸무게가 한달 전보다 1kg, 2일 전보다 0.3kg 증가했고, 평균 푸들보다 0.9kg 높아요."
  },
  "monthlySymptomFrequency": [
    { "date": "2026-07-04", "issue": "구토증상 발견" },
    { "date": "2026-07-15", "issue": "발을 절뚝거림" }
  ],
  "diagnosisOpinions": [
    { "id": 1, "text": "사료량을 조금 줄이는 게 좋을 듯해요. 건식사료를 시도해 보세요. [출처]" },
    { "id": 2, "text": "하루 산책량을 줄여보시는 걸 권장해 드립니다. 다리가 악화될 수 있습니다. [출처]" },
    { "id": 3, "text": "발바닥을 자세히 관찰하시고, 특정 부분을 누를 때만 아파하는지 확인해 주세요. [출처]" }
  ],
  "hospitalQuestions": [
    "살이 빠지는 것과 무관하게 해당 증상이 지속된다면 관절염 또는 통풍이 의심됩니다."
  ]
}
```

> ⚠️ **확인 필요 (2건)**
> 1. `hospitalQuestions`: 필드명은 "병원에서 물어볼 질문"을 의미하는 것 같으나, 예시 값은 질문형이 아니라 진술문임. 명세 오류인지 의도된 것인지 확인 필요.
> 2. 이 엔드포인트는 월간(`monthly`) 고정. 주간 옵션 추가 여부는 팀 협의 후 결정 예정 (미확정).

---

### 3.1 로그인 및 회원가입 (Auth API)

카카오 로그인을 마친 뒤, 기획서의 반려인/반려동물 가입 정보와 알림 동의를 처리하는 엔드포인트.

#### `POST /api/v1/auth/signup`

회원가입 및 첫 번째 반려동물 동시 등록.

**Request**

```json
{
  "user": {
    "kakaoToken": "KAKAOTOKEN_12345",
    "userName": "정재훈",
    "userAge": 25,
    "userProfileImage": "https://k.kakaocdn.net/...png",
    "kakaoChannelAgreement": true
  },
  "pet": {
    "name": "뽀삐",
    "birthDate": "2023-03-15",
    "type": "DOG",
    "breed": null,
    "profileImage": null
  }
}
```

| 필드 | 설명 |
|---|---|
| `user.userName` | 카카오에서 연동받은 값 |
| `user.userAge` | 수동 입력 |
| `user.userProfileImage` | 필수 아님 |
| `user.kakaoChannelAgreement` | 알림 채널 추가 동의 여부 |
| `pet.birthDate` | 나이는 생일 기준으로 관리 (마이펫이지 자동 나이 계산용) |
| `pet.breed` | 회원가입 시점엔 미지정 (이후 AI로 세부 설정 가능) |

---

### 3.2 마이펫이지 (My Pet Easy API)

반려동물 '부르기(전환)' 인터랙션 및 리스트 나열을 처리하는 필수 API.

#### `GET /api/v1/users/pets`

내 반려동물 목록 전체 조회 (프로필 나열 및 헤더 우측 반려동물 리스트 노출용).

**Response**

```json
[
  {
    "petId": 12,
    "name": "뽀삐",
    "type": "DOG",
    "breed": "푸들",
    "age": 3,
    "profileImageUrl": "https://cdn.pawpaw.com/poodle.png",
    "isCalled": true
  },
  {
    "petId": 13,
    "name": "돌리",
    "type": "CAT",
    "breed": "러시안블루",
    "age": 14,
    "profileImageUrl": "https://cdn.pawpaw.com/russian_blue.png",
    "isCalled": false
  }
]
```

#### `PATCH /api/v1/users/pets/{petId}/call`

활성화할 반려동물 변경 ('부르기' 버튼 클릭 시 호출).

**Response**

```json
{
  "success": true,
  "calledPetId": 13,
  "message": "현재 대시보드가 '돌리'의 정보로 전환되었습니다."
}
```

---

### 3.3 반려동물 정보 설정 및 추가 (Pet Management API)

"반려동물 정보 설정/추가" 페이지와 관련된 상세 제어 API.

#### `POST /api/v1/pets`

새로운 반려동물 추가하기 (정보 기입되지 않은 상태로 생성 시).

**Response**

```json
{
  "petId": 14,
  "name": "새 반려동물",
  "birthDate": null,
  "type": "DOG",
  "isCalled": false
}
```

#### `PUT /api/v1/pets/{petId}`

반려동물 세부 정보 수정 및 대시보드 설정 저장 (D-Day 정보 등 통합 업데이트).

**Request**

```json
{
  "name": "뽀삐",
  "birthDate": "2023-03-15",
  "profileImageUrl": "https://cdn.pawpaw.com/poodle.png",
  "diseases": ["췌장염"],
  "dDays": [
    { "title": "예방 접종", "targetDate": "2026-07-21" },
    { "title": "다음 검진", "targetDate": "2026-12-15" }
  ]
}
```

#### `POST /api/v1/pets/{petId}/ai-breed`

"AI와 함께 세부적인 종 정보 입력하기" 호출. 챗봇을 통해 정확한 품종 피드백을 받고 해당 피드백 가이드를 대시보드에 자동으로 저장.

**Request**

```json
{
  "rawBreedInput": "미디엄 푸들"
}
```

**Response**

```json
{
  "breed": "푸들 (미디엄)",
  "feedback": {
    "trainingTip": "똑똑해서 반복 훈련보다는 놀이식 훈련이 좋습니다.",
    "chronicDiseases": "슬개골 탈구 및 백내장을 유의해야 합니다.",
    "specialCare": null
  }
}
```

| 필드 | 설명 |
|---|---|
| `specialCare` | 1년 미만 혹은 10년 이상일 때만 맞춤 정보 추가 제공, 그 외엔 `null` |

> 💡 **구현 참고**: 동일한 정규화 결과(`breed`)에 대해서는 캐싱해서 재사용하면 토큰 절약 가능 (예: "미디엄 푸들", "푸들(미디엄)", "medium poodle" 등 입력이 달라도 정규화 후 같은 `breed` 값이면 캐시 히트).

---

### 3.4 카카오톡 알림 및 상태 연동 (Webhook & Event API)

사용자가 카카오톡 알림 채널에서 직접 복용을 체크했을 때, 웹 서버 DB에 상태를 기록하기 위한 웹훅(Webhook) API.

#### `POST /api/v1/callback/kakao-medication`

카카오톡 챗봇 메뉴 또는 템플릿 버튼을 통해 사용자가 "복용 완료"를 누르면 카카오 서버가 백엔드로 보내주는 웹훅 요청 규격.

**Request**

```json
{
  "userId": 101,
  "medicationId": 201,
  "checkedAt": "2026-07-16T10:30:00Z"
}
```

**Response**

```json
{
  "status": "success",
  "message": "대시보드에 복용 체크가 정상 반영되었습니다."
}
```

---

## 미확정/논의 필요 항목 요약

| 항목 | 내용 | 상태 |
|---|---|---|
| 건강 레포트 주기 | 월간 외 주간 옵션 추가 여부 | 학래님과 협의 필요 |
| 챗봇 등록모드 | 별도 슬롯필링 UI 필요 여부 (현재는 자동감지+요약 흐름만 존재) | 브레인스토밍 필요 |
| `[출처]` 표기 방식 | 구체적 자료명 생성 vs 고정 카테고리 라벨 제한 | 브레인스토밍 필요 |
| `hospitalQuestions` | 필드명과 예시 값(진술문)의 불일치 | 명세 오류 여부 확인 필요 |
| 증상 저장 흐름 | `detectedSymptom` → `dashboard.healthStatus.symptoms` 저장 시점/엔드포인트 부재 | 확인 필요 |
