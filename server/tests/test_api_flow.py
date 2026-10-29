"""인메모리 MongoDB(mongomock-motor)로 실제 라우트를 끝까지 호출하는 통합 테스트.
실제 Atlas/HAI-GPT에는 접속하지 않는다 — LLM 호출부(_complete)만 가짜 응답으로 바꿔 끼운다."""

from datetime import datetime, timedelta, timezone

import httpx
import pytest
from bson import ObjectId
from mongomock_motor import AsyncMongoMockClient

import app.core.database as database
from app.core.config import settings
from app.core.pet_helpers import today_kst
from app.core.security import create_access_token
from app.services import hai_gpt
from main import app


@pytest.fixture
async def env(monkeypatch):
    database.client = AsyncMongoMockClient()
    db = database.get_database()
    user_id = ObjectId()
    await db.users.insert_one({"_id": user_id, "kakaoId": 1, "nickname": "테스터"})
    headers = {"Authorization": f"Bearer {create_access_token(str(user_id))}"}

    llm_calls = []

    async def fake_request(system_prompt, user_message, max_tokens, *, json_mode):
        llm_calls.append(user_message)
        return _fake_content(system_prompt, json_mode), 40

    def _fake_content(system_prompt, json_mode):
        if json_mode and "품종" in system_prompt[:60]:
            return ('{"breed": "말티즈", "trainingTip": "t", "chronicDiseases": "c", '
                    '"specialCare": null, "standardWeightKg": {"min": 2, "max": 4}}')
        if json_mode:
            return ('{"answerText": "답변", "isSymptomDetected": true, '
                    '"symptomSummary": "귀를 자주 긁음, 외이염 의심", "suspectedSymptom": "외이염일지도"}')
        return "## 종합소견\n2. 종합 판단: 양호\n\n## 앞으로의 케어가이드\n- 산책\n\n## 면책 문구\nAI가 분석한 정보는 정확하지 않을 수 있습니다."

    monkeypatch.setattr(hai_gpt, "_request", fake_request)
    monkeypatch.setattr(settings, "AI_MODE", "live")
    monkeypatch.setattr(settings, "AI_MONTHLY_TOKEN_LIMIT", 0)
    monkeypatch.setattr(settings, "CHAT_DAILY_LIMIT_PER_USER", 20)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=headers) as client:
        pet = (await client.post("/api/v1/pets", json={
            "name": "뽀삐", "species": "dog", "breed": "말티즈", "birthDate": "2020-01-01",
            "sex": "female", "neutered": True, "weight": 3.0, "photoKey": "dog1",
        })).json()
        yield {"client": client, "db": db, "pet": pet, "llm_calls": llm_calls, "user_id": user_id}


async def test_chat_saves_symptom_without_disease_name_and_merges_same_day(env):
    client = env["client"]
    first = (await client.post("/api/v1/chat/query", json={"message": "귀를 긁어요"})).json()
    assert first["detectedSymptom"]["description"] == "귀를 자주 긁음"
    notes = first["pet"]["healthNotes"]
    assert len(notes) == 1 and "외이염" not in notes[0]["note"]

    # 같은 날 같은 부위의 다른 질문 → 기록이 늘지 않고 합쳐진다
    second = (await client.post("/api/v1/chat/query", json={
        "message": "귀에서 냄새도 나요",
        "previousTurn": {"question": "귀를 긁어요", "answer": "답변"},
    })).json()
    assert len(second["pet"]["healthNotes"]) == 1
    assert "[직전 대화]" in env["llm_calls"][-1]
    usage = await env["db"].aiUsage.find_one({"_id": hai_gpt._usage_month_key()})
    assert usage["totalTokens"] == 80 and usage["calls"] == 2


async def test_chat_cache_does_not_call_llm_twice(env):
    client = env["client"]
    await client.post("/api/v1/chat/query", json={"message": "안녕"})
    await client.post("/api/v1/chat/query", json={"message": "안녕 "})
    assert len(env["llm_calls"]) == 1


async def test_chat_daily_limit(env, monkeypatch):
    monkeypatch.setattr(settings, "CHAT_DAILY_LIMIT_PER_USER", 1)
    client = env["client"]
    await client.post("/api/v1/chat/query", json={"message": "질문1"})
    limited = (await client.post("/api/v1/chat/query", json={"message": "질문2"})).json()
    assert "횟수" in limited["reply"]
    assert len(env["llm_calls"]) == 1


async def test_monthly_quota_blocks_before_calling(env, monkeypatch):
    monkeypatch.setattr(settings, "AI_MONTHLY_TOKEN_LIMIT", 100)
    await env["db"].aiUsage.insert_one({"_id": hai_gpt._usage_month_key(), "totalTokens": 95})
    reply = (await env["client"].post("/api/v1/chat/query", json={"message": "질문"})).json()
    assert "제한" in reply["reply"] and env["llm_calls"] == []


async def test_replay_mode_replays_recorded_answer(env, monkeypatch):
    client = env["client"]
    await client.post("/api/v1/chat/query", json={"message": "귀를 긁어요"})
    await env["db"].chatCache.delete_many({})
    monkeypatch.setattr(settings, "AI_MODE", "replay")
    replayed = (await client.post("/api/v1/chat/query", json={"message": "귀를 긁어요"})).json()
    assert replayed["reply"] == "답변"
    missed = (await client.post("/api/v1/chat/query", json={"message": "처음 하는 질문"})).json()
    assert "목업" in missed["reply"]
    assert len(env["llm_calls"]) == 1


async def test_breed_guide_weight_range_reaches_dashboard_and_report(env):
    client, pet = env["client"], env["pet"]
    guide = (await client.post(f"/api/v1/pets/{pet['id']}/ai-breed", json={"rawBreedInput": "말티즈"})).json()
    assert guide["feedback"]["standardWeightKg"] == {"min": 2.0, "max": 4.0}

    await client.post(f"/api/v1/pets/{pet['id']}/weights", json={"date": today_kst().isoformat(), "weight": 4.5})
    dashboard = (await client.get(f"/api/v1/pets/{pet['id']}/dashboard")).json()
    assert dashboard["standardWeightKg"] == {"min": 2.0, "max": 4.0}

    today = today_kst()
    report = (await client.get(f"/api/v1/pets/{pet['id']}/report/monthly",
                               params={"year": today.year, "month": today.month})).json()
    assert "0.5kg 무거워요" in report["weightChange"]["analysisMessage"]


async def test_report_adherence_past_month_and_future_month(env):
    client, pet = env["client"], env["pet"]
    today = today_kst()
    med = (await client.post(f"/api/v1/pets/{pet['id']}/medications", json={
        "title": "심장약", "frequencyPerDay": 2, "alertTimes": ["09:00", "21:00"],
        "startDate": today.isoformat(),
    })).json()
    await client.patch(f"/api/v1/pets/{pet['id']}/medications/{med['id']}/check", params={"slotIndex": 0})

    report = (await client.get(f"/api/v1/pets/{pet['id']}/report/monthly",
                               params={"year": today.year, "month": today.month})).json()
    assert report["medicationAdherence"][0]["rate"] == 50
    assert report["overallAdherenceRate"] == 50
    calls_after_first = len(env["llm_calls"])

    # 같은 데이터로 다시 조회하면 캐시를 쓴다
    await client.get(f"/api/v1/pets/{pet['id']}/report/monthly", params={"year": today.year, "month": today.month})
    assert len(env["llm_calls"]) == calls_after_first

    last_month = today.replace(day=1) - timedelta(days=1)
    before_registration = await client.get(f"/api/v1/pets/{pet['id']}/report/monthly",
                                           params={"year": last_month.year, "month": last_month.month})
    assert before_registration.status_code == 400
    assert pet["createdAt"] == today.isoformat()

    next_month = today.replace(day=28) + timedelta(days=7)
    future = await client.get(f"/api/v1/pets/{pet['id']}/report/monthly",
                              params={"year": next_month.year, "month": next_month.month})
    assert future.status_code == 400


async def test_all_pets_notifications(env):
    client, pet = env["client"], env["pet"]
    second = (await client.post("/api/v1/pets", json={
        "name": "나비", "species": "cat", "breed": None, "birthDate": "2021-01-01",
        "sex": "male", "neutered": False, "weight": 4.0, "photoKey": "cat1",
    })).json()
    today = today_kst()
    for target, days in ((pet, 1), (second, 7)):
        await client.post(f"/api/v1/pets/{target['id']}/schedules",
                          json={"title": "종합백신", "date": (today + timedelta(days=days)).isoformat()})

    body = (await client.get("/api/v1/notifications")).json()
    assert body["unreadCount"] == 2
    assert {n["petName"] for n in body["notifications"]} == {"뽀삐", "나비"}

    target = body["notifications"][0]
    read = await client.patch(f"/api/v1/pets/{target['petId']}/notifications/{target['id']}/read")
    assert read.status_code == 204
    assert (await client.get("/api/v1/notifications")).json()["unreadCount"] == 1


async def test_mock_mode_does_not_persist_breed_guide(env, monkeypatch):
    monkeypatch.setattr(settings, "AI_MODE", "mock")
    pet = env["pet"]
    res = await env["client"].post(f"/api/v1/pets/{pet['id']}/ai-breed", json={"rawBreedInput": "푸들"})
    assert res.status_code == 200
    assert await env["db"].breedGuides.count_documents({}) == 0


async def test_past_month_report_ignores_later_data(env):
    """지난달 레포트 컨텍스트에는 그 달 말일 이후 기록이 들어가지 않는다."""
    client, db, pet = env["client"], env["db"], env["pet"]
    today = today_kst()
    last_month_end = today.replace(day=1) - timedelta(days=1)
    # 등록일을 두 달 전으로 당긴 펫을 만든다 (ObjectId 생성 시각 = 등록일)
    old_id = ObjectId.from_datetime(datetime.now(timezone.utc) - timedelta(days=70))
    doc = await db.pets.find_one({"_id": ObjectId(pet["id"])})
    doc["_id"] = old_id
    await db.pets.insert_one(doc)
    await client.post(f"/api/v1/pets/{old_id}/weights", json={"date": last_month_end.isoformat(), "weight": 3.1})
    await client.post(f"/api/v1/pets/{old_id}/weights", json={"date": today.isoformat(), "weight": 3.9})

    res = await client.get(f"/api/v1/pets/{old_id}/report/monthly",
                           params={"year": last_month_end.year, "month": last_month_end.month})
    assert res.status_code == 200
    assert res.json()["weightChange"]["current"] == 3.1
    assert "3.9kg" not in env["llm_calls"][-1]
