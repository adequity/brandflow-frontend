#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Railway 프로덕션에서 campaigns.creator_id와 posts.due_date 연결 구조 확인
"""
import requests
import sys
from datetime import datetime

if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

BASE_URL = "https://brandflow-backend-production-99ae.up.railway.app/api"

def get_auth_token():
    """실제 계정으로 로그인 (사용자가 실제 계정 입력 필요)"""
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

def check_campaign_structure(token):
    """캠페인과 게시물 연결 구조 확인"""
    headers = {"Authorization": f"Bearer {token}"}

    try:
        print("\n📋 캠페인 목록 조회...")
        response = requests.get(f"{BASE_URL}/campaigns/", headers=headers, timeout=10)

        if response.status_code != 200:
            print(f"❌ 캠페인 조회 실패: {response.status_code}")
            return

        campaigns = response.json()
        print(f"✅ 전체 캠페인: {len(campaigns)}개")

        print("\n🔍 캠페인 소유자 분석:")
        creator_counts = {}

        for campaign in campaigns:
            creator_id = campaign.get('creator_id')
            campaign_id = campaign.get('id')
            name = campaign.get('name', 'Unknown')

            if creator_id not in creator_counts:
                creator_counts[creator_id] = []
            creator_counts[creator_id].append({
                'id': campaign_id,
                'name': name
            })

            print(f"  📋 캠페인 {campaign_id}: '{name}' (소유자: {creator_id})")

        print(f"\n👥 사용자별 캠페인 소유 현황:")
        for creator_id, campaign_list in creator_counts.items():
            print(f"  사용자 ID {creator_id}: {len(campaign_list)}개 캠페인")
            for campaign in campaign_list:
                print(f"    - {campaign['id']}: {campaign['name']}")

        # 게시물 조회 (마감일 있는 것들)
        print(f"\n📝 마감일 있는 게시물 조회...")
        response = requests.get(f"{BASE_URL}/posts/?has_due_date=true", headers=headers, timeout=10)

        if response.status_code == 200:
            posts = response.json()
            print(f"✅ 마감일 있는 게시물: {len(posts)}개")

            print(f"\n🔗 게시물-캠페인-소유자 연결 분석:")
            for post in posts:
                post_id = post.get('id')
                title = post.get('title', 'Unknown')
                due_date = post.get('due_date')
                campaign_id = post.get('campaign_id')

                # 해당 캠페인의 소유자 찾기
                campaign_owner = None
                for campaign in campaigns:
                    if campaign.get('id') == campaign_id:
                        campaign_owner = campaign.get('creator_id')
                        break

                print(f"  📝 게시물 {post_id}: '{title}'")
                print(f"     📅 마감일: {due_date}")
                print(f"     📋 캠페인: {campaign_id}")
                print(f"     👤 소유자: {campaign_owner}")
                print()

        # 텔레그램 설정과 매칭 분석
        print(f"\n📱 텔레그램 설정 확인...")
        response = requests.get(f"{BASE_URL}/telegram/settings", headers=headers, timeout=10)

        if response.status_code == 200:
            telegram_settings = response.json()
            print(f"✅ 활성 텔레그램 설정: {len(telegram_settings)}개")

            for setting in telegram_settings:
                user_id = setting.get('user_id')
                days_before = setting.get('days_before_due')
                notify_time = setting.get('notification_time')

                print(f"\n🔔 사용자 ID {user_id} 알림 설정:")
                print(f"   ⏰ {days_before}일 전, {notify_time} 시간")

                # 해당 사용자가 소유한 캠페인들
                user_campaigns = creator_counts.get(user_id, [])
                print(f"   📋 소유 캠페인: {len(user_campaigns)}개")

                # 해당 캠페인들의 마감일 있는 게시물들
                user_posts_with_deadline = []
                for post in posts:
                    campaign_id = post.get('campaign_id')
                    for campaign in user_campaigns:
                        if campaign['id'] == campaign_id:
                            user_posts_with_deadline.append(post)

                print(f"   📝 마감일 있는 게시물: {len(user_posts_with_deadline)}개")
                for post in user_posts_with_deadline:
                    print(f"      - {post.get('title')}: {post.get('due_date')}")

    except Exception as e:
        print(f"❌ 분석 오류: {str(e)}")

def main():
    print("=" * 80)
    print("🔍 BrandFlow 텔레그램 알림 연결 구조 분석")
    print("=" * 80)
    print("user_telegram_settings → campaigns.creator_id → posts.due_date 연결 확인")
    print()

    # 로그인
    token = get_auth_token()
    if not token:
        return

    # 구조 분석
    check_campaign_structure(token)

    print("\n" + "=" * 80)
    print("📊 분석 완료!")
    print("=" * 80)

if __name__ == "__main__":
    main()