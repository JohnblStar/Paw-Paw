"""테스트케이스 1: 더위 먹음 시나리오.
기대 방향: 더위 먹음 진단가설 -> 체온 39.5도 기준 -> 찬물 직접 사용 금지 경고 -> 미지근한 물 단계적 냉각 -> 그늘/냉매트 휴식.
"""
import re

from hai_client import call_hai_gpt, print_usage, print_session_total, pretty_json
from fixtures import build_consult_context_block
import prompts

USER_MESSAGE = "짧게만 산책했는데 이후로 물만 마시고 헐떡이고 조금씩 휘청거려요"

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

    print_usage("run_consult", usage)
    print_session_total()
