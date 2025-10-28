import api from './client';

/**
 * 구매요청 API 모듈
 * 모든 구매요청 관련 API 호출을 중앙에서 관리
 */

const purchaseRequestApi = {
  /**
   * 구매요청 목록 조회
   * @param {Object} params - 쿼리 파라미터
   * @param {number} params.viewerId - 조회자 ID
   * @param {string} params.viewerRole - 조회자 역할
   * @param {string} params.status - 상태 필터 (선택)
   * @param {number} params.campaignId - 캠페인 ID 필터 (선택)
   * @returns {Promise} 구매요청 목록
   */
  list: async (params = {}) => {
    try {
      const response = await api.get('/api/purchase-requests', { params });
      return response.data;
    } catch (error) {
      console.error('[PurchaseRequestAPI] 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 구매요청 통계 조회
   * @param {Object} params - 쿼리 파라미터
   * @param {number} params.viewerId - 조회자 ID
   * @param {string} params.viewerRole - 조회자 역할
   * @returns {Promise} 구매요청 통계
   */
  getStats: async (params = {}) => {
    try {
      const response = await api.get('/api/purchase-requests/summary/stats', { params });
      return response.data;
    } catch (error) {
      console.error('[PurchaseRequestAPI] 통계 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 구매요청 상세 조회
   * @param {number} requestId - 구매요청 ID
   * @param {Object} params - 쿼리 파라미터
   * @returns {Promise} 구매요청 상세 정보
   */
  getById: async (requestId, params = {}) => {
    try {
      const response = await api.get(`/api/purchase-requests/${requestId}`, { params });
      return response.data;
    } catch (error) {
      console.error('[PurchaseRequestAPI] 상세 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 구매요청 생성
   * @param {Object} data - 생성할 구매요청 데이터
   * @param {Object} params - 쿼리 파라미터
   * @returns {Promise} 생성된 구매요청
   */
  create: async (data, params = {}) => {
    try {
      const response = await api.post('/api/purchase-requests', data, { params });
      return response.data;
    } catch (error) {
      console.error('[PurchaseRequestAPI] 생성 실패:', error);
      throw error;
    }
  },

  /**
   * 구매요청 수정
   * @param {number} requestId - 구매요청 ID
   * @param {Object} data - 수정할 데이터
   * @param {Object} params - 쿼리 파라미터
   * @returns {Promise} 수정된 구매요청
   */
  update: async (requestId, data, params = {}) => {
    try {
      const response = await api.put(`/api/purchase-requests/${requestId}`, data, { params });
      return response.data;
    } catch (error) {
      console.error('[PurchaseRequestAPI] 수정 실패:', error);
      throw error;
    }
  },

  /**
   * 구매요청 삭제
   * @param {number} requestId - 구매요청 ID
   * @param {Object} params - 쿼리 파라미터
   * @returns {Promise} 삭제 결과
   */
  delete: async (requestId, params = {}) => {
    try {
      const response = await api.delete(`/api/purchase-requests/${requestId}`, { params });
      return response.data;
    } catch (error) {
      console.error('[PurchaseRequestAPI] 삭제 실패:', error);
      throw error;
    }
  },

  /**
   * 구매요청 승인
   * @param {number} requestId - 구매요청 ID
   * @param {Object} data - 승인 데이터 (approverComment 등)
   * @param {Object} params - 쿼리 파라미터
   * @returns {Promise} 승인 결과
   */
  approve: async (requestId, data = {}, params = {}) => {
    try {
      const response = await api.put(
        `/api/purchase-requests/${requestId}/approve`,
        data,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('[PurchaseRequestAPI] 승인 실패:', error);
      throw error;
    }
  },

  /**
   * 구매요청 반려
   * @param {number} requestId - 구매요청 ID
   * @param {Object} data - 반려 데이터 (rejectReason 등)
   * @param {Object} params - 쿼리 파라미터
   * @returns {Promise} 반려 결과
   */
  reject: async (requestId, data = {}, params = {}) => {
    try {
      const response = await api.put(
        `/api/purchase-requests/${requestId}/reject`,
        data,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('[PurchaseRequestAPI] 반려 실패:', error);
      throw error;
    }
  },

  /**
   * 구매요청 문서 생성 (영수증 등)
   * @param {number} requestId - 구매요청 ID
   * @param {Object} data - 문서 생성 데이터
   * @param {Object} params - 쿼리 파라미터
   * @returns {Promise} 생성된 문서 정보
   */
  generateDocuments: async (requestId, data = {}, params = {}) => {
    try {
      const response = await api.post(
        `/api/purchase-requests/${requestId}/generate-documents`,
        data,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('[PurchaseRequestAPI] 문서 생성 실패:', error);
      throw error;
    }
  },

  /**
   * 영수증 파일 업로드
   * @param {number} requestId - 구매요청 ID
   * @param {FormData} formData - 파일이 포함된 FormData
   * @param {Object} params - 쿼리 파라미터
   * @returns {Promise} 업로드 결과
   */
  uploadReceipt: async (requestId, formData, params = {}) => {
    try {
      const response = await api.post(
        `/api/purchase-requests/${requestId}/upload-receipt`,
        formData,
        {
          params,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('[PurchaseRequestAPI] 영수증 업로드 실패:', error);
      throw error;
    }
  },

  /**
   * 영수증 파일 삭제
   * @param {number} requestId - 구매요청 ID
   * @param {Object} params - 쿼리 파라미터
   * @returns {Promise} 삭제 결과
   */
  deleteReceipt: async (requestId, params = {}) => {
    try {
      const response = await api.delete(
        `/api/purchase-requests/${requestId}/receipt`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('[PurchaseRequestAPI] 영수증 삭제 실패:', error);
      throw error;
    }
  },

  /**
   * 매출 등록에서 구매요청 생성
   * @param {number} saleId - 매출 ID
   * @param {Object} data - 구매요청 데이터
   * @param {Object} params - 쿼리 파라미터
   * @returns {Promise} 생성된 구매요청
   */
  createFromSale: async (saleId, data, params = {}) => {
    try {
      const response = await api.post(
        `/api/sales/${saleId}/create-purchase-request`,
        data,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('[PurchaseRequestAPI] 매출에서 구매요청 생성 실패:', error);
      throw error;
    }
  },
};

export default purchaseRequestApi;
