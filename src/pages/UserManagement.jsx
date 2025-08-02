import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2 } from 'lucide-react';

// 분리된 모달 컴포넌트들을 import
import UserEditModal from '../components/modals/UserEditModal';
import UserDeleteModal from '../components/modals/UserDeleteModal';

// StatusBadge는 이 페이지에서만 사용되므로 여기에 둡니다.
const StatusBadge = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full inline-block";
    const statusStyles = { '활성': 'bg-green-100 text-green-800', '비활성': 'bg-gray-100 text-gray-800' };
    return <span className={`${baseClasses} ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const UserManagement = ({ initialUsers }) => {
    const [users, setUsers] = useState(initialUsers);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const handleOpenModal = (user = null) => {
        setCurrentUser(user);
        setModalOpen(true);
    };
    const handleOpenDeleteModal = (user) => {
        setCurrentUser(user);
        setDeleteModalOpen(true);
    };
    const handleSaveUser = async (userData) => {
        try {
            if (currentUser) {
                const response = await axios.put(`http://localhost:5000/api/users/${currentUser.id}`, userData);
                setUsers(users.map(u => u.id === currentUser.id ? response.data : u));
            } else {
                const response = await axios.post('http://localhost:5000/api/users', userData);
                setUsers([...users, response.data]);
            }
            setModalOpen(false);
            setCurrentUser(null);
        } catch (err) {
            alert('사용자 저장에 실패했습니다.');
        }
    };
    const handleDeleteUser = async () => {
        try {
            await axios.delete(`http://localhost:5000/api/users/${currentUser.id}`);
            setUsers(users.filter(u => u.id !== currentUser.id));
            setDeleteModalOpen(false);
            setCurrentUser(null);
        } catch (err) {
            alert('사용자 삭제에 실패했습니다.');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">고객사 및 사용자 관리</h2>
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus size={18} /><span>새 사용자 추가</span>
                </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-3">이름</th>
                            <th scope="col" className="px-6 py-3">ID (이메일)</th>
                            <th scope="col" className="px-6 py-3">연락처</th>
                            <th scope="col" className="px-6 py-3">소속</th>
                            <th scope="col" className="px-6 py-3">등급</th>
                            <th scope="col" className="px-6 py-3">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{user.name}</th>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">{user.contact}</td>
                                <td className="px-6 py-4">{user.company}</td>
                                <td className="px-6 py-4">{user.role}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => handleOpenModal(user)} className="text-gray-400 hover:text-blue-600"><Edit size={16} /></button>
                                        <button onClick={() => handleOpenDeleteModal(user)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <UserEditModal user={currentUser} onSave={handleSaveUser} onClose={() => setModalOpen(false)} />}
            {isDeleteModalOpen && <UserDeleteModal user={currentUser} onConfirm={handleDeleteUser} onClose={() => setDeleteModalOpen(false)} />}
        </div>
    );
};

export default UserManagement;