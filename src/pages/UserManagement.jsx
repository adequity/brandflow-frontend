// src/pages/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api, { apiEndpoints } from '../api/client';
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
      // 새로운 API 엔드포인트로 사용자 데이터 가져오기 (Node.js API 호환 모드 파라미터 포함)
      const response = await apiEndpoints.getUsers({
        params: {
          viewerId: loggedInUser?.id || 1,
          viewerRole: loggedInUser?.role || 'super_admin'
        }
      });
      const usersData = response.data || [];
      
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
        incentive_rate: userData.incentiveRate || 0
      };
      
      // password는 사용자 생성 시 필수
      if (!currentUser) {
        // 새 사용자 생성 시 password 필수
        if (!userData.password) {
          showError('새 사용자 생성 시 비밀번호는 필수입니다.');
          return;
        }
        apiData.password = userData.password;
      } else if (userData.password) {
        // 기존 사용자 수정 시 password 선택사항
        apiData.password = userData.password;
      }
      
      if (currentUser) {
        // 사용자 수정
        await apiEndpoints.updateUser(currentUser.id, apiData);
        showSuccess('사용자가 수정되었습니다!');
      } else {
        // 사용자 생성
        console.log('Sending API data:', JSON.stringify(apiData, null, 2));
        // 쿼리 파라미터와 함께 사용자 생성
        const response = await apiEndpoints.users.create(apiData, {
          params: {
            viewerId: loggedInUser?.id || 1,
            viewerRole: loggedInUser?.role || 'super_admin'
          }
        });
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
      console.error('Error message:', err?.message);
      console.error('Request payload:', JSON.stringify(apiData, null, 2));
      
      // CORS 오류 또는 네트워크 오류 처리
      if (err.isCORSError || !err.response && (err.message?.includes('CORS') || err.message?.includes('fetch') || err.message?.includes('Failed to fetch') || err.message?.includes('Network') || err.name === 'TypeError')) {
        showError(`🚨 네트워크 연결 오류 (CORS/네트워크 문제)

백엔드 서버와의 연결에 문제가 발생했습니다:

🔍 가능한 원인:
• CORS 정책 위반 (Cross-Origin Resource Sharing)
• 백엔드 서버 500 오류 시 CORS 헤더 누락
• 네트워크 연결 문제
• 백엔드 서버 일시적 장애

🔧 해결 방안:
1. 잠시 후 다시 시도해보세요
2. 백엔드 서버 상태 확인 필요
3. 백엔드팀에 CORS 설정 및 500 에러 처리 개선 요청

⚠️ 기술적 세부사항:
- 오류: ${err.message}
- 시간: ${new Date().toLocaleString()}
- 요청 URL: /api/users

잠시 후 다시 시도하거나 시스템 관리자에게 문의해주세요.`);
      }
      // 422 Pydantic 검증 오류 처리
      if (err?.response?.status === 422 && Array.isArray(err?.response?.data?.detail)) {
        const validationErrors = err.response.data.detail;
        let errorMessages = [];
        
        validationErrors.forEach(error => {
          const fieldPath = Array.isArray(error.loc) ? error.loc.slice(1).join('.') : 'unknown';
          const fieldName = {
            'password': '비밀번호',
            'email': '이메일',
            'name': '이름',
            'role': '역할',
            'company': '회사명',
            'contact': '연락처',
            'incentive_rate': '인센티브 비율'
          }[fieldPath] || fieldPath;
          
          let message = '';
          switch(error.type) {
            case 'string_too_short':
              message = `${fieldName}는 최소 ${error.ctx?.min_length || 6}자 이상이어야 합니다. (현재: ${error.input?.length || 0}자)`;
              break;
            case 'string_too_long':
              message = `${fieldName}는 최대 ${error.ctx?.max_length}자까지 입력 가능합니다.`;
              break;
            case 'value_error':
              message = `${fieldName} 형식이 올바르지 않습니다.`;
              break;
            case 'missing':
              message = `${fieldName}는 필수 입력 항목입니다.`;
              break;
            case 'type_error':
              message = `${fieldName}의 데이터 타입이 올바르지 않습니다.`;
              break;
            default:
              message = `${fieldName}: ${error.msg}`;
          }
          errorMessages.push(message);
        });
        
        showError(`📝 입력 데이터 검증 오류

다음 항목을 확인하고 다시 시도해주세요:

${errorMessages.map(msg => `• ${msg}`).join('\n')}

💡 도움말:
- 비밀번호는 최소 6자 이상으로 설정해주세요
- 모든 필수 항목을 입력했는지 확인해주세요`);
      }
      // JSON 파싱 오류 특별 처리
      else if (err?.response?.data?.detail === "There was an error parsing the body") {
        showError(`⚠️ 백엔드 서버 JSON 파싱 오류
        
현재 백엔드에서 사용자 생성 API에 JSON 파싱 문제가 발생하고 있습니다.

🔧 임시 해결 방안:
1. 백엔드 개발팀에 JSON 파싱 이슈 수정 요청
2. 한글 인코딩 문제 해결 필요
3. 현재는 시스템 관리자만 사용자 관리 가능

📧 오류 세부정보:
- 상태: 400 Bad Request
- 메시지: ${err?.response?.data?.detail}
- 시간: ${new Date().toLocaleString()}

관리자에게 문의하여 백엔드 수정을 요청해주세요.`);
      } else {
        // 안전한 에러 메시지 추출 (React Minified Error #31 방지)
        let errorMessage = '사용자 저장에 실패했습니다.';
        
        try {
          if (typeof err?.response?.data?.detail === 'string') {
            errorMessage = err.response.data.detail;
          } else if (err?.response?.data?.email?.[0]) {
            errorMessage = `이메일: ${err.response.data.email[0]}`;
          } else if (err?.response?.data?.username?.[0]) {
            errorMessage = `사용자명: ${err.response.data.username[0]}`;
          } else if (err?.response?.data && typeof err.response.data === 'object') {
            // 객체를 안전하게 문자열로 변환
            const errorData = err.response.data;
            const errorKeys = Object.keys(errorData);
            if (errorKeys.length > 0) {
              const firstKey = errorKeys[0];
              const firstValue = errorData[firstKey];
              if (typeof firstValue === 'string') {
                errorMessage = `${firstKey}: ${firstValue}`;
              } else if (Array.isArray(firstValue) && firstValue.length > 0) {
                errorMessage = `${firstKey}: ${String(firstValue[0])}`;
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `요청 처리 중 오류가 발생했습니다. (상태: ${err?.response?.status || 'unknown'})`;
        }
        
        showError(errorMessage);
      }
    }
  };

  const handleDeleteUser = async () => {
    try {
      // 새로운 API 엔드포인트로 사용자 삭제
      await apiEndpoints.deleteUser(currentUser.id);
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
