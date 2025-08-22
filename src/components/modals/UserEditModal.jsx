import React, { useState, useEffect } from 'react';
import api from '../../api/client';

const UserEditModal = ({ user, onSave, onClose, loggedInUser }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        contact: user?.contact || '',
        company: user?.company || '',
        role: user?.role || '클라이언트',
        incentiveRate: user?.incentiveRate || 0,
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
                role: user.role || '클라이언트',
                incentiveRate: user.incentiveRate || 0,
            });
        } else {
            console.log('UserEditModal - setting formData for new user');
            setFormData({
                name: '',
                email: '',
                password: '',
                contact: '',
                company: (loggedInUser?.role === '직원' || loggedInUser?.role === '대행사 어드민') ? loggedInUser.company : '',
                role: '클라이언트',
                incentiveRate: 0,
            });
        }
    }, [user]);
    const [existingCompanies, setExistingCompanies] = useState([]);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
    // 기존 회사 목록 로드 (슈퍼 어드민만)
    useEffect(() => {
        if (loggedInUser?.role === '슈퍼 어드민' && !user) {
            fetchExistingCompanies();
        }
    }, [loggedInUser, user]);

    const fetchExistingCompanies = async () => {
        setIsLoadingCompanies(true);
        try {
            const response = await api.get('/api/users', {
                params: {
                    adminId: loggedInUser.id,
                    adminRole: loggedInUser.role,
                },
            });
            
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

    const isStaffRole = formData.role === '대행사 어드민' || formData.role === '직원';
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
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
                    {/* 기본 정보 섹션 */}
                    <div className="space-y-4">
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
                                비밀번호 {user && '*'}
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
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                소속/회사명
                                {formData.role === '대행사 어드민' && (
                                    <span className="text-blue-600 text-xs ml-2">(새로운 대행사)</span>
                                )}
                            </label>
                            
                            {/* 직원/대행사 관리자가 사용자 생성 시에는 본인 회사로 고정 */}
                            {(loggedInUser?.role === '직원' || loggedInUser?.role === '대행사 어드민') && !user ? (
                                <div className="w-full px-4 py-3 border border-gray-300 bg-gray-100 rounded-lg text-gray-700">
                                    {loggedInUser.company} (본인 소속)
                                    <input type="hidden" name="company" value={loggedInUser.company} />
                                </div>
                            ) : /* 슈퍼 어드민이 직원/클라이언트 생성 시에만 드롭다운 표시 */
                            loggedInUser?.role === '슈퍼 어드민' && !user && 
                             (formData.role === '직원' || formData.role === '클라이언트') && 
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
                                        formData.role === '대행사 어드민' 
                                            ? "새 대행사명을 입력하세요" 
                                            : "회사명 또는 부서명"
                                    }
                                />
                            )}
                            
                            {isLoadingCompanies && (
                                <p className="text-xs text-gray-500 mt-1">기존 대행사 목록 로딩 중...</p>
                            )}
                            
                            {formData.role === '대행사 어드민' && (
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 대행사 어드민 계정은 새로운 대행사를 만듭니다. 회사명을 정확히 입력해주세요.
                                </p>
                            )}
                            
                            {(formData.role === '직원' || formData.role === '클라이언트') && existingCompanies.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 기존 대행사에 소속시킬 직원/클라이언트입니다.
                                </p>
                            )}
                        </div>

                        {/* 인센티브율 필드 - 직원/대행사 어드민만 표시 */}
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
                                { value: '직원', label: '직원', desc: '업무 처리 및 클라이언트 지원', icon: '👨‍💼', color: 'green' },
                                { value: '대행사 어드민', label: '대행사 어드민', desc: '팀 관리 및 전체 업무 감독', icon: '👨‍💼', color: 'blue' },
                                { value: '클라이언트', label: '클라이언트', desc: '업무 의뢰 및 결과 확인', icon: '🤝', color: 'orange' },
                                { value: '슈퍼 어드민', label: '슈퍼 어드민', desc: '시스템 전체 관리 권한', icon: '⚡', color: 'purple' }
                            ].filter(role => {
                                // 직원은 클라이언트만 생성 가능
                                if (loggedInUser?.role === '직원') {
                                    return role.value === '클라이언트';
                                }
                                // 대행사 어드민은 슈퍼 어드민 제외하고 생성 가능
                                if (loggedInUser?.role === '대행사 어드민') {
                                    return role.value !== '슈퍼 어드민';
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
                                                ? role.value === '직원' ? 'border-green-500 bg-green-50' :
                                                  role.value === '대행사 어드민' ? 'border-blue-500 bg-blue-50' :
                                                  role.value === '클라이언트' ? 'border-orange-500 bg-orange-50' :
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