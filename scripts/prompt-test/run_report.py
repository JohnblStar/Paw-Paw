"""테스트케이스 2: 건강 레포트 소견 생성.
기대: 시기별 타임라인 정리 -> 종합소견(체중 상승 경고, 산책 제한, 사료량 조절 등) -> 케어가이드.
"""
import re

from hai_client import call_hai_gpt, print_usage, print_session_total
from fixtures import build_report_context_block
import prompts

if __name__ == "__main__":
    context = build_report_context_block()

    print("=== 입력 컨텍스트 ===")
    print(context)
    print()

    content, usage = call_hai_gpt(prompts.REPORT_SYSTEM_PROMPT, context, json_mode=False, max_tokens=1800)

    print("=== 응답 ===")
    print(content)
    print()

    headers = ["## 종합소견", "## 앞으로의 케어가이드", "## 면책 문구"]
    indices = [content.find(h) for h in headers]
    if all(i != -1 for i in indices) and indices == sorted(indices):
        print("✓ 헤더 순서 PASS:", headers)
    else:
        print("✗ 헤더 순서 FAIL — 발견된 인덱스:", dict(zip(headers, indices)))
    print()

    urls = re.findall(r"https?://\S+", content)
    if urls:
        print(f"⚠ 링크 발견 — 실존 여부 수동 확인 필요: {urls}")
    else:
        print("링크 없음 (fabrication 위험 낮음)")
    print()

    print_usage("run_report", usage)
    print_session_total()
