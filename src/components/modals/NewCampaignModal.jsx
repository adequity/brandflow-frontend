import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/client';

const NewCampaignModal = ({ users, onSave, onClose }) => {
    const [campaignName, setCampaignName] = useState('');
    
    // 담당자(관리자) 목록 필터링
    const adminUsers = users.filter(u => u.role !== '클라이언트');
    // 담당자의 이름이 아닌 ID를 상태로 관리합니다.
    const [UserId, setUserId] = useState(adminUsers[0]?.id || '');
    
    // 클라이언트 검색 기능 관련 state
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isClientListOpen, setClientListOpen] = useState(false);
    const [clientUsers, setClientUsers] = useState([]);
    
    const searchRef = useRef(null);

    // 클라이언트 목록 로드
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const { data } = await api.get('/api/users/clients');
                setClientUsers(data || []);
            } catch (error) {
                console.error('클라이언트 목록 로드 실패:', error);
                setClientUsers([]);
            }
        };

        fetchClients();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setClientListOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchRef]);

    const handleClientSearchChange = (e) => {
        const term = e.target.value;
        setClientSearchTerm(term);
        setSelectedClient(null);

        if (term) {
            setClientListOpen(true);
            setSearchResults(
                clientUsers.filter(user =>
                    user.name.toLowerCase().includes(term.toLowerCase()) ||
                    (user.company && user.company.toLowerCase().includes(term.toLowerCase()))
                )
            );
        } else {
            setClientListOpen(false);
            setSearchResults([]);
        }
    };

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setClientSearchTerm(`${client.name} (${client.company})`);
        setClientListOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedClient) {
            alert('캠페인을 할당할 클라이언트를 선택해주세요.');
            return;
        }
        if (!UserId) {
            alert('캠페인 담당자를 선택해주세요.');
            return;
        }
        onSave({
            name: campaignName,
            clientName: selectedClient.name,
            clientId: selectedClient.id,
            UserId: UserId // 담당자의 ID를 전달합니다.
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-6">새 캠페인 생성</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">캠페인명</label>
                        <input 
                            type="text" 
                            name="name" 
                            id="name" 
                            value={campaignName} 
                            onChange={(e) => setCampaignName(e.target.value)} 
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" 
                            required 
                        />
                    </div>
                    
                    <div className="relative" ref={searchRef}>
                        <label htmlFor="client" className="block text-sm font-medium text-gray-700">클라이언트</label>
                        <input 
                            type="text" 
                            name="client" 
                            id="client" 
                            value={clientSearchTerm} 
                            onChange={handleClientSearchChange}
                            onFocus={() => setClientListOpen(true)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" 
                            placeholder="클라이언트 이름 또는 회사명 검색"
                            required 
                            autoComplete="off"
                        />
                        {isClientListOpen && searchResults.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                {searchResults.map(client => (
                                    <li 
                                        key={client.id} 
                                        onClick={() => handleSelectClient(client)}
                                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                    >
                                        {client.name} ({client.company})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div>
                        <label htmlFor="User" className="block text-sm font-medium text-gray-700">담당자</label>
                        <select 
                            name="User" 
                            id="User" 
                            value={UserId} // value를 UserId로 변경
                            onChange={(e) => setUserId(e.target.value)} // setUserId로 변경
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md"
                        >
                            <option value="">담당자 선택</option>
                            {adminUsers.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">취소</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">생성</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewCampaignModal;