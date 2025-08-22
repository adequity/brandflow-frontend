import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { canSelectClient, canSelectEmployee, ROLES, ROLE_MAPPING } from '../../utils/permissions';
import { useToast } from '../../contexts/ToastContext';

const NewCampaignModal = ({ users, onSave, onClose }) => {
    const { showSuccess, showError, showWarning } = useToast();
    const [campaignName, setCampaignName] = useState('');
    const [budget, setBudget] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState(null);
    
    // 숫자에 콤마 추가하는 함수
    const formatNumberWithCommas = (value) => {
        if (!value) return '';
        const numericValue = value.toString().replace(/[^0-9]/g, '');
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // 콤마 제거하고 숫자만 추출하는 함수
    const removeCommas = (value) => {
        return value.toString().replace(/,/g, '');
    };
    const [reminders, setReminders] = useState('');
    const [invoiceIssued, setInvoiceIssued] = useState(false);
    const [paymentCompleted, setPaymentCompleted] = useState(false);
    const [invoiceDueDate, setInvoiceDueDate] = useState('');
    const [paymentDueDate, setPaymentDueDate] = useState('');
    const [allUsers, setAllUsers] = useState(Array.isArray(users) ? users : (users?.results || []));
    
    // 현재 사용자 정보 가져오기
    let currentUser;
    try {
        currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('CurrentUser from localStorage:', currentUser);
    } catch (e) {
        console.error('localStorage user 파싱 오류:', e);
        currentUser = {};
    }
    
    // UserId state를 먼저 정의
    const [UserId, setUserId] = useState('');

    // 모달이 열릴 때 최신 사용자 목록 다시 로딩
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await api.get('/api/users', {
                    params: {
                        viewerId: currentUser.id,
                        viewerRole: currentUser.role
                    }
                });
                setAllUsers(Array.isArray(data) ? data : (data?.results || []));
                console.log('Latest users loaded:', data);
                
                // 직원 계정인 경우 사용자 목록 로드 후 기본값 재설정
                if (currentUser.role === '직원') {
                    setUserId(currentUser.id);
                }
            } catch (error) {
                console.error('사용자 목록 로딩 실패:', error);
                setAllUsers(users || []);
                
                // 실패해도 직원 계정인 경우 본인 ID 설정
                if (currentUser.role === '직원') {
                    setUserId(currentUser.id);
                }
            }
        };

        if (currentUser?.id) {
            fetchUsers();
        }
    }, [currentUser?.id, currentUser?.role]);
    
    // 직원 목록 필터링 - Express API 형식에 맞게 수정
    console.log('All users:', allUsers);
    console.log('Current user:', currentUser);
    
    const staffUsers = allUsers.filter(u => {
        console.log('Checking user:', u, 'role:', u.role);
        // Express에서 온 role을 한글로 매핑 (이미 한글인 경우 그대로 사용)
        const mappedRole = ROLE_MAPPING[u.role] || u.role;
        console.log('Mapped role:', mappedRole);
        
        // 직원 또는 대행사 어드민 역할만 선택 가능 (한글 role도 지원)
        if (mappedRole !== ROLES.EMPLOYEE && mappedRole !== ROLES.AGENCY_ADMIN && 
            u.role !== '직원' && u.role !== '대행사 어드민') return false;
        
        // 권한 체크를 위해 매핑된 role로 객체 생성
        const userWithMappedRole = { 
            ...u, 
            role: mappedRole,
            // Express API 형식에서는 name 필드를 first_name과 last_name으로 대체
            first_name: u.name || u.first_name || '',
            last_name: u.last_name || ''
        };
        return canSelectEmployee(currentUser, userWithMappedRole);
    })
    // Express API 형식에 맞게 데이터 변환
    .map(u => ({
        ...u,
        first_name: u.name || u.first_name || '',
        last_name: u.last_name || ''
    }));
    
    console.log('Filtered staff users:', staffUsers);
    
    // UserId 기본값 설정을 위한 useEffect
    useEffect(() => {
        if (currentUser.role === '직원') {
            setUserId(currentUser.id);
        } else if (currentUser.role === '대행사 어드민' && staffUsers.length > 0 && !UserId) {
            // 대행사 어드민은 초기에만 첫 번째 직원을 기본값으로 설정 (그 후 사용자가 자유롭게 변경 가능)
            setUserId(staffUsers[0]?.id || '');
        }
    }, [currentUser.role, staffUsers, UserId]);
    
    // 클라이언트 검색 기능 관련 state
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isClientListOpen, setClientListOpen] = useState(false);
    const [clientUsers, setClientUsers] = useState([]);
    
    const searchRef = useRef(null);

    // 클라이언트 목록 로드 - 권한에 따라 필터링
    useEffect(() => {
        const fetchClients = async () => {
            try {
                console.log('Fetching clients...');
                const { data } = await api.get('/api/users', {
                    params: {
                        viewerId: currentUser.id,
                        viewerRole: currentUser.role
                    }
                });
                console.log('All users data received:', data);
                
                // Express API에서 오는 데이터 형식에 맞게 수정
                const availableClients = (Array.isArray(data) ? data : (data?.results || []))
                    .filter(user => {
                        // Express에서 온 role을 한글로 매핑하여 비교 (이미 한글인 경우 그대로 사용)
                        const mappedRole = ROLE_MAPPING[user.role] || user.role;
                        return mappedRole === ROLES.CLIENT || user.role === '클라이언트';
                    })
                    .filter(client => {
                        // 권한 체크를 위해 client 객체에 매핑된 role 추가
                        const clientWithMappedRole = {
                            ...client,
                            role: ROLE_MAPPING[client.role] || client.role,
                            // Express API 형식에서는 name 필드를 first_name과 last_name으로 대체
                            first_name: client.name || client.first_name || '',
                            last_name: client.last_name || ''
                        };
                        return canSelectClient(currentUser, clientWithMappedRole);
                    })
                    // Express API 형식에 맞게 데이터 변환
                    .map(client => ({
                        ...client,
                        first_name: client.name || client.first_name || '',
                        last_name: client.last_name || ''
                    }));
                    
                console.log('Available clients after permission check:', availableClients);
                setClientUsers(availableClients);
            } catch (error) {
                console.error('클라이언트 목록 로드 실패:', error);
                setClientUsers([]);
            }
        };

        if (currentUser?.id) {
            fetchClients();
        }
    }, [currentUser?.id, currentUser?.role]);

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
                (clientUsers || []).filter(user => {
                    // Express API에서 name 필드를 사용하므로 두 방식 모두 지원
                    const fullName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
                    return fullName.toLowerCase().includes(term.toLowerCase()) ||
                           (user.company && user.company.toLowerCase().includes(term.toLowerCase()));
                })
            );
        } else {
            setClientListOpen(false);
            setSearchResults([]);
        }
    };

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        // Express API에서 name 필드를 사용하므로 두 방식 모두 지원
        const fullName = client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim();
        setClientSearchTerm(`${fullName} (${client.company || '회사명 없음'})`);
        setClientListOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        console.log('Form submit - campaignName:', campaignName);
        console.log('Form submit - selectedClient:', selectedClient);
        console.log('Form submit - UserId:', UserId);
        
        // 유효성 검사
        if (!campaignName.trim()) {
            showWarning('캠페인명을 입력해주세요.');
            return;
        }
        if (campaignName.trim().length < 2) {
            showWarning('캠페인명은 최소 2글자 이상 입력해주세요.');
            return;
        }
        if (!selectedClient) {
            showWarning('캠페인을 할당할 클라이언트를 선택해주세요.');
            return;
        }
        if (!UserId) {
            showWarning('캠페인 담당 직원을 선택해주세요.');
            return;
        }
        if (budget && parseFloat(removeCommas(budget)) < 0) {
            showWarning('매출은 0 이상의 값을 입력해주세요.');
            return;
        }
        if (invoiceDueDate && new Date(invoiceDueDate) < new Date()) {
            if (!confirm('계산서 발행 예정일이 과거 날짜입니다. 계속하시겠습니까?')) {
                return;
            }
        }
        if (paymentDueDate && new Date(paymentDueDate) < new Date()) {
            if (!confirm('입금 예정일이 과거 날짜입니다. 계속하시겠습니까?')) {
                return;
            }
        }
        
        // Express API에서 name 필드를 사용하므로 두 방식 모두 지원
        const clientFullName = selectedClient.name || `${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`.trim();
        const formData = {
            name: campaignName,
            clientName: clientFullName,
            clientId: selectedClient.id,
            UserId: UserId, // 담당자의 ID를 전달합니다.
            budget: budget ? parseFloat(removeCommas(budget)) : null,
            notes: notes || null,
            reminders: reminders || null,
            invoiceIssued: invoiceIssued,
            paymentCompleted: paymentCompleted,
            invoiceDueDate: invoiceDueDate || null,
            paymentDueDate: paymentDueDate || null
        };
        
        console.log('Submitting form data:', formData);
        onSave(formData);
    };

    // 렌더링 오류 방지를 위한 예외 처리
    if (!currentUser?.id) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-xl">
                    <p>사용자 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-xl">
                    <h3 className="text-xl font-bold mb-4 text-red-600">오류 발생</h3>
                    <p className="text-gray-700 mb-4">{error}</p>
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
                    >
                        닫기
                    </button>
                </div>
            </div>
        );
    }

    try {
        return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
                <h3 className="text-xl font-bold mb-6">새 캠페인 생성</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
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
                        {isClientListOpen && (searchResults || []).length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                {(searchResults || []).map(client => (
                                    <li 
                                        key={client.id} 
                                        onClick={() => handleSelectClient(client)}
                                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                    >
                                        {client.name || `${client.first_name} ${client.last_name}`} ({client.company || '회사명 없음'})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div>
                        <label htmlFor="User" className="block text-sm font-medium text-gray-700">직원</label>
                        {currentUser.role === '직원' ? (
                            // 직원 계정인 경우 본인만 표시하고 비활성화
                            <div className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-gray-700">
                                {currentUser.name || currentUser.first_name || 'Unknown'} ({currentUser.company}) - 본인
                            </div>
                        ) : (
                            // 관리자 계정인 경우 선택 가능
                            <select 
                                name="User" 
                                id="User" 
                                value={UserId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md"
                            >
                                <option value="">직원 선택</option>
                                {(staffUsers || []).map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name || `${user.first_name} ${user.last_name}`} ({user.company || '회사명 없음'})
                                    </option>
                                ))}
                            </select>
                        )}
                        {currentUser.role === '직원' && (
                            <p className="mt-1 text-xs text-blue-600">💡 직원 계정은 본인의 캠페인만 생성할 수 있습니다.</p>
                        )}
                        {currentUser.role === '대행사 어드민' && (
                            <p className="mt-1 text-xs text-green-600">💡 대행사 어드민은 하부 직원들에게 캠페인을 배정할 수 있습니다.</p>
                        )}
                    </div>

                    {/* 새로 추가된 필드들 */}
                    <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                            💰 캠페인 매출 (선택사항)
                        </label>
                        <div className="mt-1 relative">
                            <input 
                                type="text" 
                                name="budget" 
                                id="budget" 
                                value={budget} 
                                onChange={(e) => setBudget(formatNumberWithCommas(e.target.value))} 
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md pr-12" 
                                placeholder="예: 5,000,000"
                                pattern="[0-9,]*"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                                원
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">캠페인 계약 매출을 입력하세요. (숫자만)</p>
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                            ⚠️ 주의사항 및 특이사항
                        </label>
                        <textarea 
                            name="notes" 
                            id="notes" 
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)} 
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md resize-none" 
                            placeholder="클라이언트 요구사항, 주의할 점, 특별 지침 등을 입력하세요..."
                        />
                        <p className="mt-1 text-xs text-gray-500">담당자가 꼭 알아야 할 중요 사항을 기록하세요.</p>
                    </div>

                    <div>
                        <label htmlFor="reminders" className="block text-sm font-medium text-gray-700">
                            🔔 리마인드 사항
                        </label>
                        <textarea 
                            name="reminders" 
                            id="reminders" 
                            value={reminders} 
                            onChange={(e) => setReminders(e.target.value)} 
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md resize-none" 
                            placeholder="정기 체크 포인트, 마감일, 보고 일정 등을 입력하세요..."
                        />
                        <p className="mt-1 text-xs text-gray-500">진행 중 놓치면 안 될 일정이나 체크사항을 기록하세요.</p>
                    </div>

                    {/* 재무 관리 필드들 */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="invoiceIssued"
                                    checked={invoiceIssued}
                                    onChange={(e) => setInvoiceIssued(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="invoiceIssued" className="ml-2 block text-sm text-gray-900">
                                    📄 계산서 발행 완료
                                </label>
                            </div>
                            
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="paymentCompleted"
                                    checked={paymentCompleted}
                                    onChange={(e) => setPaymentCompleted(e.target.checked)}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <label htmlFor="paymentCompleted" className="ml-2 block text-sm text-gray-900">
                                    💰 입금 완료
                                </label>
                            </div>
                        </div>
                        
                        {/* 예정일 입력 필드들 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="invoiceDueDate" className="block text-sm font-medium text-gray-700">
                                    📅 계산서 발행 예정일
                                </label>
                                <input
                                    type="date"
                                    id="invoiceDueDate"
                                    value={invoiceDueDate}
                                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="paymentDueDate" className="block text-sm font-medium text-gray-700">
                                    💸 입금 예정일
                                </label>
                                <input
                                    type="date"
                                    id="paymentDueDate"
                                    value={paymentDueDate}
                                    onChange={(e) => setPaymentDueDate(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">취소</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">생성</button>
                    </div>
                </form>
            </div>
        </div>
        );
    } catch (err) {
        console.error('NewCampaignModal 렌더링 오류:', err);
        setError(err.message);
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-xl">
                    <h3 className="text-xl font-bold mb-4 text-red-600">렌더링 오류</h3>
                    <p className="text-gray-700 mb-4">{err.message}</p>
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
                    >
                        닫기
                    </button>
                </div>
            </div>
        );
    }
};

export default NewCampaignModal;