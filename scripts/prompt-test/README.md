# HAI-GPT 시스템 프롬프트 검증 스크립트

본 구현(FE/BE) 전에 챗봇 상담모드 / 건강 레포트 소견용 시스템 프롬프트를 실제 HAI-GPT로 단독 검증하기 위한 스크립트. 서버 기동, DB 연결 없이 HAI-GPT API만 직접 호출한다. `server/venv`/`server/requirements.txt`와 완전히 격리되어 있다.

## 셋업

```bash
cd scripts/prompt-test
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

자격증명은 `server/.env`를 그대로 읽는다 (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`). 별도 `.env`를 만들지 않는다.

## 실행

```bash
python run_consult.py            # 테스트케이스 1: 더위 먹음 시나리오
python run_consult_followup.py   # 보강: 품종가이드(디스크 위험) 반영 확인
python run_consult_casual.py     # 보강: 증상 아닌 단순 사실 언급("약 먹었어요") 시 짧게 답하는지 확인
python run_report.py             # 테스트케이스 2: 건강 레포트 소견
```

## 검증 기준 체크리스트 (사람이 눈으로 대조)

- [ ] 걱정할 만한 증상이 있을 때 답변이 원인가설/확인기준/잘못된대처경고/행동지침 요소를 (번호 매긴 5단계가 아니라) 자연스러운 문단 1~2개, 400자 이내로 담는가
- [ ] 증상이 아닌 단순 사실 언급/인사에는 150자 이내 1~2문장으로 짧게 답하는가 (`run_consult_casual.py`)
- [ ] 번호 목록("1)", "-" 등)이나 헤더(#, ##)를 쓰지 않는가 — 굵게(**)는 핵심 단어에 최소한만
- [ ] 실존하지 않는 링크나 출처를 지어내지 않는가 (fabrication 없음)
- [ ] 반려동물의 나이/체중/복용약 등 등록 데이터를 답변에 반영하는가
- [ ] 품종가이드 내용(디스크 위험 등)이 관련 질문에서 실제로 반영되는가
- [ ] 건강 레포트가 시기별 타임라인을 정확히 인식하고 종합 판단을 내리는가

실패 항목이 있으면 `prompts.py`의 해당 상수만 수정하고 재실행한다. 다른 파일은 건드릴 필요 없음.

각 스크립트는 실행마다 호출별/세션 누적 토큰 사용량을 출력한다. 개발기 5,000토큰 예산 대비 소모량을 계속 확인할 것.

## 완료 후

검증 통과한 최종 프롬프트는 `docs/SPEC.md`의 "확정된 시스템 프롬프트" 섹션에 옮겨 적는다. 이 디렉토리는 이후 프롬프트 재검증(모델 교체, base_url 변경 등)에 재사용할 수 있어 기본적으로 보관 — 삭제 여부는 필요시 논의.
