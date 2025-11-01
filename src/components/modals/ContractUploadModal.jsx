import React, { useState } from 'react';
import { X, Upload, File, Trash2, Download } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

const ContractUploadModal = ({ campaign, onClose, onSave }) => {
  const { showSuccess, showError } = useToast();
  const [uploading, setUploading] = useState(false);
  const [contracts, setContracts] = useState(campaign.contracts || []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError('파일 크기는 10MB를 초과할 수 없습니다.');
      e.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(
        `/api/campaigns/${campaign.id}/upload-contract`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const uploadedContract = response.data;
      setContracts([...contracts, uploadedContract]);
      showSuccess('계약서가 성공적으로 업로드되었습니다.');

      // 부모 컴포넌트에 업데이트 알림
      if (onSave) {
        onSave([...contracts, uploadedContract]);
      }

      e.target.value = '';
    } catch (error) {
      console.error('계약서 업로드 실패:', error);
      showError(error.response?.data?.detail || '계약서 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteContract = async (contractId) => {
    if (!window.confirm('정말 이 계약서를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await api.delete(`/api/campaigns/${campaign.id}/contracts/${contractId}`);

      const updatedContracts = contracts.filter(c => c.id !== contractId);
      setContracts(updatedContracts);
      showSuccess('계약서가 삭제되었습니다.');

      if (onSave) {
        onSave(updatedContracts);
      }
    } catch (error) {
      console.error('계약서 삭제 실패:', error);
      showError(error.response?.data?.detail || '계약서 삭제에 실패했습니다.');
    }
  };

  const handleDownload = (contract) => {
    window.open(contract.file_url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">계약서 관리</h2>
            <p className="text-sm text-gray-600 mt-1">{campaign.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* 파일 업로드 영역 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              계약서 업로드
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                <Upload size={20} className="mr-2 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {uploading ? '업로드 중...' : '파일 선택 (최대 10MB)'}
                </span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              지원 형식: PDF, Word, 이미지 (JPG, PNG)
            </p>
          </div>

          {/* 계약서 목록 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              업로드된 계약서 ({contracts.length})
            </h3>

            {contracts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <File size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">업로드된 계약서가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <File size={20} className="text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {contract.file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(contract.file_size / 1024).toFixed(1)} KB
                          {' · '}
                          {new Date(contract.uploaded_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownload(contract)}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="다운로드"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteContract(contract.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractUploadModal;
