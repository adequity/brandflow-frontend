/**
 * 게시판 페이지
 */
import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Eye, Plus, Edit, Trash2, Megaphone } from 'lucide-react';
import boardApi from '../api/boardApi';
import { useToast } from '../contexts/ToastContext';
import BoardPostModal from '../components/modals/BoardPostModal';

const BoardPage = ({ loggedInUser }) => {
  const { showError, showSuccess } = useToast();
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit, view

  // 필터
  const [postType, setPostType] = useState('all');
  const [showNoticeOnly, setShowNoticeOnly] = useState(false);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const isAgencyAdmin = loggedInUser?.role === 'agency_admin';

  // 게시글 목록 조회
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage
      };

      if (postType !== 'all') params.postType = postType;
      if (showNoticeOnly) params.isNotice = true;

      const data = await boardApi.getPosts(params);
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error);
      showError('게시글 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, postType, showNoticeOnly]);

  // 게시글 상세 보기
  const handleViewPost = async (post) => {
    try {
      const data = await boardApi.getPost(post.id);
      setSelectedPost(data.post);
      setModalMode('view');
      setIsModalOpen(true);
    } catch (error) {
      console.error('게시글 조회 실패:', error);
      showError('게시글을 불러오는데 실패했습니다.');
    }
  };

  // 게시글 생성 모달 열기
  const handleCreatePost = () => {
    setSelectedPost(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  // 게시글 수정 모달 열기
  const handleEditPost = (post) => {
    setSelectedPost(post);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // 게시글 삭제
  const handleDeletePost = async (postId) => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return;

    try {
      await boardApi.deletePost(postId);
      showSuccess('게시글이 삭제되었습니다.');
      fetchPosts();
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      showError('게시글 삭제에 실패했습니다.');
    }
  };

  // 모달 닫기 및 새로고침
  const handleModalClose = (shouldRefresh) => {
    setIsModalOpen(false);
    setSelectedPost(null);
    if (shouldRefresh) {
      fetchPosts();
    }
  };

  // 파일 다운로드
  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  // 게시글 타입 라벨
  const getPostTypeLabel = (type) => {
    const labels = {
      notice: '공지사항',
      general: '일반',
      manual: '메뉴얼',
      resource: '자료실'
    };
    return labels[type] || type;
  };

  // 게시글 타입 배지 색상
  const getPostTypeBadgeColor = (type) => {
    const colors = {
      notice: 'bg-red-100 text-red-800',
      general: 'bg-blue-100 text-blue-800',
      manual: 'bg-green-100 text-green-800',
      resource: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📋 게시판</h1>
            <p className="text-gray-600 mt-1">공지사항, 메뉴얼, 자료 등을 확인하세요</p>
          </div>
          {isAgencyAdmin && (
            <button
              onClick={handleCreatePost}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              게시글 작성
            </button>
          )}
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">타입:</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="notice">공지사항</option>
                <option value="general">일반</option>
                <option value="manual">메뉴얼</option>
                <option value="resource">자료실</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showNoticeOnly}
                onChange={(e) => setShowNoticeOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">공지사항만 보기</span>
            </label>

            <div className="ml-auto text-sm text-gray-600">
              총 <span className="font-semibold text-gray-900">{total}</span>개
            </div>
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">게시글이 없습니다.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleViewPost(post)}
                >
                  <div className="flex items-start gap-4">
                    {/* 아이콘 */}
                    <div className="flex-shrink-0 mt-1">
                      {post.isNotice ? (
                        <Megaphone className="w-5 h-5 text-red-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* 콘텐츠 */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.isNotice && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded">
                            공지
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getPostTypeBadgeColor(post.postType)}`}>
                          {getPostTypeLabel(post.postType)}
                        </span>
                        {post.attachmentUrl && (
                          <Download className="w-4 h-4 text-gray-400" />
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {post.title}
                      </h3>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.viewCount}
                        </span>
                        <span>{post.authorName}</span>
                      </div>
                    </div>

                    {/* 액션 버튼 (agency_admin만) */}
                    {isAgencyAdmin && (
                      <div className="flex-shrink-0 flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditPost(post)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>

            <span className="px-4 py-2 text-sm text-gray-700">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* 게시글 모달 */}
      {isModalOpen && (
        <BoardPostModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          mode={modalMode}
          post={selectedPost}
          loggedInUser={loggedInUser}
        />
      )}
    </div>
  );
};

export default BoardPage;
