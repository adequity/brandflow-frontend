#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Railway 프로덕션 환경에서 텔레그램 API 직접 테스트
"""
import requests
import json
import sys

if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

# Railway 프로덕션 URL
BASE_URL = "https://brandflow-backend-production-99ae.up.railway.app/api"

def get_auth_token():
    """Railway 프로덕션 환경에서 로그인"""
    # 실제 계정 정보 사용 필요
    login_data = {
        "username": "admin@example.com",  # 실제 계정으로 변경 필요
        "password": "password"
    }

    try:
        print("🔑 Railway 프로덕션 서버 로그인 시도...")
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data, timeout=10)

        print(f"응답 상태코드: {response.status_code}")

        if response.status_code == 200:
            token = response.json().get("access_token")
            print("✅ 로그인 성공!")
            return token
        else:
            print(f"❌ 로그인 실패: {response.status_code}")
            print(f"응답: {response.text}")
            return None
    except Exception as e:
        print(f"❌ 로그인 오류: {str(e)}")
        return None

def test_telegram_endpoints(token):
    """텔레그램 관련 엔드포인트 테스트"""
    headers = {"Authorization": f"Bearer {token}"}

    print("\n📱 텔레그램 설정 조회...")
    try:
        response = requests.get(f"{BASE_URL}/telegram/settings", headers=headers, timeout=10)
        print(f"설정 조회 응답: {response.status_code}")
        if response.status_code == 200:
            settings = response.json()
            print(f"✅ 텔레그램 설정: {len(settings)}개")
            for setting in settings:
                print(f"  - 사용자 ID {setting.get('user_id')}: {setting.get('days_before_due')}일 전, {setting.get('notification_time')} 시간")
        else:
            print(f"❌ 설정 조회 실패: {response.text}")
    except Exception as e:
        print(f"❌ 설정 조회 오류: {str(e)}")

    print("\n🧪 텔레그램 테스트 메시지 전송...")
    try:
        response = requests.post(f"{BASE_URL}/telegram/send-test", headers=headers, timeout=15)
        print(f"테스트 메시지 응답: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 테스트 메시지 전송 성공!")
            print(f"결과: {result}")
        else:
            print(f"❌ 테스트 메시지 실패: {response.text}")
    except Exception as e:
        print(f"❌ 테스트 메시지 오류: {str(e)}")

    print("\n📋 텔레그램 로그 조회...")
    try:
        response = requests.get(f"{BASE_URL}/telegram/logs", headers=headers, timeout=10)
        print(f"로그 조회 응답: {response.status_code}")
        if response.status_code == 200:
            logs = response.json()
            print(f"✅ 알림 로그: {len(logs)}개")
            for log in logs[-3:]:  # 최근 3개
                print(f"  - ID {log.get('id')}: {log.get('notification_type')} | 전송: {log.get('is_sent')}")
        else:
            print(f"❌ 로그 조회 실패: {response.text}")
    except Exception as e:
        print(f"❌ 로그 조회 오류: {str(e)}")

def main():
    print("=" * 60)
    print("🚀 Railway 프로덕션 텔레그램 API 테스트")
    print("=" * 60)

    # 1. 로그인
    token = get_auth_token()
    if not token:
        print("\n❌ 로그인 실패로 테스트를 중단합니다.")
        print("💡 실제 계정 정보로 로그인 데이터를 수정해주세요.")
        return

    # 2. 텔레그램 API 테스트
    test_telegram_endpoints(token)

    print("\n" + "=" * 60)
    print("✅ Railway 프로덕션 환경 테스트 완료!")
    print("📊 pgAdmin에서 스키마를 수정했으니 테스트 메시지가 성공해야 합니다.")
    print("=" * 60)

if __name__ == "__main__":
    main()