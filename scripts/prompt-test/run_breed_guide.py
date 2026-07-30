"""테스트케이스 3: 품종 가이드 생성.
정규화(오타/영문 표기) + 3필드(trainingTip/chronicDiseases/specialCare) 분량 확인.
"""
from hai_client import call_hai_gpt, print_usage, print_session_total, pretty_json
import prompts

TEST_INPUTS = ["미디엄 푸들", "welsh corgi", "믹스"]

if __name__ == "__main__":
    for raw_input in TEST_INPUTS:
        print(f"=== 입력: {raw_input} ===")
        content, usage = call_hai_gpt(prompts.BREED_GUIDE_SYSTEM_PROMPT, raw_input, json_mode=True, max_tokens=400)
        print(pretty_json(content))
        print_usage("run_breed_guide", usage)
        print()

    print_session_total()
