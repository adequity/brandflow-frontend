#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
텔레그램 스케줄러 수동 실행 스크립트
pgAdmin에서 스키마를 수정한 후 동작 테스트
"""
import asyncio
import sys
import os
import requests
from datetime import datetime

# 인코딩 설정
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

# FastAPI 서버 URL
BASE_URL = "http://localhost:8081/api"

def get_auth_token():
    """관리자 계정으로 로그인하여 토큰 획득"""
    login_data = {
        "username": "admin@example.com",
        "password": "password"
    }

    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"❌ 로그인 실패: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ 로그인 요청 오류: {str(e)}")
        return None

def test_telegram_message(token):
    """텔레그램 테스트 메시지 전송"""
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.post(f"{BASE_URL}/telegram/send-test", headers=headers)
        if response.status_code == 200:
            print("✅ 텔레그램 테스트 메시지 전송 성공!")
            print(f"응답: {response.json()}")
            return True
        else:
            print(f"❌ 테스트 메시지 전송 실패: {response.status_code}")
            print(f"오류 내용: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 테스트 메시지 전송 오류: {str(e)}")
        return False

def manual_run_scheduler(token):
    """텔레그램 스케줄러 수동 실행"""
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.post(f"{BASE_URL}/telegram/run-scheduler", headers=headers)
        if response.status_code == 200:
            print("✅ 텔레그램 스케줄러 수동 실행 성공!")
            result = response.json()
            print(f"처리 결과: {result}")
            return True
        else:
            print(f"❌ 스케줄러 수동 실행 실패: {response.status_code}")
            print(f"오류 내용: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 스케줄러 실행 오류: {str(e)}")
        return False

def check_notification_logs(token):
    """텔레그램 알림 로그 확인"""
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(f"{BASE_URL}/telegram/logs", headers=headers)
        if response.status_code == 200:
            logs = response.json()
            print(f"\n📋 텔레그램 알림 로그 ({len(logs)}개):")
            for log in logs[-5:]:  # 최근 5개만 표시
                print(f"  - ID {log.get('id')}: {log.get('notification_type')} | "
                      f"전송됨: {log.get('is_sent')} | 시간: {log.get('created_at')}")
            return logs
        else:
            print(f"❌ 알림 로그 조회 실패: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ 알림 로그 조회 오류: {str(e)}")
        return None

def main():
    print("=" * 60)
    print("🤖 텔레그램 스케줄러 수동 실행 도구")
    print("=" * 60)
    print(f"⏰ 실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # 1. 로그인
    print("1️⃣ 관리자 계정 로그인...")
    token = get_auth_token()
    if not token:
        print("🔴 로그인 실패로 종료합니다.")
        return
    print("✅ 로그인 성공")

    # 2. 테스트 메시지 전송 (스키마 수정 확인)
    print("\n2️⃣ 텔레그램 테스트 메시지 전송...")
    test_success = test_telegram_message(token)

    if test_success:
        print("✅ 스키마 수정이 성공적으로 적용되었습니다!")
    else:
        print("❌ 아직 스키마 수정이 반영되지 않았거나 다른 오류가 있습니다.")

    # 3. 스케줄러 수동 실행
    print("\n3️⃣ 텔레그램 스케줄러 수동 실행...")
    scheduler_success = manual_run_scheduler(token)

    # 4. 결과 확인
    print("\n4️⃣ 알림 로그 확인...")
    logs = check_notification_logs(token)

    # 5. 종합 결과
    print("\n" + "=" * 60)
    print("📊 실행 결과 요약")
    print("=" * 60)
    print(f"테스트 메시지: {'✅ 성공' if test_success else '❌ 실패'}")
    print(f"스케줄러 실행: {'✅ 성공' if scheduler_success else '❌ 실패'}")
    print(f"알림 로그 개수: {len(logs) if logs else 0}개")

    if test_success and scheduler_success:
        print("\n🎉 모든 테스트가 성공했습니다!")
        print("📱 이제 텔레그램 알림이 정상적으로 작동합니다.")
    else:
        print("\n⚠️ 일부 테스트가 실패했습니다.")
        print("🔧 FastAPI 서버 상태와 엔드포인트를 확인해주세요.")

if __name__ == "__main__":
    main()