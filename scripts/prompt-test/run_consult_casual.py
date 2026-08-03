"""보강 테스트: 증상이 아닌 단순 사실 언급 메시지에 5단계 구조 없이 짧게 답하는지 확인.
등록 감지기 테스트에 쓰는 "약 먹었어요" 문구를 상담 프롬프트가 어떻게 다루는지 검증한다.
"""
from hai_client import call_hai_gpt, print_usage, print_session_total, pretty_json
from fixtures import build_consult_context_block
import prompts

USER_MESSAGE = "약 먹었어요"

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

    print_usage("run_consult_casual", usage)
    print_session_total()
