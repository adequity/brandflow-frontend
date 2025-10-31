/**
 * 게시글 작성/수정/조회 모달
 */
import { useState, useEffect } from 'react';
import { X, Download, Calendar, Eye, Upload, Trash2 } from 'lucide-react';
import boardApi from '../../api/boardApi';
import { useToast } from '../../contexts/ToastContext';

const BoardPostModal = ({ isOpen, onClose, mode, post, loggedInUser }) => {
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);

  // 폼 데이터
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('general');
  const [isNotice, setIsNotice] = useState(false);
  const [isPopup, setIsPopup] = useState(false);
  const [popupStartDate, setPopupStartDate] = useState('');
  const [popupEndDate, setPopupEndDate] = useState('');
  const [files, setFiles] = useState([]);
  const [removeAttachmentIds, setRemoveAttachmentIds] = useState([]);

  const isAgencyAdmin = loggedInUser?.role === 'AGENCY_ADMIN';
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  // 게시글 데이터 로드
  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setPostType(post.postType || 'general');
      setIsNotice(post.isNotice || false);
      setIsPopup(post.isPopup || false);
      setPopupStartDate(post.popupStartDate ? post.popupStartDate.split('T')[0] : '');
      setPopupEndDate(post.popupEndDate ? post.popupEndDate.split('T')[0] : '');
    } else {
      resetForm();
    }
  }, [post]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPostType('general');
    setIsNotice(false);
    setIsPopup(false);
    setPopupStartDate('');
    setPopupEndDate('');
    setFiles([]);
    setRemoveAttachmentIds([]);
  };

  // 파일 선택 핸들러 (다중)
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // 파일 크기 체크 (각 파일 10MB)
    const invalidFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      showError('파일 크기는 10MB를 초과할 수 없습니다.');
      e.target.value = ''; // input 초기화
      return;
    }

    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    e.target.value = ''; // input 초기화 (같은 파일 다시 선택 가능하도록)
  };

  // 새로 추가한 파일 제거
  const handleRemoveNewFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // 기존 첨부파일 제거 (수정 모드)
  const handleRemoveExistingFile = (attachmentId) => {
    setRemoveAttachmentIds(prev => [...prev, attachmentId]);
  };

  // 게시글 저장
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showError('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      showError('내용을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('post_type', postType);
      formData.append('is_notice', isNotice);
      formData.append('is_popup', isPopup);

      if (popupStartDate) {
        formData.append('popup_start_date', new Date(popupStartDate).toISOString());
      }
      if (popupEndDate) {
        formData.append('popup_end_date', new Date(popupEndDate).toISOString());
      }

      // 다중 파일 추가
      files.forEach(file => {
        formData.append('files', file);
      });

      if (isEditMode) {
        // 삭제할 첨부파일 ID들
        if (removeAttachmentIds.length > 0) {
          formData.append('remove_attachment_ids', removeAttachmentIds.join(','));
        }
        await boardApi.updatePost(post.id, formData);
        showSuccess('게시글이 수정되었습니다.');
      } else {
        await boardApi.createPost(formData);
        showSuccess('게시글이 등록되었습니다.');
      }

      onClose(true); // 새로고침 플래그
    } catch (error) {
      console.error('게시글 저장 실패:', error);
      showError(error.response?.data?.detail || '게시글 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {isViewMode && '게시글 상세'}
            {isEditMode && '게시글 수정'}
            {isCreateMode && '게시글 작성'}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 바디 */}
        <div className="flex-1 overflow-y-auto p-6">
          {isViewMode ? (
            // 조회 모드
            <div className="space-y-4">
              {/* 메타 정보 */}
              <div className="flex items-center gap-4 text-sm text-gray-600 pb-4 border-b">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.createdAt).toLocaleString('ko-KR')}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.viewCount}
                </span>
                <span>작성자: {post.authorName}</span>
              </div>

              {/* 뱃지 */}
              <div className="flex gap-2">
                {post.isNotice && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                    공지사항
                  </span>
                )}
                {post.isPopup && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-semibold rounded-full">
                    팝업
                  </span>
                )}
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  {post.postType === 'notice' && '공지'}
                  {post.postType === 'general' && '일반'}
                  {post.postType === 'manual' && '메뉴얼'}
                  {post.postType === 'resource' && '자료실'}
                </span>
              </div>

              {/* 제목 */}
              <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>

              {/* 내용 */}
              <div className="prose max-w-none bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                {post.content}
              </div>

              {/* 첨부파일 */}
              {post.attachments && post.attachments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">첨부파일 ({post.attachments.length})</h3>
                  {post.attachments.map((attachment) => (
                    <div key={attachment.id} className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Download className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {attachment.fileName}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({(attachment.fileSize / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <a
                          href={attachment.fileUrl}
                          download={attachment.fileName}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          다운로드
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // 작성/수정 모드
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="제목을 입력하세요"
                  required
                />
              </div>

              {/* 게시글 타입 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  게시글 타입
                </label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">일반</option>
                  <option value="notice">공지사항</option>
                  <option value="manual">메뉴얼</option>
                  <option value="resource">자료실</option>
                </select>
              </div>

              {/* 옵션 */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNotice}
                    onChange={(e) => setIsNotice(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">공지사항으로 등록</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopup}
                    onChange={(e) => setIsPopup(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">대시보드 팝업으로 표시</span>
                </label>
              </div>

              {/* 팝업 기간 */}
              {isPopup && (
                <div className="grid grid-cols-2 gap-4 bg-orange-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      팝업 시작일
                    </label>
                    <input
                      type="date"
                      value={popupStartDate}
                      onChange={(e) => setPopupStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      팝업 종료일
                    </label>
                    <input
                      type="date"
                      value={popupEndDate}
                      onChange={(e) => setPopupEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="내용을 입력하세요"
                  required
                />
              </div>

              {/* 파일 첨부 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  파일 첨부 (다중 선택 가능)
                </label>

                {/* 기존 파일 목록 (수정 모드) */}
                {isEditMode && post?.attachments && post.attachments.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <p className="text-xs text-gray-500">기존 첨부파일</p>
                    {post.attachments
                      .filter(att => !removeAttachmentIds.includes(att.id))
                      .map((attachment) => (
                        <div key={attachment.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Download className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">{attachment.fileName}</span>
                            <span className="text-xs text-gray-500">
                              ({(attachment.fileSize / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingFile(attachment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {/* 새로 추가할 파일 목록 */}
                {files.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <p className="text-xs text-gray-500">새로 추가할 파일</p>
                    {files.map((file, index) => (
                      <div key={index} className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewFile(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 파일 선택 버튼 */}
                <div className="relative">
                  <input
                    type="file"
                    multiple={true}
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept="*/*"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">
                        파일 추가 (여러 개 선택 가능, 최대 10MB/개)
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      파일 선택창에서 Ctrl(Cmd) 또는 Shift 키를 누른 채 여러 파일 클릭
                    </span>
                  </label>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => onClose(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? '저장 중...' : isEditMode ? '수정' : '등록'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardPostModal;
