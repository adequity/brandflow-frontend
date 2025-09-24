#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Railway 프로덕션에서 실시간 데이터 가져와서 텔레그램 연결 구조 분석
"""
import requests
import json
import sys
from datetime import datetime, timedelta

# 인코딩 설정
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

# Railway 프로덕션 URL
BASE_URL = "https://brandflow-backend-production-99ae.up.railway.app/api"

def get_auth_token():
    """실제 계정으로 로그인하여 토큰 획득"""
    print("실제 Railway 계정 정보를 입력해주세요:")
    email = input("이메일: ")
    password = input("비밀번호: ")

    login_data = {
        "username": email,
        "password": password
    }

    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data, timeout=10)
        if response.status_code == 200:
            print("✅ 로그인 성공!")
            return response.json().get("access_token")
        else:
            print(f"❌ 로그인 실패: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ 로그인 오류: {str(e)}")
        return None

def analyze_realtime_data(token):
    """실시간 데이터 분석"""
    headers = {"Authorization": f"Bearer {token}"}

    print("\n=== 실시간 Railway 데이터 분석 ===")
    print(f"분석 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        # 1. 텔레그램 설정 조회
        print("\n📱 1. 텔레그램 설정 조회...")
        response = requests.get(f"{BASE_URL}/telegram/settings", headers=headers, timeout=10)
        if response.status_code == 200:
            telegram_settings = response.json()
            print(f"✅ 활성 텔레그램 설정: {len(telegram_settings)}개")
            for setting in telegram_settings:
                print(f"   - 사용자 ID {setting.get('user_id')}: {setting.get('days_before_due')}일 전, {setting.get('notification_time')} 시간")
        else:
            print(f"❌ 텔레그램 설정 조회 실패: {response.status_code}")
            telegram_settings = []

        # 2. 마감일 있는 게시물 조회
        print("\n📝 2. 마감일 있는 게시물 조회...")
        response = requests.get(f"{BASE_URL}/posts/?has_due_date=true", headers=headers, timeout=10)
        if response.status_code == 200:
            posts = response.json()
            print(f"✅ 마감일 있는 게시물: {len(posts)}개")

            print("\n📋 실제 Posts 데이터:")
            for post in posts:
                print(f"   - Post ID {post.get('id')}: '{post.get('title')}'")
                print(f"     📅 마감일: {post.get('due_date')}")
                print(f"     📋 캠페인: {post.get('campaign_id')}")
                print(f"     🔄 활성: {post.get('is_active', 'Unknown')}")
                print()
        else:
            print(f"❌ 게시물 조회 실패: {response.status_code}")
            posts = []

        # 3. 캠페인 조회
        print("\n🏷️ 3. 캠페인 조회...")
        response = requests.get(f"{BASE_URL}/campaigns/", headers=headers, timeout=10)
        if response.status_code == 200:
            campaigns = response.json()
            print(f"✅ 전체 캠페인: {len(campaigns)}개")

            print("\n📋 캠페인-소유자 관계:")
            for campaign in campaigns:
                campaign_id = campaign.get('id')
                creator_id = campaign.get('creator_id')
                name = campaign.get('name', 'Unknown')
                print(f"   - 캠페인 ID {campaign_id}: '{name}' (소유자: {creator_id})")
        else:
            print(f"❌ 캠페인 조회 실패: {response.status_code}")
            campaigns = []

        # 4. 연결 구조 분석
        print("\n🔗 4. 자동 연결 구조 분석...")
        if telegram_settings and posts and campaigns:
            for setting in telegram_settings:
                user_id = setting.get('user_id')
                print(f"\n👤 사용자 ID {user_id}의 알림 대상 분석:")
                print(f"   📱 알림 설정: {setting.get('days_before_due')}일 전, {setting.get('notification_time')} 시간")

                # 해당 사용자가 소유한 캠페인들 찾기
                user_campaigns = [c for c in campaigns if c.get('creator_id') == user_id]
                print(f"   📋 소유 캠페인: {len(user_campaigns)}개")
                for campaign in user_campaigns:
                    print(f"      - 캠페인 {campaign.get('id')}: {campaign.get('name')}")

                # 해당 캠페인들의 마감일 있는 게시물들 찾기
                user_posts = []
                for post in posts:
                    if any(c.get('id') == post.get('campaign_id') for c in user_campaigns):
                        user_posts.append(post)

                print(f"   📝 알림 대상 게시물: {len(user_posts)}개")
                for post in user_posts:
                    print(f"      - Post {post.get('id')}: '{post.get('title')}' (마감: {post.get('due_date')})")

                    # 알림 예상 일시 계산
                    try:
                        due_date = datetime.strptime(post.get('due_date'), '%Y-%m-%d')
                        days_before = setting.get('days_before_due', 0)
                        notification_date = due_date - timedelta(days=days_before)
                        notification_time = setting.get('notification_time', '10:00')

                        print(f"         🔔 예상 알림: {notification_date.strftime('%Y-%m-%d')} {notification_time}")
                    except Exception as e:
                        print(f"         ❌ 알림 일시 계산 오류: {e}")

        print("\n✅ 실시간 데이터 분석 완료!")

    except Exception as e:
        print(f"❌ 분석 오류: {str(e)}")

def main():
    print("=== Railway 프로덕션 실시간 데이터 분석 ===")

    # 로그인
    token = get_auth_token()
    if not token:
        print("❌ 로그인 실패로 분석을 중단합니다.")
        return

    # 실시간 데이터 분석
    analyze_realtime_data(token)

if __name__ == "__main__":
    main()