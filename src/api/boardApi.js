/**
 * 게시판 API
 */
import client from './client';

const boardApi = {
  /**
   * 게시글 목록 조회
   */
  getPosts: async (params = {}) => {
    const { postType, isNotice, skip = 0, limit = 20 } = params;
    const queryParams = new URLSearchParams();

    if (postType) queryParams.append('post_type', postType);
    if (isNotice !== undefined) queryParams.append('is_notice', isNotice);
    queryParams.append('skip', skip);
    queryParams.append('limit', limit);

    const response = await client.get(`/api/board/posts?${queryParams}`);
    return response.data;
  },

  /**
   * 게시글 상세 조회
   */
  getPost: async (postId) => {
    const response = await client.get(`/api/board/posts/${postId}`);
    return response.data;
  },

  /**
   * 게시글 생성
   */
  createPost: async (formData) => {
    const response = await client.post('/api/board/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * 게시글 수정
   */
  updatePost: async (postId, formData) => {
    const response = await client.put(`/api/board/posts/${postId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * 게시글 삭제
   */
  deletePost: async (postId) => {
    const response = await client.delete(`/api/board/posts/${postId}`);
    return response.data;
  },

  /**
   * 대시보드 팝업 게시글 조회
   */
  getPopupPosts: async () => {
    const response = await client.get('/api/board/popup-posts');
    return response.data;
  }
};

export default boardApi;
