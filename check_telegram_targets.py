#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
현재 텔레그램 알림이 나가야 하는 캠페인/게시물 목록 확인 스크립트
"""
import requests
import json
from datetime import datetime
import sys

# 인코딩 설정
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

# API 기본 URL (로컬 FastAPI 서버)
BASE_URL = "http://localhost:8081/api"

def get_auth_token():
    """관리자 계정으로 로그인하여 토큰 획득"""
    # OAuth2PasswordRequestForm format - 실제 계정 정보 사용
    login_data = {
        "username": "admin@example.com",  # 또는 실제 시스템 관리자 계정
        "password": "password"
    }

    try:
        # OAuth2PasswordRequestForm은 form data로 전송
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"로그인 실패: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"로그인 요청 오류: {str(e)}")
        return None

def get_telegram_settings(token):
    """모든 사용자의 텔레그램 설정 조회"""
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(f"{BASE_URL}/telegram/settings", headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"텔레그램 설정 조회 실패: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"텔레그램 설정 조회 오류: {str(e)}")
        return []

def get_posts_with_deadlines(token):
    """마감일이 있는 모든 게시물 조회"""
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(f"{BASE_URL}/posts/?has_due_date=true", headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"게시물 조회 실패: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"게시물 조회 오류: {str(e)}")
        return []

def get_campaigns(token):
    """모든 캠페인 조회"""
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(f"{BASE_URL}/campaigns/", headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"캠페인 조회 실패: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"캠페인 조회 오류: {str(e)}")
        return []

def main():
    print("=== 텔레그램 알림 대상 캠페인/게시물 확인 ===")
    print(f"현재 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # 1. 인증 토큰 획득
    print("1. 로그인 중...")
    token = get_auth_token()
    if not token:
        print("❌ 로그인 실패 - 관리자 계정 정보를 확인하세요")
        return
    print("✅ 로그인 성공")

    # 2. 텔레그램 설정 조회
    print("\n2. 텔레그램 설정 조회 중...")
    telegram_settings = get_telegram_settings(token)
    print(f"✅ 활성 텔레그램 설정: {len(telegram_settings)}개")

    if telegram_settings:
        print("\n📱 텔레그램 설정 현황:")
        for setting in telegram_settings:
            print(f"  - 사용자 ID {setting.get('user_id')}: {setting.get('days_before_due')}일 전 알림, {setting.get('notification_time')} 시간")

    # 3. 마감일 있는 게시물 조회
    print("\n3. 마감일 있는 게시물 조회 중...")
    posts = get_posts_with_deadlines(token)
    print(f"✅ 마감일 있는 게시물: {len(posts)}개")

    # 4. 캠페인 조회
    print("\n4. 캠페인 조회 중...")
    campaigns = get_campaigns(token)
    print(f"✅ 전체 캠페인: {len(campaigns)}개")

    # 5. 결과 분석
    print("\n=== 분석 결과 ===")

    if posts:
        print(f"\n📋 마감일 있는 게시물 목록:")
        for post in posts:
            campaign = next((c for c in campaigns if c['id'] == post.get('campaign_id')), None)
            campaign_name = campaign['name'] if campaign else f"캠페인 ID {post.get('campaign_id')}"

            print(f"  📝 게시물 ID {post.get('id')}: {post.get('title')}")
            print(f"     📅 마감일: {post.get('due_date')}")
            print(f"     📋 캠페인: {campaign_name}")
            print(f"     👤 생성자 ID: {campaign.get('creator_id') if campaign else 'Unknown'}")
            print()
    else:
        print("📭 마감일이 있는 게시물이 없습니다.")

    if telegram_settings:
        print("\n🔔 텔레그램 알림 가능성 분석:")
        print("   (실제 알림 여부는 현재 시간, 알림 시간, 이미 전송 여부에 따라 결정됩니다)")

        for setting in telegram_settings:
            user_posts = [p for p in posts
                         for c in campaigns
                         if p.get('campaign_id') == c['id'] and c.get('creator_id') == setting.get('user_id')]

            if user_posts:
                print(f"\n   👤 사용자 ID {setting.get('user_id')} ({setting.get('days_before_due')}일 전 알림):")
                for post in user_posts:
                    campaign = next(c for c in campaigns if c['id'] == post.get('campaign_id'))
                    print(f"     - {post.get('title')} (마감: {post.get('due_date')})")
    else:
        print("\n📭 활성 텔레그램 설정이 없습니다.")

if __name__ == "__main__":
    main()