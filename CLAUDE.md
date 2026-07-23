# Paw:Paw — 프로젝트 공통 규칙

> 이 파일은 모든 세션에서 항상 로드됩니다. 자주 바뀌지 않는 규칙만 담고,
> 기능별 상세 스펙은 `docs/features/*.md`를 필요할 때 직접 참조해서 작업하세요.

## 프로젝트 한 줄 요약
반려동물의 건강 데이터(체중, 복약, 예방접종, AI 챗봇 상담 기록)를 관리하는 웹 서비스.
포트폴리오/시연용 프로젝트이며, 실사용 트래픽을 목표로 하지 않음 (토큰·비용 최적화가 항상 우선).

## 기술 스택
- Frontend: React (Vite) + Tailwind CSS v4
- Backend: FastAPI (Python)
- DB: MongoDB Atlas (motor 비동기 드라이버)
- 인증: Kakao 소셜 로그인 → 서버가 JWT 세션 발급
- AI: 학교 제공 HAI-GPT(ChatGPT 계열 API), 월 토큰 할당량 제한적 (개발기 5,000 / 개강 후 20,000) → 토큰 절약이 설계 원칙
- 배포: Vercel(Frontend) / Railway(Backend)

## 실행 명령어
```
# Frontend
cd client && npm install && npm run dev

# Backend
cd server && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && uvicorn main:app --reload
```

## 절대 규칙 (모든 기능에 공통 적용)
1. **병명 확진 금지**: AI 챗봇이 사용자에게 주는 답변 자체에는 "~일지도 모릅니다" 식으로 병명을 언급해도 되지만, 대시보드 '뽀삐의 건강'에 자동 저장되는 내용에는 절대 병명을 쓰지 않는다. "이런 증상이 있었다" 수준까지만.
2. **체중 그래프 보간**: 특정 날짜에 입력이 없으면 직전 입력값을 그대로 이어서 그래프 선이 끊기지 않게 한다.
3. **카카오 알림톡 발송 대상은 복약·예방접종 두 가지뿐**이다. 다른 기능에서 임의로 알림 항목을 늘리지 않는다.
4. **AI 호출은 최소화한다**. 키워드/버튼으로 처리 가능한 로직(복약·예방접종 등록 트리거 감지, 슬롯필링)은 LLM을 호출하지 않는다. LLM은 자유 상담 답변 생성에만 사용한다.
5. **커뮤니티 기능 없음. 회원가입 모달 없음.** 반려인 정보는 카카오 로그인으로만 받고, 반려동물 기본정보(이름/나이/종)는 사용자가 직접 입력, 세부정보(복약/접종)는 챗봇 슬롯필링으로 입력한다.
6. 실사용자 화면에 디버그용 UI(예: 개발자 로그 버튼)를 노출하지 않는다.

## 디렉토리 구조
```
paw-paw/
├── client/                  # React 프론트엔드 (client/CLAUDE.md 참고)
├── server/                  # FastAPI 백엔드 (server/CLAUDE.md 참고)
├── docs/
│   ├── SPEC.md               # 통합 기획 스펙 (최종본)
│   ├── DESIGN.md             # 디자인 토큰 및 UI 방향 (프론트 작업 시 참고)
│   ├── WORKFLOW.md           # Claude Code 실전 프롬프트 템플릿
│   └── features/             # 기능별 상세 스펙 — 작업 시작 전 해당 기능 파일을 반드시 참고
└── reference/figma-make/     # 디자이너의 Figma Make 산출물 원본 (참고 전용, 그대로 포팅 금지)
    ├── dashboard/
    ├── chatbot/
    └── mypetsy/
```

## 레퍼런스 폴더 주의사항
`reference/figma-make/` 하위 각 폴더에는 Figma Make가 **자체적으로 생성한** `CLAUDE.md`/`AGENTS.md`가 들어있다. 이건 이 루트 CLAUDE.md와 무관한, Figma Make 프로젝트 자신을 위한 파일이므로 **절대 루트나 client/server의 CLAUDE.md를 덮어쓰지 않는다.** 레퍼런스 코드는 디자인/인터랙션 참고용으로만 열어보고, 실제 구현은 `client/CLAUDE.md` 컨벤션대로 새로 작성한다 (색상 인라인 하드코딩 금지 등).

## 작업 시작 전 체크리스트
- [ ] 이 CLAUDE.md와 `client/CLAUDE.md` 또는 `server/CLAUDE.md`를 먼저 확인했는가
- [ ] 작업할 기능의 `docs/features/*.md`를 읽었는가
- [ ] 위 절대 규칙 6개에 위배되는 설계는 없는가

## Git 작업 흐름 (Claude Code 자동 진행)
이 프로젝트는 `GIT-FLOW.md`의 브랜치·이슈·커밋·PR 규칙을 따른다. 코드 작업이 끝나면 매번 요청받지 않아도 아래를 순서대로 자동 진행한다.

1. 작업이 마무리되면 GIT-FLOW.md 이슈 템플릿(제목 `<타입>:<변경사항>`, 본문 작업개요/세부작업/참고사항)에 맞춰 **이슈 초안을 먼저 제시**한다.
2. 사용자가 이슈 번호를 알려주면, 추가 요청 없이 바로:
   - `dev`에서 최신 pull
   - `<타입>/HB-#이슈번호-간단설명` 브랜치 생성 (담당자 이니셜 기본값 HB, 다른 담당자면 사용자가 알려줌)
   - 커밋 메시지 규칙(`<타입>: #이슈번호 - 설명`)에 맞춰 커밋
   - `git push -u origin <브랜치>`까지 진행
3. push 후 GIT-FLOW.md PR 템플릿에 맞춘 PR 제목/본문 초안을 바로 이어서 제시한다.
4. **다음은 사용자가 직접 해야 하는 영역이라 자동으로 하지 않는다**: GitHub 이슈/PR 생성 자체(도구 미보유), 코드 리뷰·승인, PR 머지(Squash and merge), `dev`/`main`에 직접 push.
