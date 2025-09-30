import React, { useState, useEffect } from 'react';
import { Building, Edit3, Save, X, Upload, Image as ImageIcon } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';

const CompanyInfoSection = ({ user }) => {
    const { showSuccess, showError } = useToast();
    const [companyInfo, setCompanyInfo] = useState({
        businessNumber: "",
        name: "",
        ceo: "",
        address: "",
        businessType: "",
        businessItem: "",
        bankName: "",
        accountNumber: "",
        accountHolder: "",
        sealImageUrl: ""
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingSeal, setUploadingSeal] = useState(false);
    const [sealPreview, setSealPreview] = useState(null);

    // 회사 정보 편집 권한 체크
    const canEdit = user?.role === 'AGENCY_ADMIN' || user?.role === 'SUPER_ADMIN';

    // 회사 정보 로드
    const fetchCompanyInfo = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/company-settings/info');

            if (response.data && response.data.success && response.data.info) {
                setCompanyInfo(response.data.info);
            } else {
                // 빈 상태로 설정
                setCompanyInfo({
                    businessNumber: "",
                    name: "",
                    ceo: "",
                    address: "",
                    businessType: "",
                    businessItem: "",
                    bankName: "",
                    accountNumber: "",
                    accountHolder: "",
                    sealImageUrl: ""
                });
            }
        } catch (error) {
            console.error('회사 정보 로딩 실패:', error);
            showError('회사 정보를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 회사 정보 저장
    const saveCompanyInfo = async () => {
        try {
            setIsSaving(true);

            // 설정 키 매핑
            const settingsToUpdate = {};
            Object.keys(companyInfo).forEach(key => {
                let settingKey;
                if (key === 'businessNumber') settingKey = 'business_number';
                else if (key === 'name') settingKey = 'company_name';
                else if (key === 'ceo') settingKey = 'ceo_name';
                else if (key === 'address') settingKey = 'company_address';
                else if (key === 'businessType') settingKey = 'business_type';
                else if (key === 'businessItem') settingKey = 'business_item';
                else if (key === 'bankName') settingKey = 'bank_name';
                else if (key === 'accountNumber') settingKey = 'account_number';
                else if (key === 'accountHolder') settingKey = 'account_holder';
                else if (key === 'sealImageUrl') settingKey = 'seal_image_url';
                else settingKey = key;

                settingsToUpdate[settingKey] = companyInfo[key] || '';
            });

            await api.post('/api/company-settings/bulk-update', settingsToUpdate);

            setIsEditing(false);
            showSuccess('회사 정보가 저장되었습니다!');
        } catch (error) {
            console.error('회사 정보 저장 실패:', error);
            showError('회사 정보 저장에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    // 도장 이미지 업로드
    const handleSealUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // 파일 타입 체크
        if (!file.type.startsWith('image/')) {
            showError('이미지 파일만 업로드 가능합니다.');
            return;
        }

        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError('파일 크기는 5MB 이하여야 합니다.');
            return;
        }

        try {
            setUploadingSeal(true);

            const formData = new FormData();
            formData.append('file', file);

            // FormData 사용 시 Content-Type 헤더를 수동으로 설정하면 boundary가 누락됨
            // 브라우저가 자동으로 Content-Type과 boundary를 설정하도록 함
            const response = await api.post('/api/files/single', formData);

            console.log('File upload response:', response.data);

            if (response.data && response.data.success && response.data.data) {
                // 백엔드 파일 업로드 응답 구조: { success: true, data: { relative_path: 'images/filename.png', ... } }
                const relativePath = response.data.data.relative_path;
                // relative_path는 "images/filename.png" 형태
                const [category, filename] = relativePath.split('/');
                const fileUrl = `/api/files/view/${category}/${filename}`;

                setCompanyInfo(prev => ({
                    ...prev,
                    sealImageUrl: fileUrl
                }));
                setSealPreview(fileUrl);
                showSuccess('도장 이미지가 업로드되었습니다!');
            }
        } catch (error) {
            console.error('도장 업로드 실패:', error);
            showError('도장 이미지 업로드에 실패했습니다.');
        } finally {
            setUploadingSeal(false);
        }
    };

    // 입력 값 변경 핸들러
    const handleInputChange = (field, value) => {
        setCompanyInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 편집 취소
    const handleCancel = () => {
        fetchCompanyInfo(); // 원래 데이터로 복원
        setIsEditing(false);
        setSealPreview(null);
    };

    useEffect(() => {
        fetchCompanyInfo();
    }, []);

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Building className="text-blue-600" size={24} />
                    <h3 className="text-lg font-semibold text-gray-800">내 회사 정보</h3>
                </div>
                {canEdit && (
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-1"
                                >
                                    <X size={14} />
                                    취소
                                </button>
                                <button
                                    onClick={saveCompanyInfo}
                                    disabled={isSaving}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                                >
                                    <Save size={14} />
                                    {isSaving ? '저장 중...' : '저장'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                            >
                                <Edit3 size={14} />
                                편집
                            </button>
                        )}
                    </div>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-6">
                    {/* 기본 회사 정보 */}
                    <div>
                        <h4 className="text-md font-medium mb-3 text-gray-800">기본 정보</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">사업자번호</label>
                                <input
                                    type="text"
                                    value={companyInfo.businessNumber}
                                    onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="예: 119-86-25255"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">회사명</label>
                                <input
                                    type="text"
                                    value={companyInfo.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="예: 성현시스템 주식회사"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">대표자</label>
                                <input
                                    type="text"
                                    value={companyInfo.ceo}
                                    onChange={(e) => handleInputChange('ceo', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="예: 임선준"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">업태</label>
                                <input
                                    type="text"
                                    value={companyInfo.businessType}
                                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="예: 제조업, 도소매업"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">주소</label>
                                <input
                                    type="text"
                                    value={companyInfo.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="예: 서울시 금천구 가산디지털2로 108"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">종목</label>
                                <input
                                    type="text"
                                    value={companyInfo.businessItem}
                                    onChange={(e) => handleInputChange('businessItem', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="예: 전자제품, 정보통신공사"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 입금 계좌 정보 */}
                    <div className="border-t pt-6">
                        <h4 className="text-md font-medium mb-3 text-gray-800">입금 계좌 정보</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">은행명</label>
                                <input
                                    type="text"
                                    value={companyInfo.bankName}
                                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="예: 국민은행"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">계좌번호</label>
                                <input
                                    type="text"
                                    value={companyInfo.accountNumber}
                                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="예: 123456-78-901234"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">예금주</label>
                                <input
                                    type="text"
                                    value={companyInfo.accountHolder}
                                    onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="예: 성현시스템 주식회사"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 도장 이미지 */}
                    <div className="border-t pt-6">
                        <h4 className="text-md font-medium mb-3 text-gray-800">공급자 도장</h4>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                {(sealPreview || companyInfo.sealImageUrl) ? (
                                    <img
                                        src={sealPreview || companyInfo.sealImageUrl}
                                        alt="도장 미리보기"
                                        className="max-w-full max-h-full object-contain rounded"
                                    />
                                ) : (
                                    <ImageIcon className="text-gray-400" size={24} />
                                )}
                            </div>
                            <div>
                                <label className="block">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleSealUpload}
                                        className="hidden"
                                        disabled={uploadingSeal}
                                    />
                                    <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 inline-flex items-center gap-2">
                                        <Upload size={16} />
                                        {uploadingSeal ? '업로드 중...' : '도장 이미지 업로드'}
                                    </span>
                                </label>
                                <div className="text-xs text-gray-500 mt-1">
                                    PNG, JPG 파일 (최대 5MB)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* 기본 정보 표시 */}
                    <div>
                        <h4 className="text-md font-medium mb-3 text-gray-800">기본 정보</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><span className="font-medium text-gray-600">사업자번호:</span> {companyInfo.businessNumber || '미입력'}</div>
                            <div><span className="font-medium text-gray-600">회사명:</span> {companyInfo.name || '미입력'}</div>
                            <div><span className="font-medium text-gray-600">대표자:</span> {companyInfo.ceo || '미입력'}</div>
                            <div><span className="font-medium text-gray-600">업태:</span> {companyInfo.businessType || '미입력'}</div>
                            <div className="md:col-span-2"><span className="font-medium text-gray-600">주소:</span> {companyInfo.address || '미입력'}</div>
                            <div className="md:col-span-2"><span className="font-medium text-gray-600">종목:</span> {companyInfo.businessItem || '미입력'}</div>
                        </div>
                    </div>

                    {/* 입금 계좌 정보 표시 */}
                    <div className="border-t pt-6">
                        <h4 className="text-md font-medium mb-3 text-gray-800">입금 계좌 정보</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div><span className="font-medium text-gray-600">은행명:</span> {companyInfo.bankName || '미입력'}</div>
                            <div><span className="font-medium text-gray-600">계좌번호:</span> {companyInfo.accountNumber || '미입력'}</div>
                            <div><span className="font-medium text-gray-600">예금주:</span> {companyInfo.accountHolder || '미입력'}</div>
                        </div>
                    </div>

                    {/* 도장 이미지 표시 */}
                    <div className="border-t pt-6">
                        <h4 className="text-md font-medium mb-3 text-gray-800">공급자 도장</h4>
                        {companyInfo.sealImageUrl ? (
                            <div className="flex items-center gap-3">
                                <div className="w-16 h-16 border border-gray-300 rounded bg-gray-50 flex items-center justify-center">
                                    <img
                                        src={companyInfo.sealImageUrl}
                                        alt="도장"
                                        className="max-w-full max-h-full object-contain rounded"
                                    />
                                </div>
                                <span className="text-sm text-green-600">✓ 등록됨</span>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">미등록</div>
                        )}
                    </div>

                    {!canEdit && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                            <div className="flex items-center gap-2">
                                <div className="text-yellow-600">⚠️</div>
                                <div>회사 정보 수정은 에이전시 관리자(AGENCY_ADMIN) 또는 슈퍼 어드민(SUPER_ADMIN)만 가능합니다.</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-6 text-xs text-gray-500 border-t pt-4">
                💡 이 정보는 모든 문서(견적서, 계산서 등) 생성 시 자동으로 적용됩니다.
            </div>
        </div>
    );
};

export default CompanyInfoSection;