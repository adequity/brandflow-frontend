// src/pages/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { Plus, Edit, Trash2 } from 'lucide-react';

import UserEditModal from '../components/modals/UserEditModal';
import UserDeleteModal from '../components/modals/UserDeleteModal';

const UserManagement = ({ loggedInUser }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' or 'clients'

  // 사용자 목록 조회 (테넌트/권한 분리용 파라미터 포함)
  const fetchUsers = useCallback(async () => {
    if (!loggedInUser?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await api.get('/api/users', {
        params: {
          adminId: loggedInUser.id,
          adminRole: loggedInUser.role,
        },
      });
      setUsers(data || []);
    } catch (error) {
      console.error('사용자 목록 로딩 실패:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [loggedInUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
      if (currentUser) {
        // 수정
        await api.put(`/api/users/${currentUser.id}`, {
          ...userData,
          adminId: loggedInUser.id,
          adminRole: loggedInUser.role,
        });
      } else {
        // 생성
        await api.post('/api/users', {
          ...userData,
          creatorId: loggedInUser.id,
          adminRole: loggedInUser.role,
        });
      }
      await fetchUsers();
      setEditModalOpen(false);
      setCurrentUser(null);
    } catch (err) {
      alert(err?.response?.data?.message || '사용자 저장에 실패했습니다.');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/api/users/${currentUser.id}`, {
        data: {
          adminId: loggedInUser.id,
          adminRole: loggedInUser.role,
        },
      });
      await fetchUsers();
      setDeleteModalOpen(false);
      setCurrentUser(null);
    } catch (err) {
      alert(err?.response?.data?.message || '사용자 삭제에 실패했습니다.');
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

  const currentUsers = activeTab === 'staff' ? staffUsers : clientUsers;

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
    // 최근 활동 기준으로 상태 판단 (임시)
    const isActive = user.updatedAt && 
      new Date(user.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return isActive ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        활성
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
        비활성
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">팀 & 사용자 관리</h2>
          <p className="text-gray-600 mt-1">팀원과 클라이언트를 관리하세요</p>
        </div>
        <button
          onClick={() => handleOpenEditModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>{activeTab === 'staff' ? '팀원 초대' : '클라이언트 추가'}</span>
        </button>
      </div>

      {/* 요약 통계 */}
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

      {/* 탭 네비게이션 */}
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
