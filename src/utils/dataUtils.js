// 데이터 구조 검증 및 안전한 접근 유틸리티

/**
 * 데이터가 배열인지 확인하고, 아니면 빈 배열 반환
 * @param {*} data - 확인할 데이터
 * @returns {Array} - 유효한 배열 또는 빈 배열
 */
export const ensureArray = (data) => {
  return Array.isArray(data) ? data : [];
};

/**
 * API 응답에서 안전하게 배열 데이터 추출
 * @param {Object} response - API 응답 객체
 * @returns {Array} - 추출된 배열 데이터
 */
export const extractArrayFromResponse = (response) => {
  const data = response?.data?.data || 
               response?.data?.results || 
               response?.data;
  return ensureArray(data);
};

/**
 * 객체에서 안전하게 속성 접근
 * @param {Object} obj - 대상 객체
 * @param {string} path - 접근할 속성 경로 (점으로 구분)
 * @param {*} fallback - 기본값
 * @returns {*} - 속성 값 또는 기본값
 */
export const safeGet = (obj, path, fallback = null) => {
  if (!obj || typeof path !== 'string') return fallback;
  
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj) ?? fallback;
};

/**
 * 캠페인 데이터 안전 처리
 * @param {*} campaignData - 캠페인 데이터
 * @returns {Array} - 검증된 캠페인 배열
 */
export const validateCampaignData = (campaignData) => {
  return ensureArray(campaignData).map(campaign => ({
    ...campaign,
    id: campaign?.id || 0,
    name: campaign?.name || '제목 없음',
    status: campaign?.status || '상태 없음',
    client_company: campaign?.client_company || '클라이언트 없음'
  }));
};

/**
 * 재무 요약 데이터 안전 처리
 * @param {Object} summary - 재무 요약 데이터
 * @returns {Object} - 검증된 재무 요약 객체
 */
export const validateFinancialSummary = (summary) => {
  if (!summary || typeof summary !== 'object') {
    return {
      completed_tasks: 0,
      total_tasks: 0,
      total_budget: 0,
      spent_amount: 0
    };
  }
  
  return {
    completed_tasks: summary.completed_tasks || 0,
    total_tasks: summary.total_tasks || 0,
    total_budget: summary.total_budget || 0,
    spent_amount: summary.spent_amount || 0,
    ...summary
  };
};