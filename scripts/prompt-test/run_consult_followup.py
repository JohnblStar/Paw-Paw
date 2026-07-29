"""보강 테스트: 품종가이드(디스크 위험) 반영 여부 확인용.
run_consult.py(더위 시나리오)만으로는 검증 기준의 "품종가이드 내용 반영 여부" 항목을
자연스럽게 exercise하기 어려워, 허리/이동성 관련 질문을 별도로 던진다.
"""
import re

from hai_client import call_hai_gpt, print_usage, print_session_total, pretty_json
from fixtures import build_consult_context_block
import prompts

USER_MESSAGE = "요즘 계단을 잘 안 올라가려고 해요"

if __name__ == "__main__":
    context = build_consult_context_block()
    system_prompt = prompts.CONSULT_SYSTEM_PROMPT + "\n\n" + context

    print("=== 질문 ===")
    print(USER_MESSAGE)
    print()

    content, usage = call_hai_gpt(system_prompt, USER_MESSAGE, json_mode=True)

    print("=== 응답 (JSON) ===")
    print(pretty_json(content))
    print()

    urls = re.findall(r"https?://\S+", content)
    if urls:
        print(f"⚠ 링크 발견 — 실존 여부 수동 확인 필요: {urls}")
    else:
        print("링크 없음 (fabrication 위험 낮음)")
    print()

    if "디스크" in content or "허리" in content:
        print("✓ 품종가이드(디스크/허리 위험) 관련 언급 발견")
    else:
        print("✗ 품종가이드(디스크/허리 위험) 관련 언급 없음 — 프롬프트 조정 검토 필요")
    print()

    print_usage("run_consult_followup", usage)
    print_session_total()
