import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, CheckCircle } from 'lucide-react';

const BulkLinkRegisterModal = ({ posts, onSave, onClose }) => {
    const [linkData, setLinkData] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // 초기 데이터 설정 (기존 결과물이 있으면 표시)
        const initialData = {};
        posts.forEach(post => {
            initialData[post.id] = post.publishedUrl || '';
        });
        setLinkData(initialData);
    }, [posts]);

    const handleLinkChange = (postId, value) => {
        setLinkData(prev => ({
            ...prev,
            [postId]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 입력된 결과물만 필터링
            const updates = Object.entries(linkData)
                .filter(([postId, url]) => url && url.trim())
                .map(([postId, url]) => ({
                    postId: parseInt(postId),
                    publishedUrl: url.trim()
                }));

            if (updates.length === 0) {
                alert('최소 1개 이상의 결과물 링크를 입력해주세요.');
                setSaving(false);
                return;
            }

            await onSave(updates);
        } catch (error) {
            console.error('결과물 저장 실패:', error);
            alert('결과물 저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const filledCount = Object.values(linkData).filter(url => url && url.trim()).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <LinkIcon className="text-green-600" size={28} />
                            다중 결과물 등록
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            선택한 {posts.length}개 업무의 결과물을 한 번에 등록하세요
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        disabled={saving}
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* 진행 상태 표시 */}
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                            입력 완료: <span className="font-bold text-blue-600">{filledCount}</span> / {posts.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-48 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                                    style={{ width: `${(filledCount / posts.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-gray-600 font-medium">
                                {Math.round((filledCount / posts.length) * 100)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* 업무 리스트 */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                        {posts.map((post, index) => (
                            <div
                                key={post.id}
                                className={`border rounded-xl p-4 transition-all ${
                                    linkData[post.id]?.trim()
                                        ? 'border-green-300 bg-green-50/30'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* 순서 번호 */}
                                    <div className="flex-shrink-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                            linkData[post.id]?.trim()
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            {linkData[post.id]?.trim() ? (
                                                <CheckCircle size={18} />
                                            ) : (
                                                index + 1
                                            )}
                                        </div>
                                    </div>

                                    {/* 업무 정보 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {post.workType || '블로그'}
                                                    </span>
                                                    {post.publishedUrl && (
                                                        <span className="text-xs text-green-600 font-medium">
                                                            기존 결과물 있음
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                                                    {post.title || '제목 없음'}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* 결과물 URL 입력 */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-gray-700">
                                                결과물 링크 URL
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 relative">
                                                    <LinkIcon
                                                        size={16}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                    />
                                                    <input
                                                        type="url"
                                                        value={linkData[post.id] || ''}
                                                        onChange={(e) => handleLinkChange(post.id, e.target.value)}
                                                        placeholder="https://example.com/post"
                                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        disabled={saving}
                                                    />
                                                </div>
                                                {linkData[post.id]?.trim() && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleLinkChange(post.id, '')}
                                                        className="px-3 py-2.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        disabled={saving}
                                                    >
                                                        지우기
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 푸터 */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            {filledCount > 0 ? (
                                <span className="text-green-600 font-medium">
                                    ✓ {filledCount}개의 결과물을 저장할 준비가 되었습니다
                                </span>
                            ) : (
                                <span>최소 1개 이상의 결과물 링크를 입력해주세요</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                disabled={saving}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={filledCount === 0 || saving}
                                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl"
                            >
                                {saving ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        저장 중...
                                    </span>
                                ) : (
                                    `${filledCount}개 결과물 저장`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkLinkRegisterModal;
