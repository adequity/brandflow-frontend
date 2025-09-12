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
  // API 응답 구조: {data: {data: [...], pagination: {...}}} 또는 {data: [...]}
  if (!response?.data) {
    console.warn('extractArrayFromResponse: No response.data found');
    return [];
  }
  
  // 페이지네이션 응답 형태인 경우
  if (response.data.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  
  // results 필드가 있는 경우
  if (response.data.results && Array.isArray(response.data.results)) {
    return response.data.results;
  }
  
  // 직접 배열인 경우
  if (Array.isArray(response.data)) {
    return response.data;
  }
  
  console.warn('extractArrayFromResponse: Could not extract array from response', response.data);
  return [];
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
  return ensureArray(campaignData).map(campaign => {
    // campaign이 객체가 아닌 경우 기본 구조로 변환
    if (!campaign || typeof campaign !== 'object') {
      console.warn('validateCampaignData: Invalid campaign data:', campaign);
      return {
        id: 0,
        name: '잘못된 데이터',
        status: '오류',
        client_company: '알 수 없음',
        description: '',
        budget: 0,
        start_date: null,
        end_date: null,
        creator_id: null,
        created_at: null,
        updated_at: null
      };
    }
    
    return {
      ...campaign,
      id: Number(campaign.id) || 0,
      name: String(campaign.name || '제목 없음'),
      status: String(campaign.status || '상태 없음'),
      client_company: String(campaign.client_company || '클라이언트 없음'),
      description: String(campaign.description || ''),
      budget: Number(campaign.budget) || 0,
      start_date: campaign.start_date || null,
      end_date: campaign.end_date || null,
      creator_id: Number(campaign.creator_id) || null,
      created_at: campaign.created_at || null,
      updated_at: campaign.updated_at || null,
      // 백엔드 필드와 프론트엔드 필드 매핑
      manager_name: campaign.creator_name || campaign.User?.name || null
    };
  });
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

/**
 * 안전한 숫자 포맷팅 (toLocaleString 에러 방지)
 * @param {*} value - 포맷할 값
 * @param {string} locale - 로케일 (기본값: 'ko-KR')
 * @param {Object} options - 포맷 옵션
 * @returns {string} - 포맷된 문자열
 */
export const safeFormatNumber = (value, locale = 'ko-KR', options = {}) => {
  // null, undefined, NaN 처리
  if (value == null || isNaN(value)) {
    return '0';
  }
  
  // 숫자로 변환
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return '0';
  }
  
  try {
    return numValue.toLocaleString(locale, options);
  } catch (error) {
    console.warn('safeFormatNumber: toLocaleString failed', { value, error });
    return String(numValue);
  }
};

/**
 * 안전한 통화 포맷팅
 * @param {*} value - 포맷할 금액
 * @param {string} currency - 통화 단위 (기본값: '원')
 * @returns {string} - 포맷된 통화 문자열
 */
export const safeFormatCurrency = (value, currency = '원') => {
  return `${safeFormatNumber(value)}${currency}`;
};

/**
 * 숫자에 콤마 추가하는 함수
 * @param {*} value - 포맷할 값
 * @returns {string} - 콤마가 추가된 문자열
 */
export const formatNumberWithCommas = (value) => {
  if (!value) return '';
  const numericValue = value.toString().replace(/[^0-9]/g, '');
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * 콤마 제거하고 숫자만 추출하는 함수
 * @param {*} value - 콤마를 제거할 값
 * @returns {string} - 콤마가 제거된 숫자 문자열
 */
export const removeCommas = (value) => {
  return value.toString().replace(/,/g, '');
};

/**
 * 안전한 날짜 포맷팅 (toLocaleString 에러 방지)
 * @param {*} date - 포맷할 날짜
 * @param {string} locale - 로케일 (기본값: 'ko-KR')
 * @param {Object} options - 포맷 옵션
 * @returns {string} - 포맷된 날짜 문자열
 */
export const safeFormatDate = (date, locale = 'ko-KR', options = {}) => {
  if (!date) {
    return '-';
  }
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    return dateObj.toLocaleString(locale, options);
  } catch (error) {
    console.warn('safeFormatDate: toLocaleString failed', { date, error });
    return String(date);
  }
};