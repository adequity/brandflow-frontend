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
    if (!loggedInUser?.id) return;
    
    setIsLoading(true);
    try {
      const response = await api.get('/work-types/manage', {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });
      setWorkTypes(response.data || []);
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
      const response = await api.post('/work-types', {
        ...workTypeData,
        viewerId: loggedInUser.id,
        viewerRole: loggedInUser.role
      }, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });
      
      showSuccess('업무타입이 생성되었습니다.');
      fetchWorkTypes();
      setCreateModalOpen(false);
    } catch (error) {
      console.error('업무타입 생성 실패:', error);
      const message = error.response?.data?.message || '업무타입 생성에 실패했습니다.';
      showError(message);
    }
  };

  const handleUpdateWorkType = async (workTypeId, workTypeData) => {
    try {
      const response = await api.put(`/work-types/${workTypeId}`, workTypeData, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });
      
      showSuccess('업무타입이 수정되었습니다.');
      fetchWorkTypes();
      setEditModalOpen(false);
      setSelectedWorkType(null);
    } catch (error) {
      console.error('업무타입 수정 실패:', error);
      const message = error.response?.data?.message || '업무타입 수정에 실패했습니다.';
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
      await api.delete(`/work-types/${workType.id}`, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });
      
      showSuccess('업무타입이 비활성화되었습니다.');
      fetchWorkTypes();
      setDeleteConfirm({ isOpen: false, workType: null });
    } catch (error) {
      console.error('업무타입 삭제 실패:', error);
      const message = error.response?.data?.message || '업무타입 삭제에 실패했습니다.';
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
      await api.put(`/work-types/${workType.id}`, {
        isActive: !workType.isActive
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
  const canManage = loggedInUser?.role === '슈퍼 어드민' || loggedInUser?.role === '대행사 어드민';

  if (!canManage) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">
          <Settings size={48} className="mx-auto mb-4 text-gray-300" />
          <p>업무타입 관리는 어드민만 가능합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">업무타입 관리</h2>
          <p className="text-gray-600 mt-1">업무 등록 시 사용할 업무타입을 관리합니다</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          <span>새 업무타입 추가</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
              <tr>
                <th className="px-6 py-3">이름</th>
                <th className="px-6 py-3">설명</th>
                <th className="px-6 py-3">상태</th>
                <th className="px-6 py-3">정렬순서</th>
                <th className="px-6 py-3">생성일</th>
                <th className="px-6 py-3">관리</th>
              </tr>
            </thead>
            <tbody>
              {workTypes.map((workType) => (
                <tr key={workType.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{workType.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-500">{workType.description || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(workType)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                        workType.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {workType.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>{workType.isActive ? '활성' : '비활성'}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-500">{workType.sortOrder}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-500">
                      {workType.createdAt ? new Date(workType.createdAt).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedWorkType(workType);
                          setEditModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="수정"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteWorkType(workType)}
                        className="text-red-600 hover:text-red-900"
                        title="비활성화"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">
          {workType ? '업무타입 수정' : '새 업무타입 추가'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              업무타입 이름 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="예: SNS 마케팅"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg"
              rows="3"
              placeholder="업무타입에 대한 설명을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              정렬 순서
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
              className="w-full p-2 border border-gray-300 rounded-lg"
              min="0"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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