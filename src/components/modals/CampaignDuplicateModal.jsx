import React, { useState, useEffect } from 'react';

const CampaignDuplicateModal = ({ duplicateData, onConfirm, onClose }) => {
  const [formData, setFormData] = useState({
    newName: '',
    startDate: '',
    endDate: '',
    budget: 0,
    staffId: null
  });

  useEffect(() => {
    if (duplicateData) {
      setFormData({
        newName: duplicateData.newName || '',
        startDate: duplicateData.startDate || '',
        endDate: duplicateData.endDate || '',
        budget: duplicateData.budget || 0,
        staffId: duplicateData.staffId || null
      });
    }
  }, [duplicateData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.newName.trim()) {
      alert('캠페인명을 입력해주세요.');
      return;
    }

    if (!formData.startDate) {
      alert('시작일을 선택해주세요.');
      return;
    }

    if (!formData.endDate) {
      alert('종료일을 선택해주세요.');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert('종료일은 시작일 이후여야 합니다.');
      return;
    }

    if (formData.budget < 0) {
      alert('예산은 0 이상이어야 합니다.');
      return;
    }

    // 확인 후 복사 실행
    onConfirm({
      original: duplicateData.original,
      newName: formData.newName,
      startDate: formData.startDate,
      endDate: formData.endDate,
      budget: formData.budget,
      staffId: formData.staffId
    });
  };

  if (!duplicateData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">캠페인 복사</h2>

        <form onSubmit={handleSubmit}>
          {/* 원본 캠페인 정보 표시 */}
          <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-600">원본 캠페인</p>
            <p className="font-medium">{duplicateData.original.name}</p>
          </div>

          {/* 새 캠페인명 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              새 캠페인명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.newName}
              onChange={(e) => setFormData({ ...formData, newName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="캠페인명 입력"
              maxLength={200}
            />
          </div>

          {/* 시작일 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시작일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 종료일 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              종료일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 예산 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              예산 (원) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="10000"
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              복사하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignDuplicateModal;
