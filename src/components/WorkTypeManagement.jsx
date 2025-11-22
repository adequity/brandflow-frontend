import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings, Eye, EyeOff } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from './ui/ConfirmModal';

const WorkTypeManagement = ({ loggedInUser }) => {
  const { showSuccess, showError, showWarning } = useToast();
  const [workTypes, setWorkTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, workType: null });
  const [toggleConfirm, setToggleConfirm] = useState({ isOpen: false, workType: null });

  const fetchWorkTypes = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 WorkTypeManagement JWT: API 호출 시작 - /api/work-types');
      console.log('📋 loggedInUser 상태:', loggedInUser);

      // JWT 기반 API 호출 (파라미터 없이, Authorization 헤더만 사용)
      const response = await api.get('/api/work-types');
      console.log('✅ WorkTypeManagement JWT: API 호출 성공', response.data);

      // 백엔드 snake_case를 프론트엔드 camelCase로 변환
      const workTypesData = (response.data || []).map(wt => ({
        id: wt.id,
        name: wt.name,
        description: wt.description,
        isActive: wt.is_active,  // snake_case → camelCase
        sortOrder: wt.sortOrder || wt.sort_order || 0,
        createdAt: wt.created_at || wt.createdAt,
        updatedAt: wt.updated_at || wt.updatedAt
      }));

      setWorkTypes(workTypesData);
    } catch (error) {
      console.error('업무타입 목록 로딩 실패:', error);
      showError('업무타입 목록을 불러오는데 실패했습니다.');
      setWorkTypes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkTypes();
  }, [loggedInUser]);

  const handleCreateWorkType = async (workTypeData) => {
    try {
      console.log('📝 새 업무타입 생성 시작 (JWT):', workTypeData);
      console.log('📝 loggedInUser:', loggedInUser);

      // JWT 기반 API 호출 (파라미터 없이, Authorization 헤더만 사용)
      const response = await api.post('/api/work-types', workTypeData);

      showSuccess('업무타입이 생성되었습니다.');
      fetchWorkTypes();
      setCreateModalOpen(false);
    } catch (error) {
      console.error('업무타입 생성 실패:', error);
      const message = error.response?.data?.detail || error.response?.data?.message || '업무타입 생성에 실패했습니다.';
      showError(message);
    }
  };

  const handleUpdateWorkType = async (workTypeId, workTypeData) => {
    try {
      console.log('📝 업무타입 수정 시작 (JWT):', workTypeId, workTypeData);

      // JWT 기반 API 호출 (파라미터 없이, Authorization 헤더만 사용)
      const response = await api.put(`/api/work-types/${workTypeId}`, workTypeData);

      showSuccess('업무타입이 수정되었습니다.');
      fetchWorkTypes();
      setEditModalOpen(false);
      setSelectedWorkType(null);
    } catch (error) {
      console.error('업무타입 수정 실패:', error);
      const message = error.response?.data?.detail || error.response?.data?.message || '업무타입 수정에 실패했습니다.';
      showError(message);
    }
  };

  const handleDeleteWorkType = async (workType) => {
    setDeleteConfirm({ isOpen: true, workType });
  };

  const confirmDelete = async () => {
    const workType = deleteConfirm.workType;
    if (!workType) return;

    try {
      console.log('📝 업무타입 삭제 시작 (JWT):', workType.id);

      // JWT 기반 API 호출 (파라미터 없이, Authorization 헤더만 사용)
      await api.delete(`/api/work-types/${workType.id}`);

      showSuccess('업무타입이 비활성화되었습니다.');
      fetchWorkTypes();
      setDeleteConfirm({ isOpen: false, workType: null });
    } catch (error) {
      console.error('업무타입 삭제 실패:', error);
      const message = error.response?.data?.detail || error.response?.data?.message || '업무타입 삭제에 실패했습니다.';
      showError(message);
    }
  };

  const handleToggleActive = async (workType) => {
    setToggleConfirm({ isOpen: true, workType });
  };

  const confirmToggleActive = async () => {
    const workType = toggleConfirm.workType;
    if (!workType) return;

    try {
      // 백엔드에 snake_case로 전송
      await api.put(`/api/work-types/${workType.id}`, {
        is_active: !workType.isActive  // camelCase → snake_case
      }, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });

      showSuccess(`업무타입이 ${workType.isActive ? '비활성' : '활성'}화되었습니다.`);
      fetchWorkTypes();
      setToggleConfirm({ isOpen: false, workType: null });
    } catch (error) {
      console.error('업무타입 상태 변경 실패:', error);
      const message = error.response?.data?.message || '업무타입 상태 변경에 실패했습니다.';
      showError(message);
    }
  };

  // 권한 체크
  const canManage = loggedInUser?.role === 'SUPER_ADMIN' || loggedInUser?.role === 'AGENCY_ADMIN';

  if (!canManage) {
    return (
      <div className="p-4 md:p-6 text-center">
        <div className="text-gray-500">
          <Settings size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-sm md:text-base">업무타입 관리는 어드민만 가능합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 md:mb-6">
        <div className="flex-1">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">업무타입 관리</h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">업무 등록 시 사용할 업무타입을 관리합니다</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px] touch-manipulation text-sm md:text-base whitespace-nowrap"
        >
          <Plus size={16} className="md:w-[18px] md:h-[18px]" />
          <span>새 업무타입 추가</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-left text-gray-500">
              <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                <tr>
                  <th className="px-3 md:px-6 py-2 md:py-3">이름</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 hidden sm:table-cell">설명</th>
                  <th className="px-3 md:px-6 py-2 md:py-3">상태</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 hidden md:table-cell">정렬순서</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 hidden lg:table-cell">생성일</th>
                  <th className="px-3 md:px-6 py-2 md:py-3">관리</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(workTypes) ? workTypes : []).map((workType) => (
                  <tr key={workType.id} className="bg-white border-b hover:bg-gray-50 touch-manipulation">
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="font-medium text-gray-900 text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{workType.name}</div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 hidden sm:table-cell">
                      <div className="text-gray-500 text-xs md:text-sm truncate max-w-[150px] md:max-w-none">{workType.description || '-'}</div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <button
                        onClick={() => handleToggleActive(workType)}
                        className={`flex items-center space-x-1 px-2 md:px-3 py-1 md:py-1 rounded-full text-xs font-medium min-h-[36px] touch-manipulation ${
                          workType.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {workType.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{workType.isActive ? '활성' : '비활성'}</span>
                      </button>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 hidden md:table-cell">
                      <div className="text-gray-500 text-xs md:text-sm">{workType.sortOrder}</div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 hidden lg:table-cell">
                      <div className="text-gray-500 text-xs md:text-sm whitespace-nowrap">
                        {workType.createdAt ? new Date(workType.createdAt).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="flex items-center space-x-1 md:space-x-2">
                        <button
                          onClick={() => {
                            setSelectedWorkType(workType);
                            setEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
                          title="수정"
                        >
                          <Edit size={14} className="md:w-4 md:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkType(workType)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
                          title="비활성화"
                        >
                          <Trash2 size={14} className="md:w-4 md:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {workTypes.length === 0 && (
            <div className="text-center py-12">
              <Settings size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">등록된 업무타입이 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 생성 모달 */}
      {isCreateModalOpen && (
        <WorkTypeModal
          onSave={handleCreateWorkType}
          onClose={() => setCreateModalOpen(false)}
        />
      )}

      {/* 수정 모달 */}
      {isEditModalOpen && selectedWorkType && (
        <WorkTypeModal
          workType={selectedWorkType}
          onSave={(data) => handleUpdateWorkType(selectedWorkType.id, data)}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedWorkType(null);
          }}
        />
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, workType: null })}
        onConfirm={confirmDelete}
        title="업무타입 비활성화"
        message={`정말로 '${deleteConfirm.workType?.name}' 업무타입을 비활성화하시겠습니까?`}
        type="warning"
        confirmText="비활성화"
        cancelText="취소"
      />

      {/* 상태 변경 확인 모달 */}
      <ConfirmModal
        isOpen={toggleConfirm.isOpen}
        onClose={() => setToggleConfirm({ isOpen: false, workType: null })}
        onConfirm={confirmToggleActive}
        title={`업무타입 ${toggleConfirm.workType?.isActive ? '비활성' : '활성'}화`}
        message={`'${toggleConfirm.workType?.name}' 업무타입을 ${toggleConfirm.workType?.isActive ? '비활성' : '활성'}화하시겠습니까?`}
        type="info"
        confirmText={toggleConfirm.workType?.isActive ? '비활성화' : '활성화'}
        cancelText="취소"
      />
    </div>
  );
};

// 업무타입 생성/수정 모달
const WorkTypeModal = ({ workType, onSave, onClose }) => {
  const { showWarning } = useToast();
  const [formData, setFormData] = useState({
    name: workType?.name || '',
    description: workType?.description || '',
    sortOrder: workType?.sortOrder || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showWarning('업무타입 이름을 입력해주세요.');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">
          {workType ? '업무타입 수정' : '새 업무타입 추가'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              업무타입 이름 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[44px] text-base"
              placeholder="예: SNS 마케팅"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[88px] text-base"
              rows="3"
              placeholder="업무타입에 대한 설명을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              정렬 순서
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[44px] text-base"
              min="0"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-2 pt-3 md:pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 md:py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 min-h-[44px] touch-manipulation text-sm md:text-base"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px] touch-manipulation text-sm md:text-base"
            >
              {workType ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkTypeManagement;