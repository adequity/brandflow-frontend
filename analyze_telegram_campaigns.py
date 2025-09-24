#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
텔레그램 알림 대상 캠페인 분석 스크립트
Railway 데이터베이스 데이터를 기반으로 알림 필요 캠페인 분석
"""
import sys
from datetime import datetime, timedelta
import json

# 인코딩 설정
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

def analyze_telegram_campaigns():
    """Railway 데이터베이스에서 발견된 데이터 기반 분석"""

    print("=== 텔레그램 알림 대상 캠페인 분석 ===")
    print(f"분석 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # 실제 Railway API에서 데이터를 가져와야 함 - 하드코딩된 데이터 제거됨

    # 현재 날짜
    today = datetime.now().date()

    print("📋 마감일이 있는 게시물 현황:")
    print("-" * 60)

    campaigns = {}
    urgent_posts = []
    upcoming_posts = []
    past_posts = []

    for post in posts_data:
        due_date = datetime.strptime(post["due_date"], "%Y-%m-%d").date()
        days_until_due = (due_date - today).days

        # 캠페인별 그룹화
        if post["campaign_id"] not in campaigns:
            campaigns[post["campaign_id"]] = []
        campaigns[post["campaign_id"]].append({**post, "days_until_due": days_until_due})

        print(f"📝 게시물 ID {post['id']}: '{post['title']}'")
        print(f"   📅 마감일: {post['due_date']} ({days_until_due}일 {'남음' if days_until_due > 0 else '지남' if days_until_due < 0 else '오늘'})")
        print(f"   📋 캠페인: {post['campaign_id']}")
        print()

        # 긴급도별 분류
        if days_until_due < 0:
            past_posts.append(post)
        elif days_until_due <= 7:
            urgent_posts.append(post)
        else:
            upcoming_posts.append(post)

    print("\n🔔 캠페인별 알림 필요성 분석:")
    print("-" * 60)

    for campaign_id, posts in campaigns.items():
        print(f"\n📋 캠페인 ID {campaign_id}:")
        print(f"   게시물 수: {len(posts)}개")

        # 가장 가까운 마감일 찾기
        nearest_post = min(posts, key=lambda x: abs(x["days_until_due"]))
        print(f"   가장 가까운 마감일: {nearest_post['due_date']} ({nearest_post['days_until_due']}일)")

        # 알림 필요성 판단
        urgent_count = sum(1 for p in posts if p["days_until_due"] <= 7 and p["days_until_due"] >= 0)
        if urgent_count > 0:
            print(f"   ⚠️ 긴급: 7일 이내 마감 게시물 {urgent_count}개")
            print(f"   🚨 알림 필요: 높음")
        elif any(p["days_until_due"] > 0 for p in posts):
            print(f"   ℹ️ 예정된 마감일이 있음")
            print(f"   🔔 알림 필요: 보통")
        else:
            print(f"   ❌ 모든 마감일이 지남")
            print(f"   🔕 알림 필요: 없음")

    print("\n📊 전체 요약:")
    print("-" * 60)
    print(f"📝 전체 게시물: {len(posts_data)}개")
    print(f"📋 대상 캠페인: {len(campaigns)}개 (캠페인 {', '.join(map(str, campaigns.keys()))})")
    print(f"🚨 긴급 (7일 이내): {len(urgent_posts)}개")
    print(f"📅 예정 (7일 초과): {len(upcoming_posts)}개")
    print(f"⏰ 마감 지남: {len(past_posts)}개")

    print("\n⚠️ 현재 상태:")
    print("-" * 60)
    print("❌ telegram_notification_logs 테이블이 비어있음 (알림 전송 기록 없음)")
    print("❓ user_telegram_settings 테이블 확인 필요")
    print("🔧 Railway 데이터베이스 스키마 마이그레이션 필요 (NOT NULL 제약 해제)")

    print("\n🔍 다음 단계:")
    print("-" * 60)
    print("1. user_telegram_settings 테이블에서 활성 사용자 확인")
    print("2. 캠페인 creator_id와 텔레그램 설정 사용자 매핑")
    print("3. 알림 조건 (days_before_due, notification_time) 확인")
    print("4. 실제 알림 전송이 필요한 게시물 목록 생성")

    # 텔레그램 스케줄러 로직 시뮬레이션
    print("\n🤖 텔레그램 스케줄러 시뮬레이션:")
    print("-" * 60)
    print("텔레그램 설정이 있다고 가정할 때:")

    # 일반적인 설정값들 (1일전, 3일전, 7일전 알림)
    common_settings = [
        {"days_before_due": 1, "notification_time": "09:00"},
        {"days_before_due": 3, "notification_time": "10:00"},
        {"days_before_due": 7, "notification_time": "09:00"}
    ]

    for setting in common_settings:
        days_before = setting["days_before_due"]
        print(f"\n📱 {days_before}일 전 알림 설정 시:")

        for post in posts_data:
            due_date = datetime.strptime(post["due_date"], "%Y-%m-%d").date()
            notification_date = due_date - timedelta(days=days_before)
            days_until_notification = (notification_date - today).days

            if days_until_notification == 0:
                print(f"   🔔 오늘 알림: 게시물 '{post['title']}' (캠페인 {post['campaign_id']})")
            elif -2 <= days_until_notification <= 2:
                status = "알림 예정" if days_until_notification > 0 else "알림 놓침"
                print(f"   📅 {abs(days_until_notification)}일 {'후' if days_until_notification > 0 else '전'} {status}: 게시물 '{post['title']}'")

if __name__ == "__main__":
    analyze_telegram_campaigns()