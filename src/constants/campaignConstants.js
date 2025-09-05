// 캠페인 관련 상수 정의
export const WORK_TYPES = {
  BLOG: '블로그',
  VIDEO: '비디오',
  SNS: 'SNS',
  REVIEW: '리뷰',
  NEWS: '뉴스'
};

export const POST_STATUSES = {
  TOPIC_PENDING: '주제 승인 대기',
  TOPIC_APPROVED: '주제 승인 완료', 
  TOPIC_REJECTED: '주제 승인 거부',
  OUTLINE_PENDING: '목차 승인 대기',
  OUTLINE_APPROVED: '목차 승인 완료',
  OUTLINE_REJECTED: '목차 승인 거부',
  DRAFT_PENDING: '초안 승인 대기',
  DRAFT_APPROVED: '초안 승인 완료',
  DRAFT_REJECTED: '초안 승인 거부',
  PUBLISHED: '발행 완료'
};

export const DEFAULT_VALUES = {
  WORK_TYPE: WORK_TYPES.BLOG,
  TOPIC_STATUS: POST_STATUSES.TOPIC_PENDING,
  OUTLINE_STATUS: POST_STATUSES.OUTLINE_PENDING
};

// 필터 옵션
export const FILTER_OPTIONS = {
  WORK_TYPES: Object.values(WORK_TYPES),
  STATUSES: [
    '승인 대기',
    '승인 완료', 
    '승인 거부',
    '발행 완료'
  ]
};