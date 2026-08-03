# 미디어 에셋 연동 가이드 (마스코트 Lottie · 아이콘)

> 배포 준비(#58) 이후 진행 예정인 두 작업의 착수 가이드. 코드/디자인 조사 결과를 정리한 것이며,
> 실제 에셋(Lottie JSON, 아이콘 파일)은 아직 없는 상태에서 작성됨.

## 1. 마스코트 Lottie 애니메이션

### 현재 상태
- `client/src/components/mainpage/MascotPlaceholder.jsx`가 `[마스코트 애니메이션 자리]` 텍스트만 보여주는 자리표시자. `MainPage.jsx`에서 좌측 위젯/우측 말풍선 사이 중앙에 렌더링됨.
- 라이브러리는 **이미 설치되어 있음**: `package.json`에 `react-lottie-player`가 있는데 코드베이스 어디서도 import되지 않는 상태 (미사용 의존성). 새로 설치할 필요 없이 바로 쓰면 됨.
- Lottie JSON 파일은 프로젝트 어디에도 없음 — 에셋을 새로 구해야 함(디자이너 산출물 또는 LottieFiles 등에서 소싱).

### DESIGN.md 규칙 (반드시 지킬 것 — `docs/DESIGN.md` 54~67줄)
1. **Lottie는 마스코트 한 곳에만.** 다른 버튼/카드에 쓰지 않는다.
2. **상태별 애니메이션 3~4개로 제한**: 평온 / 걱정 / 배고픔 / 기쁨 정도.
3. **장식이 아니라 실제 데이터 상태와 연결**되어야 한다 — 말풍선 우선순위 로직과 같은 신호를 재사용하면 자연스럽게 연결됨 (아래 참고).
4. **지연 로드**: 마스코트가 실제로 보이는 화면(메인페이지, 필요하다면 대시보드)에서만 라이브러리와 JSON을 불러오고, 리포트/마이펫이지 등 다른 페이지에서는 로드하지 않는다.
5. 클레이/펠트 질감 톤 유지 (`docs/DESIGN.md` 브랜드 컨셉 참고).

### 상태 매핑 제안 (기존 로직 재사용)
`client/src/utils/bubbleMessage.js`의 `getBubbleMessage()`가 이미 우선순위 기반으로 `type`을 반환한다 (`medication` / `dday` / `health` / `flavor`). 마스코트 표정을 별도로 새로 설계하지 말고 **이 `type`을 그대로 mood 키로 매핑**하면 말풍선과 표정이 항상 같은 상태를 가리키게 되어 "장식이 아닌 데이터 연동" 요건을 자연스럽게 만족한다.

```js
// 예시 매핑 (실제 JSON 파일명은 소싱한 에셋에 맞춰 조정)
const MOOD_TO_LOTTIE = {
  medication: 'worried',   // 오늘 약 미복용
  dday: 'alert',           // D-3 이내 일정
  health: 'worried',       // 오늘 특이사항 기록됨
  flavor: 'calm',          // 평상시
}
```

`MainPage.jsx`에서 이미 계산한 `bubbleMessage.type`을 `MascotPlaceholder`(→ `Mascot`으로 리네임 권장)에 그대로 prop으로 내려주면 됨.

### 지연 로드 구현 방향
```jsx
// client/src/components/mainpage/Mascot.jsx
import { lazy, Suspense } from 'react'

const LottiePlayer = lazy(() => import('react-lottie-player'))
const LOTTIE_SOURCES = {
  calm: () => import('@/assets/lottie/mascot-calm.json'),
  worried: () => import('@/assets/lottie/mascot-worried.json'),
  alert: () => import('@/assets/lottie/mascot-alert.json'),
  // ...
}
```
- JSON은 `client/src/assets/lottie/`에 두고 동적 import로 필요한 것만 불러오기 (Vite가 자동으로 code-split 처리).
- `Suspense` fallback으로 기존 `MascotPlaceholder`의 정적 UI를 그대로 재사용하면 로딩 중 레이아웃 시프트도 방지됨.

### 체크리스트 (`docs/DESIGN.md` 69~73줄 그대로)
- [ ] 이 화면에 Lottie가 꼭 필요한가, CSS로 대체 가능하지 않은가
- [ ] 마스코트 표정/말풍선이 실제 데이터 상태와 연결되어 있는가 (장식이 아닌지)
- [ ] 라이브러리와 JSON이 마스코트가 보이는 페이지에서만 로드되는가
- [ ] 모바일 너비에서 레이아웃이 깨지지 않는가

## 2. 아이콘

### 파비콘 — 이미 있음, 확인만 하면 됨
`client/public/favicon.svg`에 브랜드 퍼플(`#863bff`, DESIGN.md의 `primary-purple` 계열)로 그려진 아이콘이 이미 존재하고 `index.html`에 연결되어 있다. 새로 작업할 필요 없이, 실제 브라우저 탭에서 의도한 모양대로 보이는지만 확인하면 될 것으로 보임.

### `client/public/icons.svg` — 앱과 무관한 템플릿 잔재
이 파일의 심볼은 `bluesky-icon`/`discord-icon`/`github-icon`/`x-icon`/`documentation-icon`/`social-icon`으로, Paw:Paw 앱 어디에서도 참조되지 않는다 (grep 결과 0건). Vite 스캐폴딩 시 기본으로 딸려온 것으로 보임. 새 아이콘 작업을 시작하기 전에 **이 파일은 지우고 시작하는 걸 추천** — 헷갈릴 여지만 있고 실제로 쓰이는 게 없음.

### 새 아이콘을 추가할 때 — 기존 패턴
이 코드베이스는 별도 아이콘 라이브러리(lucide-react 등)를 쓰지 않고, **컴포넌트 안에 인라인 `<svg>`**를 직접 넣는 패턴을 쓰고 있다. 참고 예시: `client/src/components/layout/NotificationBell.jsx`의 벨 아이콘.
```jsx
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="..." strokeLinecap="round" strokeLinejoin="round" />
</svg>
```
- `stroke="currentColor"`로 텍스트 색(Tailwind `text-*` 클래스)을 그대로 상속받게 하는 게 이 코드베이스의 관례 — 아이콘 색을 hex로 하드코딩하지 말 것 (`client/CLAUDE.md`의 색상 하드코딩 금지 규칙과 동일 이유).
- 아이콘이 많아져서 인라인이 부담되면, 그때 가서 `client/src/components/common/icons/` 같은 공용 아이콘 컴포넌트 폴더로 옮기는 걸 고려. 지금은 2곳뿐이라 별도 시스템 도입은 과함.
- 아이콘 색상도 DESIGN.md 토큰(`ink`, `ink-secondary`, `primary-mint-dark` 등)만 사용.
