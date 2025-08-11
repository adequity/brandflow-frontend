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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">고객사 및 사용자 관리</h2>
        <button
          onClick={() => handleOpenEditModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          <span>새 사용자 추가</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
            <tr>
              <th className="px-6 py-3">이름</th>
              <th className="px-6 py-3">ID (이메일)</th>
              <th className="px-6 py-3">연락처</th>
              <th className="px-6 py-3">소속</th>
              <th className="px-6 py-3">등급</th>
              <th className="px-6 py-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                <th className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{user.name}</th>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.contact}</td>
                <td className="px-6 py-4">{user.company}</td>
                <td className="px-6 py-4">{user.role}</td>
                <td className="px-6 py-4">
                  {(loggedInUser?.role === '슈퍼 어드민' || user.role !== '슈퍼 어드민') && (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(user)}
                        className="text-gray-400 hover:text-red-600"
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
