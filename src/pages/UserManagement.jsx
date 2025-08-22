// src/pages/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import UserEditModal from '../components/modals/UserEditModal';
import UserDeleteModal from '../components/modals/UserDeleteModal';

const UserManagement = ({ loggedInUser }) => {
  const { showSuccess, showError, showWarning } = useToast();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(loggedInUser?.role === '직원' ? 'clients' : 'staff'); // 'staff' or 'clients'
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, user: null });

  // 사용자 목록 조회 (테넌트/권한 분리용 파라미터 포함)
  const fetchUsers = useCallback(async () => {
    if (!loggedInUser?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Django API에서 사용자 데이터 가져오기
      const response = await api.get('/api/users/');
      const usersData = response.data.results || response.data;
      
      // Express API 응답을 프론트엔드 형식에 맞게 변환
      const transformedUsers = usersData.map(user => ({
        id: user.id,
        name: user.name || user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email,
        role: user.role || '클라이언트', // Express API에서는 이미 한글로 변환되어 옴
        company: user.company || '',
        contact: user.contact || '',
        incentiveRate: parseFloat(user.incentiveRate || user.incentive_rate || 0),
        isActive: user.isActive !== undefined ? user.isActive : user.is_active !== undefined ? user.is_active : true,
        agencyAdminId: user.agencyAdminId || user.agency_admin,
        createdAt: user.createdAt || user.created_at,
        updatedAt: user.updatedAt || user.updated_at,
        lastLogin: user.lastLogin || user.last_login
      }));
      
      console.log('UserManagement - 사용자 목록 로드됨:', transformedUsers);
      setUsers(transformedUsers);
    } catch (error) {
      console.error('사용자 목록 로딩 실패:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [loggedInUser]);

  useEffect(() => {
    fetchUsers();
  }, [loggedInUser?.id]);

  const handleOpenEditModal = (user = null) => {
    setCurrentUser(user);
    setEditModalOpen(true);
  };

  const handleOpenDeleteModal = (user) => {
    setCurrentUser(user);
    setDeleteModalOpen(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      console.log('handleSaveUser called with userData:', userData);
      console.log('loggedInUser:', loggedInUser);
      
      // 프론트엔드 데이터를 백엔드 형식으로 변환
      const apiData = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        company: userData.company || ((loggedInUser?.role === '직원' || loggedInUser?.role === '대행사 어드민') ? loggedInUser.company : ''),
        contact: userData.contact,
        incentiveRate: userData.incentiveRate || 0
      };
      
      if (userData.password) {
        apiData.password = userData.password;
      }
      
      if (currentUser) {
        // 사용자 수정
        await api.put(`/api/users/${currentUser.id}`, apiData);
        showSuccess('사용자가 수정되었습니다!');
      } else {
        // 사용자 생성
        console.log('Sending API data:', JSON.stringify(apiData, null, 2));
        const response = await api.post('/api/users', apiData);
        console.log('API response:', response.data);
        showSuccess('사용자가 생성되었습니다!');
      }
      await fetchUsers();
      setEditModalOpen(false);
      setCurrentUser(null);
    } catch (err) {
      console.error('사용자 저장 실패:', err);
      console.error('Error response data:', err?.response?.data);
      console.error('Error status:', err?.response?.status);
      const errorMessage = err?.response?.data?.email?.[0] || 
                          err?.response?.data?.username?.[0] || 
                          err?.response?.data?.detail || 
                          JSON.stringify(err?.response?.data) ||
                          '작업에 실패했습니다.';
      showError(errorMessage);
    }
  };

  const handleDeleteUser = async () => {
    try {
      // Django API로 사용자 삭제
      await api.delete(`/api/users/${currentUser.id}/`);
      showSuccess('사용자가 삭제되었습니다!');
      await fetchUsers();
      setDeleteModalOpen(false);
      setCurrentUser(null);
    } catch (err) {
      console.error('사용자 삭제 실패:', err);
      showError(err?.response?.data?.message || '사용자 삭제에 실패했습니다.');
    }
  };

  if (isLoading) {
    return <div className="p-6">사용자 목록을 불러오는 중...</div>;
  }

  // 사용자 필터링
  const staffUsers = users.filter(user => 
    user.role === '대행사 어드민' || 
    user.role === '슈퍼 어드민' ||
    user.role === '직원'
  );
  const clientUsers = users.filter(user => user.role === '클라이언트');

  const currentUsers = loggedInUser?.role === '직원' ? clientUsers : (activeTab === 'staff' ? staffUsers : clientUsers);

  const getRoleColor = (role) => {
    switch(role) {
      case '슈퍼 어드민': return 'bg-purple-100 text-purple-800';
      case '대행사 어드민': return 'bg-blue-100 text-blue-800';  
      case '직원': return 'bg-green-100 text-green-800';
      case '클라이언트': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserStatusBadge = (user) => {
    // Django의 is_active 필드를 우선적으로 확인
    if (user.isActive === false) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          비활성화됨
        </span>
      );
    }
    
    // 최근 로그인 또는 업데이트 기준으로 활동 상태 판단
    const lastActivity = user.lastLogin || user.updatedAt;
    const isRecentlyActive = lastActivity && 
      new Date(lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30일
    
    return isRecentlyActive ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        활성
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
        휴면
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {loggedInUser?.role === '직원' ? '클라이언트 관리' : '팀 & 사용자 관리'}
          </h2>
          <p className="text-gray-600 mt-1">
            {loggedInUser?.role === '직원' ? '클라이언트를 관리하세요' : '팀원과 클라이언트를 관리하세요'}
          </p>
        </div>
        <button
          onClick={() => handleOpenEditModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>{loggedInUser?.role === '직원' ? '클라이언트 추가' : (activeTab === 'staff' ? '팀원 초대' : '클라이언트 추가')}</span>
        </button>
      </div>

      {/* 요약 통계 */}
      {loggedInUser?.role === '직원' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">관리 중인 클라이언트</p>
                <p className="text-2xl font-bold text-orange-600">{clientUsers.length}</p>
              </div>
              <div className="text-orange-400">🤝</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">본인 소속</p>
                <p className="text-lg font-bold text-gray-800">{loggedInUser?.company}</p>
              </div>
              <div className="text-gray-400">🏢</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 팀원</p>
                <p className="text-2xl font-bold text-blue-600">{staffUsers.length}</p>
              </div>
              <div className="text-blue-400">👥</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">활성 클라이언트</p>
                <p className="text-2xl font-bold text-orange-600">{clientUsers.length}</p>
              </div>
              <div className="text-orange-400">🤝</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 사용자</p>
                <p className="text-2xl font-bold text-gray-800">{users.length}</p>
              </div>
              <div className="text-gray-400">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* 탭 네비게이션 - 직원은 숨김 */}
      {loggedInUser?.role !== '직원' && (
        <div className="bg-white p-1 rounded-xl border border-gray-200 inline-flex">
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'staff' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            👥 팀원 관리 ({staffUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'clients' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            🤝 클라이언트 ({clientUsers.length})
          </button>
        </div>
      )}

      {/* 사용자 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {currentUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">
              {activeTab === 'staff' ? '👥' : '🤝'}
            </div>
            <p className="text-gray-500 mb-4">
              {activeTab === 'staff' ? '등록된 팀원이 없습니다.' : '등록된 클라이언트가 없습니다.'}
            </p>
            <button
              onClick={() => handleOpenEditModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {activeTab === 'staff' ? '첫 팀원 초대하기' : '첫 클라이언트 추가하기'}
            </button>
          </div>
        ) : (
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
              <tr>
                <th className="px-6 py-3">사용자 정보</th>
                <th className="px-6 py-3">연락처</th>
                <th className="px-6 py-3">소속/역할</th>
                {activeTab === 'staff' && <th className="px-6 py-3">인센티브율</th>}
                <th className="px-6 py-3">상태</th>
                <th className="px-6 py-3">가입일</th>
                <th className="px-6 py-3">관리</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{user.contact || '-'}</td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-gray-900">{user.company}</div>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </td>
                  {activeTab === 'staff' && (
                    <td className="px-6 py-4">
                      {(user.role === '직원' || user.role === '대행사 어드민') ? (
                        <span className="text-sm font-medium text-blue-600">
                          {user.incentiveRate || 0}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4">{getUserStatusBadge(user)}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      // 슈퍼 어드민은 모든 계정 관리 가능
                      if (loggedInUser?.role === '슈퍼 어드민') return true;
                      
                      // 대행사 어드민은 슈퍼 어드민 제외하고 관리 가능
                      if (loggedInUser?.role === '대행사 어드민' && user.role !== '슈퍼 어드민') return true;
                      
                      // 그 외에는 관리 불가
                      return false;
                    })() && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="편집"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(user)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isEditModalOpen && (
        <UserEditModal
          user={currentUser}
          onSave={handleSaveUser}
          onClose={() => setEditModalOpen(false)}
          loggedInUser={loggedInUser}
        />
      )}
      {isDeleteModalOpen && (
        <UserDeleteModal
          user={currentUser}
          onConfirm={handleDeleteUser}
          onClose={() => setDeleteModalOpen(false)}
        />
      )}
    </div>
  );
};

export default UserManagement;
