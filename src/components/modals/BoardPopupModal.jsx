/**
 * 대시보드 게시판 팝업 모달
 */
import { useState } from 'react';
import { X, Calendar, Download, FileText } from 'lucide-react';

const BoardPopupModal = ({ posts, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!posts || posts.length === 0) return null;

  const currentPost = posts[currentIndex];

  // 파일 다운로드
  const handleDownload = () => {
    if (currentPost?.attachmentUrl) {
      const link = document.createElement('a');
      link.href = currentPost.attachmentUrl;
      link.download = currentPost.attachmentName || '파일';
      link.click();
    }
  };

  // 다음 팝업
  const handleNext = () => {
    if (currentIndex < posts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  // 이전 팝업
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-3 md:p-6 border-b bg-gradient-to-r from-primary-500 to-primary-600">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0" />
            <h2 className="text-sm md:text-xl font-bold text-white truncate">공지사항</h2>
            {posts.length > 1 && (
              <span className="px-2 md:px-3 py-0.5 md:py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] md:text-sm text-white font-medium flex-shrink-0">
                {currentIndex + 1} / {posts.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation flex-shrink-0"
          >
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        {/* 바디 */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          {/* 메타 정보 */}
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 pb-3 md:pb-4 border-b mb-4 md:mb-6 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
              {new Date(currentPost.createdAt).toLocaleDateString('ko-KR')}
            </span>
            <span className="hidden sm:inline">작성자: {currentPost.authorName}</span>
          </div>

          {/* 뱃지 */}
          <div className="flex gap-1.5 md:gap-2 mb-4 md:mb-6 flex-wrap">
            {currentPost.isNotice && (
              <span className="inline-flex px-2 md:px-3 py-0.5 md:py-1 bg-red-100 text-red-700 text-[10px] md:text-sm font-bold rounded-full">
                공지
              </span>
            )}
            <span className={`inline-flex px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-sm font-bold rounded-full ${getPostTypeBadgeColor(currentPost.postType)}`}>
              {getPostTypeLabel(currentPost.postType)}
            </span>
          </div>

          {/* 제목 */}
          <h3 className="text-base md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
            {currentPost.title}
          </h3>

          {/* 내용 */}
          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap mb-4 md:mb-6 text-sm md:text-base">
            {currentPost.content}
          </div>

          {/* 첨부파일 */}
          {currentPost.attachmentUrl && (
            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <Download className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm font-medium text-blue-900 truncate">
                      {currentPost.attachmentName}
                    </p>
                    <p className="text-[10px] md:text-xs text-blue-600">
                      {currentPost.attachmentSize
                        ? `${(currentPost.attachmentSize / 1024).toFixed(1)} KB`
                        : '크기 정보 없음'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-3 md:px-4 py-2 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm font-medium min-h-[44px] flex items-center justify-center touch-manipulation w-full sm:w-auto whitespace-nowrap"
                >
                  다운로드
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-3 md:p-6 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="order-2 sm:order-1">
            {posts.length > 1 && (
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-3 md:px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] touch-manipulation w-full sm:w-auto"
              >
                이전
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
            <label className="flex items-center gap-2 min-h-[44px] touch-manipulation cursor-pointer">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    localStorage.setItem('boardPopupDismissedDate', new Date().toDateString());
                  } else {
                    localStorage.removeItem('boardPopupDismissedDate');
                  }
                }}
                className="w-5 h-5 md:w-4 md:h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-xs md:text-sm text-gray-600">오늘 하루 보지 않기</span>
            </label>

            {posts.length > 1 ? (
              <button
                onClick={handleNext}
                className="px-4 md:px-5 py-2.5 md:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-xs md:text-base min-h-[44px] touch-manipulation w-full sm:w-auto"
              >
                {currentIndex === posts.length - 1 ? '닫기' : '다음'}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 md:px-5 py-2.5 md:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-xs md:text-base min-h-[44px] touch-manipulation w-full sm:w-auto"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardPopupModal;
