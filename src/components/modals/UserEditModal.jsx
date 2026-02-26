import React, { useState, useEffect } from 'react';
import api from '../../api/client';

const UserEditModal = ({ user, onSave, onClose, loggedInUser }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        contact: user?.contact || '',
        company: user?.company || '',
        role: user?.role || 'CLIENT',
        incentiveRate: user?.incentiveRate || 0,
        // 팀 정보 (TEAM_LEADER, STAFF용)
        teamName: user?.teamName || '',
        teamLeaderId: user?.teamLeaderId || null,
        // CLIENT의 담당 STAFF
        assignedStaffId: user?.assignedStaffId || null,
        // 클라이언트 실제 회사 정보
        clientCompanyName: user?.clientCompanyName || '',
        clientBusinessNumber: user?.clientBusinessNumber || '',
        clientCeoName: user?.clientCeoName || '',
        clientCompanyAddress: user?.clientCompanyAddress || '',
        clientBusinessType: user?.clientBusinessType || '',
        clientBusinessItem: user?.clientBusinessItem || '',
    });

    // 사용자 정보가 변경되면 formData 업데이트
    useEffect(() => {
        if (user) {
            console.log('UserEditModal - updating formData for existing user:', user);
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '',
                contact: user.contact || '',
                company: user.company || '',
                role: user.role || 'CLIENT',
                incentiveRate: user.incentiveRate || 0,
                // 팀 정보
                teamName: user.teamName || '',
                teamLeaderId: user.teamLeaderId || null,
                // CLIENT의 담당 STAFF
                assignedStaffId: user.assignedStaffId || null,
                // 클라이언트 실제 회사 정보
                clientCompanyName: user.clientCompanyName || '',
                clientBusinessNumber: user.clientBusinessNumber || '',
                clientCeoName: user.clientCeoName || '',
                clientCompanyAddress: user.clientCompanyAddress || '',
                clientBusinessType: user.clientBusinessType || '',
                clientBusinessItem: user.clientBusinessItem || '',
            });
        } else {
            console.log('UserEditModal - setting formData for new user');
            // 기본 역할을 로그인한 사용자에 따라 설정
            let defaultRole = 'CLIENT';
            if (loggedInUser?.role === 'AGENCY_ADMIN') {
                defaultRole = 'CLIENT'; // 🔧 수정: 대행사 어드민도 기본적으로 클라이언트 생성
            } else if (loggedInUser?.role === 'STAFF') {
                defaultRole = 'CLIENT'; // 직원은 클라이언트만 생성 가능
            }

            setFormData({
                name: '',
                email: '',
                password: '',
                contact: '',
                company: (loggedInUser?.role === 'STAFF' || loggedInUser?.role === 'AGENCY_ADMIN' || loggedInUser?.role === 'TEAM_LEADER') ? loggedInUser.company : '',
                role: defaultRole,
                incentiveRate: 0,
                // 팀 정보 초기값
                teamName: '',
                teamLeaderId: null,
                // STAFF가 CLIENT 생성 시 본인을 담당자로 자동 할당
                assignedStaffId: (loggedInUser?.role === 'STAFF' && defaultRole === 'CLIENT') ? loggedInUser.id : null,
                // 클라이언트 실제 회사 정보 초기값
                clientCompanyName: '',
                clientBusinessNumber: '',
                clientCeoName: '',
                clientCompanyAddress: '',
                clientBusinessType: '',
                clientBusinessItem: '',
            });
        }
    }, [user]);

    const [existingCompanies, setExistingCompanies] = useState([]);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
    const [teamLeaders, setTeamLeaders] = useState([]);
    const [isLoadingTeamLeaders, setIsLoadingTeamLeaders] = useState(false);
    const [staffMembers, setStaffMembers] = useState([]);
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);

    // 기존 회사 목록 로드 (슈퍼 어드민만)
    useEffect(() => {
        if (loggedInUser?.role === 'SUPER_ADMIN' && !user) {
            fetchExistingCompanies();
        }
    }, [loggedInUser, user]);

    // 팀 리더 목록 로드 (STAFF 역할 선택 시)
    useEffect(() => {
        const loadTeamLeaders = async () => {
            if (formData.role === 'STAFF' && formData.company) {
                await fetchTeamLeaders(formData.company);

                // TEAM_LEADER가 STAFF를 추가할 때 자동으로 본인을 팀 리더로 설정
                if (loggedInUser?.role === 'TEAM_LEADER' && !user) {
                    // 팀 리더 목록에 본인 추가 (API 조회 결과에 없을 수 있으므로)
                    setTeamLeaders(prev => {
                        const alreadyExists = prev.some(leader => leader.id === loggedInUser.id);
                        if (!alreadyExists) {
                            return [{
                                id: loggedInUser.id,
                                name: loggedInUser.name,
                                team_name: loggedInUser.team_name,  // snake_case 우선
                                teamName: loggedInUser.team_name    // team_name을 teamName으로도 복사
                            }, ...prev];
                        }
                        return prev;
                    });
                    setFormData(prev => ({ ...prev, teamLeaderId: loggedInUser.id }));
                }
            } else if (formData.role !== 'STAFF') {
                // STAFF가 아닌 역할로 변경되면 팀 리더 목록 초기화
                setTeamLeaders([]);
            }
        };

        loadTeamLeaders();
    }, [formData.role, formData.company, loggedInUser, user]);

    // STAFF 목록 로드 (CLIENT 역할 선택 시)
    useEffect(() => {
        if (formData.role === 'CLIENT' && formData.company) {
            fetchStaffMembers(formData.company);
        } else if (formData.role !== 'CLIENT') {
            // CLIENT가 아닌 역할로 변경되면 STAFF 목록 초기화
            setStaffMembers([]);
        }
    }, [formData.role, formData.company]);

    const fetchExistingCompanies = async () => {
        setIsLoadingCompanies(true);
        try {
            const response = await api.get('/api/users');

            // API 응답 데이터 구조에 맞게 수정
            const usersData = response.data.results || response.data;
            console.log('회사 목록을 위한 사용자 데이터:', usersData);

            // 회사명만 추출하고 중복 제거
            const companies = [...new Set(
                usersData.filter(u => u.company && u.company.trim())
                    .map(u => u.company.trim())
            )].sort();

            console.log('추출된 회사 목록:', companies);
            setExistingCompanies(companies);
        } catch (error) {
            console.error('회사 목록 로딩 실패:', error);
        } finally {
            setIsLoadingCompanies(false);
        }
    };

    const fetchTeamLeaders = async (company) => {
        setIsLoadingTeamLeaders(true);
        try {
            const response = await api.get('/api/users');
            const usersData = response.data.results || response.data;

            // 해당 회사의 TEAM_LEADER만 필터링
            const leaders = usersData.filter(u =>
                u.role === 'TEAM_LEADER' && u.company === company
            );

            console.log('팀 리더 목록:', leaders);
            setTeamLeaders(leaders);
        } catch (error) {
            console.error('팀 리더 목록 로딩 실패:', error);
        } finally {
            setIsLoadingTeamLeaders(false);
        }
    };

    const fetchStaffMembers = async (company) => {
        setIsLoadingStaff(true);
        try {
            const response = await api.get('/api/users');
            const usersData = response.data.results || response.data;

            // 해당 회사의 STAFF와 TEAM_LEADER 필터링 (둘 다 CLIENT 담당 가능)
            const staff = usersData.filter(u =>
                (u.role === 'STAFF' || u.role === 'TEAM_LEADER') && u.company === company
            );

            console.log('STAFF/TEAM_LEADER 목록:', staff);
            setStaffMembers(staff);
        } catch (error) {
            console.error('STAFF/TEAM_LEADER 목록 로딩 실패:', error);
        } finally {
            setIsLoadingStaff(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCompanySelect = (company) => {
        setFormData(prev => ({ ...prev, company }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const isStaffRole = formData.role === 'AGENCY_ADMIN' || formData.role === 'STAFF' || formData.role === 'TEAM_LEADER';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">
                            {user ? '사용자 정보 수정' : '새 사용자 추가'}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                            {user ? '기존 사용자의 정보를 수정합니다' : '새로운 팀원 또는 클라이언트를 추가합니다'}
                        </p>
                    </div>
                    <div className="text-3xl">
                        {isStaffRole ? '👥' : '🤝'}
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 메인 컨텐츠를 2컬럼으로 구성 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 왼쪽: 기본 정보 섹션 */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                👤 기본 정보
                            </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="홍길동"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                                <input
                                    type="text"
                                    name="contact"
                                    id="contact"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="010-1234-5678"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">이메일 (로그인 ID) *</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="example@company.com"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                비밀번호 {!user && '*'}
                            </label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={user ? "변경할 경우에만 입력하세요" : "임시 비밀번호를 입력하세요"}
                                required={!user}
                            />
                            {user && (
                                <p className="text-xs text-gray-500 mt-1">비밀번호를 변경하지 않으려면 비워두세요.</p>
                            )}
                            {!user && (
                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs text-blue-800 font-medium mb-1">📋 비밀번호 요구사항:</p>
                                    <ul className="text-xs text-blue-700 space-y-1">
                                        <li>• 최소 8자 이상</li>
                                        <li>• 영문 대소문자, 숫자, 특수문자 중 3가지 이상 포함</li>
                                        <li>• 예시: <code className="bg-blue-100 px-1 rounded">Password123!</code></li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                소속/회사명
                                {formData.role === 'AGENCY_ADMIN' && (
                                    <span className="text-blue-600 text-xs ml-2">(새로운 대행사)</span>
                                )}
                            </label>

                            {/* 직원/대행사 관리자/팀 리더가 사용자 생성 시에는 본인 회사로 고정 */}
                            {(loggedInUser?.role === 'STAFF' || loggedInUser?.role === 'AGENCY_ADMIN' || loggedInUser?.role === 'TEAM_LEADER') && !user ? (
                                <div className="w-full px-4 py-3 border border-gray-300 bg-gray-100 rounded-lg text-gray-700">
                                    {loggedInUser.company} (본인 소속)
                                    <input type="hidden" name="company" value={loggedInUser.company} />
                                </div>
                            ) : /* 슈퍼 어드민이 직원/클라이언트 생성 시에만 드롭다운 표시 */
                            loggedInUser?.role === 'SUPER_ADMIN' && !user &&
                             (formData.role === 'STAFF' || formData.role === 'TEAM_LEADER' || formData.role === 'CLIENT') &&
                             existingCompanies.length > 0 ? (
                                <select
                                    value={formData.company}
                                    onChange={(e) => handleCompanySelect(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">기존 대행사 선택...</option>
                                    {existingCompanies.map((company, index) => (
                                        <option key={index} value={company}>
                                            {company}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    name="company"
                                    id="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={
                                        formData.role === 'AGENCY_ADMIN'
                                            ? "새 대행사명을 입력하세요"
                                            : "회사명 또는 부서명"
                                    }
                                />
                            )}

                            {isLoadingCompanies && (
                                <p className="text-xs text-gray-500 mt-1">기존 대행사 목록 로딩 중...</p>
                            )}

                            {formData.role === 'AGENCY_ADMIN' && (
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 대행사 어드민 계정은 새로운 대행사를 만듭니다. 회사명을 정확히 입력해주세요.
                                </p>
                            )}

                            {(formData.role === 'STAFF' || formData.role === 'TEAM_LEADER' || formData.role === 'CLIENT') && existingCompanies.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 기존 대행사에 소속시킬 직원/팀리더/클라이언트입니다.
                                </p>
                            )}
                        </div>

                        {/* 팀 정보 필드 - TEAM_LEADER만 표시 */}
                        {formData.role === 'TEAM_LEADER' && (
                            <div>
                                <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">
                                    팀 이름 *
                                </label>
                                <input
                                    type="text"
                                    name="teamName"
                                    id="teamName"
                                    value={formData.teamName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="예: 마케팅 1팀"
                                    required={formData.role === 'TEAM_LEADER'}
                                />
                                <p className="text-xs text-gray-500 mt-1">이 팀 리더가 관리하는 팀의 이름입니다.</p>
                            </div>
                        )}

                        {/* 팀 리더 선택 - STAFF만 표시 (필수) */}
                        {formData.role === 'STAFF' && (
                            <div>
                                <label htmlFor="teamLeaderId" className="block text-sm font-medium text-gray-700 mb-1">
                                    소속 팀 리더 * <span className="text-red-500">(필수)</span>
                                </label>
                                {isLoadingTeamLeaders ? (
                                    <div className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-500">
                                        팀 리더 목록 로딩 중...
                                    </div>
                                ) : teamLeaders.length > 0 ? (
                                    <>
                                        <select
                                            name="teamLeaderId"
                                            id="teamLeaderId"
                                            value={formData.teamLeaderId || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">팀 리더를 선택하세요...</option>
                                            {teamLeaders.map((leader) => (
                                                <option key={leader.id} value={leader.id}>
                                                    {leader.name} ({leader.team_name || leader.teamName || '팀 미지정'})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            💡 이 직원이 소속될 팀 리더를 선택하세요. CLIENT 생성 시 자동으로 팀 정보가 상속됩니다.
                                        </p>
                                    </>
                                ) : (
                                    <div className="w-full px-4 py-3 border border-red-300 bg-red-50 rounded-lg text-red-700">
                                        <p className="font-medium">⚠️ 팀 리더가 없습니다</p>
                                        <p className="text-xs mt-1">먼저 해당 회사에 TEAM_LEADER 역할의 사용자를 생성해주세요.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 인센티브율 필드 - STAFF/TEAM_LEADER/AGENCY_ADMIN 표시 */}
                        {isStaffRole && (
                            <div>
                                <label htmlFor="incentiveRate" className="block text-sm font-medium text-gray-700 mb-1">
                                    인센티브율 (%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="incentiveRate"
                                        id="incentiveRate"
                                        value={formData.incentiveRate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                    />
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">직원의 이익 대비 인센티브 비율을 설정합니다.</p>
                            </div>
                        )}
                    </div>

                    {/* 역할 선택 섹션 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">역할 선택 *</label>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { value: 'STAFF', label: '직원', desc: '업무 처리 및 클라이언트 지원', icon: '👨‍💼', color: 'green' },
                                { value: 'TEAM_LEADER', label: '팀 리더', desc: '팀원 관리 및 이익 배분 (인센티브 대상)', icon: '👔', color: 'indigo' },
                                { value: 'AGENCY_ADMIN', label: '대행사 어드민', desc: '팀 관리 및 전체 업무 감독', icon: '👨‍💼', color: 'blue' },
                                { value: 'CLIENT', label: '클라이언트', desc: '업무 의뢰 및 결과 확인', icon: '🤝', color: 'orange' },
                                { value: 'SUPER_ADMIN', label: '슈퍼 어드민', desc: '시스템 전체 관리 권한', icon: '⚡', color: 'purple' }
                            ].filter(role => {
                                // 직원은 클라이언트만 생성 가능
                                if (loggedInUser?.role === 'STAFF') {
                                    return role.value === 'CLIENT';
                                }
                                // 팀 리더는 STAFF와 CLIENT만 생성 가능
                                if (loggedInUser?.role === 'TEAM_LEADER') {
                                    return role.value === 'STAFF' || role.value === 'CLIENT';
                                }
                                // 대행사 어드민은 슈퍼 어드민 제외하고 생성 가능
                                if (loggedInUser?.role === 'AGENCY_ADMIN') {
                                    return role.value !== 'SUPER_ADMIN';
                                }
                                // 슈퍼 어드민은 모든 역할 생성 가능
                                return true;
                            }).map(role => (
                                <div key={role.value} className="relative">
                                    <input
                                        type="radio"
                                        name="role"
                                        id={`role-${role.value}`}
                                        value={role.value}
                                        checked={formData.role === role.value}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <label
                                        htmlFor={`role-${role.value}`}
                                        className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            formData.role === role.value
                                                ? role.value === 'STAFF' ? 'border-green-500 bg-green-50' :
                                                  role.value === 'TEAM_LEADER' ? 'border-indigo-500 bg-indigo-50' :
                                                  role.value === 'AGENCY_ADMIN' ? 'border-blue-500 bg-blue-50' :
                                                  role.value === 'CLIENT' ? 'border-orange-500 bg-orange-50' :
                                                  'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-2xl">{role.icon}</span>
                                                <div>
                                                    <div className="font-medium text-gray-900">{role.label}</div>
                                                    <div className="text-sm text-gray-500">{role.desc}</div>
                                                </div>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border-2 ${
                                                formData.role === role.value
                                                    ? `border-${role.color}-500 bg-${role.color}-500`
                                                    : 'border-gray-300'
                                            }`}>
                                                {formData.role === role.value && (
                                                    <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                        </div>

                        {/* 오른쪽: 회사 정보 - 역할별 표시 */}
                        {formData.role === 'CLIENT' ? (
                            <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                                👤 담당 STAFF 정보
                            </h3>

                            {/* 담당 STAFF 선택 */}
                            <div>
                                <label htmlFor="assignedStaffId" className="block text-sm font-medium text-gray-700 mb-1">
                                    담당 STAFF/팀 리더 {(loggedInUser?.role === 'AGENCY_ADMIN' || loggedInUser?.role === 'SUPER_ADMIN') && <span className="text-gray-500">(변경 가능)</span>}
                                </label>
                                {/* STAFF 계정이 CLIENT 생성 시: 본인 자동 할당 (고정 표시) */}
                                {loggedInUser?.role === 'STAFF' ? (
                                    <>
                                        <div className="w-full px-4 py-3 border border-green-300 bg-green-50 rounded-lg text-green-800 font-medium">
                                            {loggedInUser.name} (본인 - 자동 할당)
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            직원 계정으로 클라이언트 생성 시 본인이 담당자로 자동 할당됩니다.
                                        </p>
                                    </>
                                ) : isLoadingStaff ? (
                                    <div className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-500">
                                        담당자 목록 로딩 중...
                                    </div>
                                ) : staffMembers.length > 0 ? (
                                    <>
                                        <select
                                            name="assignedStaffId"
                                            id="assignedStaffId"
                                            value={formData.assignedStaffId || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        >
                                            <option value="">담당자를 선택하세요...</option>
                                            {staffMembers.map((staff) => (
                                                <option key={staff.id} value={staff.id}>
                                                    {staff.role === 'TEAM_LEADER' ? '👔 ' : '👨‍💼 '}
                                                    {staff.name} {staff.team_name || staff.teamName ? `(${staff.team_name || staff.teamName})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            이 클라이언트를 담당할 STAFF 또는 팀 리더를 선택하세요.
                                        </p>

                                        {/* 선택한 STAFF의 팀 정보 표시 */}
                                        {formData.assignedStaffId && staffMembers.length > 0 && (() => {
                                            const selectedStaff = staffMembers.find(s => s.id === parseInt(formData.assignedStaffId));
                                            if (selectedStaff && (selectedStaff.team_name || selectedStaff.teamName)) {
                                                return (
                                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <p className="text-xs text-blue-800 font-medium mb-1">소속 팀 정보</p>
                                                        <p className="text-sm text-blue-700">
                                                            <span className="font-medium">{selectedStaff.team_name || selectedStaff.teamName}</span>
                                                        </p>
                                                        <p className="text-xs text-blue-600 mt-1">
                                                            이 클라이언트는 담당 STAFF를 통해 자동으로 팀과 연결됩니다.
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </>
                                ) : (
                                    <div className="w-full px-4 py-3 border border-yellow-300 bg-yellow-50 rounded-lg text-yellow-700">
                                        <p className="font-medium">STAFF가 없습니다</p>
                                        <p className="text-xs mt-1">해당 회사에 STAFF 역할의 사용자를 먼저 생성해주세요.</p>
                                    </div>
                                )}
                            </div>

                            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2 mt-6">
                                🏢 실제 거래 회사 정보
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                계산서/견적서 발급 시 사용될 클라이언트의 실제 회사 정보입니다.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        실제 회사명
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientCompanyName}
                                        onChange={(e) => setFormData({...formData, clientCompanyName: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="예: (주)클라이언트회사"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        사업자등록번호
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientBusinessNumber}
                                        onChange={(e) => setFormData({...formData, clientBusinessNumber: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="예: 123-45-67890"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        대표자명
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientCeoName}
                                        onChange={(e) => setFormData({...formData, clientCeoName: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="예: 홍길동"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        업태
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientBusinessType}
                                        onChange={(e) => setFormData({...formData, clientBusinessType: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="예: 제조업, 도소매업"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        회사 주소
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientCompanyAddress}
                                        onChange={(e) => setFormData({...formData, clientCompanyAddress: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="예: 서울특별시 강남구 테헤란로 123"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        종목
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientBusinessItem}
                                        onChange={(e) => setFormData({...formData, clientBusinessItem: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="예: 소프트웨어 개발, 컨설팅"
                                    />
                                </div>
                            </div>
                            </div>
                        ) : formData.role === 'SUPER_ADMIN' || formData.role === 'AGENCY_ADMIN' ? (
                            <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                                🏢 회사 정보
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                {formData.role === 'AGENCY_ADMIN'
                                    ? '대행사 관리자의 회사 정보입니다. 문서 생성 시 기본 공급자 정보로 사용됩니다.'
                                    : '슈퍼 어드민의 회사 정보입니다.'
                                }
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        회사명
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientCompanyName}
                                        onChange={(e) => setFormData({...formData, clientCompanyName: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="예: (주)성현시스템"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        사업자등록번호
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientBusinessNumber}
                                        onChange={(e) => setFormData({...formData, clientBusinessNumber: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="예: 119-86-25255"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        대표자명
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientCeoName}
                                        onChange={(e) => setFormData({...formData, clientCeoName: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="예: 임선준"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        업태
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientBusinessType}
                                        onChange={(e) => setFormData({...formData, clientBusinessType: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="예: 제조업, 도소매업"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        회사 주소
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientCompanyAddress}
                                        onChange={(e) => setFormData({...formData, clientCompanyAddress: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="예: 서울시 금천구 가산디지털2로 108"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        종목
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientBusinessItem}
                                        onChange={(e) => setFormData({...formData, clientBusinessItem: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="예: 전자제품, 정보통신공사"
                                    />
                                </div>
                            </div>
                            </div>
                        ) : formData.role === 'TEAM_LEADER' ? (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                                    👔 팀 정보
                                </h3>
                                <div className="text-center py-8 text-indigo-600">
                                    <div className="text-4xl mb-2">👔</div>
                                    <p className="font-medium">팀 리더는 왼쪽에서 팀 이름을 입력해주세요.</p>
                                    <p className="text-sm text-gray-500 mt-2">STAFF를 생성할 때 이 팀 리더를 선택할 수 있습니다.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-400 border-b border-gray-200 pb-2">
                                    🏢 회사 정보
                                </h3>
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-4xl mb-2">📝</div>
                                    <p>STAFF 역할은 상위 관리자가 설정한 회사 정보를 사용합니다.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className={`px-6 py-3 text-white rounded-lg transition-colors ${
                                isStaffRole
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                        >
                            {isStaffRole ? '👥 ' : '🤝 '}
                            {user ? '정보 수정' : (isStaffRole ? '팀원 초대' : '클라이언트 추가')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditModal;
