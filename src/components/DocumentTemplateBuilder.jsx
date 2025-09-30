import React, { useState, useEffect } from 'react';
import { FileText, Plus, Minus, Download, Eye, Settings, Building } from 'lucide-react';
import api from '../api/client';

const DocumentTemplateBuilder = ({ onSave, initialTemplate = null, user }) => {
    // 회사 정보 편집 권한 체크 (에이전시 관리자 및 슈퍼 어드민)
    const canEditCompanyInfo = user?.role === 'AGENCY_ADMIN' || user?.role === 'SUPER_ADMIN';
    const [template, setTemplate] = useState(initialTemplate || {
        header: {
            title: "거래명세표",
            showDocumentNumber: true,
            showIssueDate: true
        },
        settings: {
            showTax: true,
            taxRate: 0.1,
            paperSize: "A4",
            showSignature: true,
            showAccountInfo: true
        },
        styles: {
            primaryColor: "#000000",
            headerFontSize: "24px",
            bodyFontSize: "12px"
        }
    });

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

    const [previewMode, setPreviewMode] = useState(false);
    const [editingCompanyInfo, setEditingCompanyInfo] = useState(false);
    const [uploadingSeal, setUploadingSeal] = useState(false);
    const [sealPreview, setSealPreview] = useState(null);

    // 회사 정보 로드
    useEffect(() => {
        fetchCompanyInfo();
    }, []);

    const fetchCompanyInfo = async () => {
        try {
            const response = await api.get('/api/admin/system-settings/?category=branding');
            const settings = response.data.settings || [];

            const companyData = {};
            settings.forEach(setting => {
                const key = setting.setting_key.replace('company_info_', '');
                companyData[key] = setting.current_value || setting.default_value;
            });

            if (Object.keys(companyData).length > 0) {
                setCompanyInfo(companyData);
            } else {
                // 기본값 설정
                setCompanyInfo({
                    businessNumber: "119-86-25255",
                    name: "성현시스템 주식회사",
                    ceo: "임선준",
                    address: "서울시 금천구 가산디지털2로 108, 뉴티캐슬 1101호, 1102호",
                    businessType: "제조, 도소매외",
                    businessItem: "전자제품,정보통신공사외"
                });
            }
        } catch (error) {
            console.error('회사 정보 로딩 실패:', error);
            // 기본값으로 설정
            setCompanyInfo({
                businessNumber: "119-86-25255",
                name: "성현시스템 주식회사",
                ceo: "임선준",
                address: "서울시 금천구 가산디지털2로 108, 뉴티캐슬 1101호, 1102호",
                businessType: "제조, 도소매외",
                businessItem: "전자제품,정보통신공사외"
            });
        }
    };

    const saveCompanyInfo = async () => {
        try {
            const settingsToUpdate = {};
            Object.keys(companyInfo).forEach(key => {
                settingsToUpdate[`company_info_${key}`] = companyInfo[key];
            });

            await api.post('/api/admin/system-settings/bulk-update', {
                settings: settingsToUpdate
            });

            setEditingCompanyInfo(false);
            alert('회사 정보가 저장되었습니다!');
        } catch (error) {
            console.error('회사 정보 저장 실패:', error);
            alert('회사 정보 저장에 실패했습니다.');
        }
    };

    // 도장 이미지 업로드 함수
    const handleSealImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // 이미지 파일 검증
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }

        // 파일 크기 검증 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
            alert('파일 크기는 5MB 이하여야 합니다.');
            return;
        }

        setUploadingSeal(true);

        try {
            // 미리보기 설정
            const reader = new FileReader();
            reader.onload = (e) => setSealPreview(e.target.result);
            reader.readAsDataURL(file);

            // FormData로 파일 업로드
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', 'seal'); // 도장 이미지 카테고리

            const response = await api.post('/api/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // 업로드된 이미지 URL 저장
            const imageUrl = response.data.file_url || response.data.url;
            setCompanyInfo(prev => ({
                ...prev,
                sealImageUrl: imageUrl
            }));

            alert('도장 이미지가 업로드되었습니다!');
        } catch (error) {
            console.error('도장 이미지 업로드 실패:', error);
            alert('도장 이미지 업로드에 실패했습니다.');
            setSealPreview(null);
        } finally {
            setUploadingSeal(false);
        }
    };

    // 도장 이미지 삭제 함수
    const handleSealImageRemove = () => {
        setCompanyInfo(prev => ({
            ...prev,
            sealImageUrl: ""
        }));
        setSealPreview(null);
    };

    const updateCompanyInfo = (field, value) => {
        setCompanyInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const updateTemplate = (section, field, value) => {
        setTemplate(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const PreviewDocument = () => (
        <div className="bg-white p-8 shadow-lg" style={{ width: '210mm', minHeight: '297mm' }}>
            {/* 헤더 */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-4">{template.header.title}</h1>
                <div className="flex justify-between text-sm">
                    {template.header.showDocumentNumber && (
                        <div>문서번호: 20250915-06</div>
                    )}
                    {template.header.showIssueDate && (
                        <div>발행일: {new Date().toLocaleDateString('ko-KR')}</div>
                    )}
                </div>
            </div>

            {/* 수신처/공급자 정보 */}
            <div className="grid grid-cols-2 gap-8 mb-8 border p-4">
                <div>
                    <h3 className="font-bold mb-2">수신</h3>
                    <div>상대측 회사 귀하</div>
                    <div>사업자번호: 상대측 번호</div>
                </div>
                <div>
                    <h3 className="font-bold mb-2">공급자</h3>
                    <div>사업자번호: {companyInfo.businessNumber}</div>
                    <div>상호: {companyInfo.name}</div>
                    <div>대표자: {companyInfo.ceo}</div>
                    <div>소재지: {companyInfo.address}</div>
                    <div>업태: {companyInfo.businessType}</div>
                    <div>종목: {companyInfo.businessItem}</div>
                </div>
            </div>

            {/* 합계금액 */}
            <div className="text-center mb-6 border-2 border-black p-4">
                <div className="text-xl font-bold">합계금액: 420,750원 (사십이만칠백오십원정)</div>
            </div>

            {/* 거래내역 테이블 */}
            <table className="w-full border-collapse border border-black mb-6">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2">시작일</th>
                        <th className="border border-black p-2">마감일</th>
                        <th className="border border-black p-2">품목 및 규격</th>
                        <th className="border border-black p-2">원가</th>
                        <th className="border border-black p-2">수량</th>
                        <th className="border border-black p-2">단가</th>
                        <th className="border border-black p-2">공급가액</th>
                        {template.settings.showTax && (
                            <th className="border border-black p-2">세액</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-black p-2">2025-09-15</td>
                        <td className="border border-black p-2">2025-09-30</td>
                        <td className="border border-black p-2">0915 블로그배포 오더</td>
                        <td className="border border-black p-2">300,000</td>
                        <td className="border border-black p-2">1</td>
                        <td className="border border-black p-2">382,500</td>
                        <td className="border border-black p-2">382,500</td>
                        {template.settings.showTax && (
                            <td className="border border-black p-2">38,250</td>
                        )}
                    </tr>
                </tbody>
            </table>

            {/* 하단 정보 */}
            <div className="flex justify-between">
                <div>
                    {template.settings.showAccountInfo && (
                        <div>
                            <h4 className="font-bold">계좌정보</h4>
                            <div>은행명: {companyInfo.bankName || '[은행명 입력]'}</div>
                            <div>계좌번호: {companyInfo.accountNumber || '[계좌번호 입력]'}</div>
                            <div>예금주: {companyInfo.accountHolder || '[예금주 입력]'}</div>
                        </div>
                    )}
                </div>
                {template.settings.showSignature && (
                    <div className="text-center">
                        <div>공급자 (인)</div>
                        <div className="w-20 h-20 border border-black mt-2 flex items-center justify-center bg-white">
                            {companyInfo.sealImageUrl ? (
                                <img
                                    src={companyInfo.sealImageUrl}
                                    alt="회사 도장"
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : (
                                <span className="text-xs text-gray-400">도장</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="text-blue-600" />
                    거래명세표 템플릿 설정
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                    >
                        <Eye size={16} />
                        {previewMode ? '설정' : '미리보기'}
                    </button>
                    <button
                        onClick={() => onSave(template)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Download size={16} />
                        저장
                    </button>
                </div>
            </div>

            {previewMode ? (
                <PreviewDocument />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 헤더 설정 */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Settings size={18} />
                            헤더 설정
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">문서 제목</label>
                                <input
                                    type="text"
                                    value={template.header.title}
                                    onChange={(e) => updateTemplate('header', 'title', e.target.value)}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={template.header.showDocumentNumber}
                                        onChange={(e) => updateTemplate('header', 'showDocumentNumber', e.target.checked)}
                                    />
                                    문서번호 표시
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={template.header.showIssueDate}
                                        onChange={(e) => updateTemplate('header', 'showIssueDate', e.target.checked)}
                                    />
                                    발행일 표시
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 회사 정보 관리 */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Building size={18} />
                                내 회사 정보
                            </h3>
                            {canEditCompanyInfo && (
                                <button
                                    onClick={() => setEditingCompanyInfo(!editingCompanyInfo)}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingCompanyInfo ? '취소' : '편집'}
                                </button>
                            )}
                        </div>

                        {editingCompanyInfo ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">사업자번호</label>
                                    <input
                                        type="text"
                                        value={companyInfo.businessNumber}
                                        onChange={(e) => updateCompanyInfo('businessNumber', e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">회사명</label>
                                    <input
                                        type="text"
                                        value={companyInfo.name}
                                        onChange={(e) => updateCompanyInfo('name', e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">대표자</label>
                                    <input
                                        type="text"
                                        value={companyInfo.ceo}
                                        onChange={(e) => updateCompanyInfo('ceo', e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">주소</label>
                                    <textarea
                                        value={companyInfo.address}
                                        onChange={(e) => updateCompanyInfo('address', e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                        rows={2}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">업태</label>
                                        <input
                                            type="text"
                                            value={companyInfo.businessType}
                                            onChange={(e) => updateCompanyInfo('businessType', e.target.value)}
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">종목</label>
                                        <input
                                            type="text"
                                            value={companyInfo.businessItem}
                                            onChange={(e) => updateCompanyInfo('businessItem', e.target.value)}
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    </div>
                                </div>

                                {/* 입금 계좌 정보 */}
                                <div className="border-t pt-4 mt-6">
                                    <h4 className="text-md font-medium mb-3 text-gray-800">입금 계좌 정보</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">은행명</label>
                                            <input
                                                type="text"
                                                value={companyInfo.bankName || ''}
                                                onChange={(e) => updateCompanyInfo('bankName', e.target.value)}
                                                className="w-full p-2 border rounded-lg"
                                                placeholder="예: 국민은행"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">계좌번호</label>
                                            <input
                                                type="text"
                                                value={companyInfo.accountNumber || ''}
                                                onChange={(e) => updateCompanyInfo('accountNumber', e.target.value)}
                                                className="w-full p-2 border rounded-lg"
                                                placeholder="예: 123456-78-901234"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">예금주</label>
                                            <input
                                                type="text"
                                                value={companyInfo.accountHolder || ''}
                                                onChange={(e) => updateCompanyInfo('accountHolder', e.target.value)}
                                                className="w-full p-2 border rounded-lg"
                                                placeholder="예: 성현시스템 주식회사"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 도장 이미지 설정 */}
                                <div className="border-t pt-4 mt-6">
                                    <h4 className="text-md font-medium mb-3 text-gray-800">공급자 도장</h4>
                                    <div className="space-y-3">
                                        {/* 현재 도장 이미지 미리보기 */}
                                        {(companyInfo.sealImageUrl || sealPreview) && (
                                            <div className="flex items-center gap-4">
                                                <div className="border border-gray-300 rounded-lg p-2 bg-gray-50">
                                                    <img
                                                        src={sealPreview || companyInfo.sealImageUrl}
                                                        alt="도장 미리보기"
                                                        className="w-16 h-16 object-contain"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-600">현재 도장 이미지</p>
                                                    <button
                                                        onClick={handleSealImageRemove}
                                                        className="text-xs text-red-600 hover:text-red-800 mt-1"
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* 도장 이미지 업로드 */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                도장 이미지 업로드 (.png, .jpg 권장)
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleSealImageUpload}
                                                    className="hidden"
                                                    id="seal-upload"
                                                    disabled={uploadingSeal}
                                                />
                                                <label
                                                    htmlFor="seal-upload"
                                                    className={`px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-sm ${
                                                        uploadingSeal ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                                >
                                                    <Plus size={16} />
                                                    {uploadingSeal ? '업로드 중...' : '이미지 선택'}
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                • 권장 크기: 80x80px 정방형
                                                • 투명 배경 PNG 파일 권장
                                                • 최대 파일 크기: 5MB
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={saveCompanyInfo}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 mt-6"
                                >
                                    회사 정보 저장
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 text-sm text-gray-700">
                                <div><span className="font-medium">사업자번호:</span> {companyInfo.businessNumber || '미입력'}</div>
                                <div><span className="font-medium">회사명:</span> {companyInfo.name || '미입력'}</div>
                                <div><span className="font-medium">대표자:</span> {companyInfo.ceo || '미입력'}</div>
                                <div><span className="font-medium">주소:</span> {companyInfo.address || '미입력'}</div>
                                <div><span className="font-medium">업태:</span> {companyInfo.businessType || '미입력'}</div>
                                <div><span className="font-medium">종목:</span> {companyInfo.businessItem || '미입력'}</div>

                                {/* 입금 계좌 정보 표시 */}
                                <div className="border-t pt-3 mt-3">
                                    <div className="text-xs font-medium text-gray-600 mb-2">입금 계좌 정보</div>
                                    <div><span className="font-medium">은행명:</span> {companyInfo.bankName || '미입력'}</div>
                                    <div><span className="font-medium">계좌번호:</span> {companyInfo.accountNumber || '미입력'}</div>
                                    <div><span className="font-medium">예금주:</span> {companyInfo.accountHolder || '미입력'}</div>
                                </div>

                                {/* 도장 이미지 표시 */}
                                <div className="border-t pt-3 mt-3">
                                    <div className="text-xs font-medium text-gray-600 mb-2">공급자 도장</div>
                                    {companyInfo.sealImageUrl ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 border border-gray-300 rounded bg-gray-50 flex items-center justify-center">
                                                <img
                                                    src={companyInfo.sealImageUrl}
                                                    alt="도장 미리보기"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                            <span className="text-xs text-green-600">✓ 등록됨</span>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500">미등록</div>
                                    )}
                                </div>

                                <div className="text-xs text-gray-500 mt-3">
                                    💡 이 정보는 모든 문서에서 공통으로 사용됩니다.
                                    {!canEditCompanyInfo && (
                                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                                            ⚠️ 회사 정보 수정은 에이전시 관리자(AGENCY_ADMIN) 또는 슈퍼 어드민(SUPER_ADMIN)만 가능합니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 문서 설정 */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold mb-4">문서 설정</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={template.settings.showTax}
                                        onChange={(e) => updateTemplate('settings', 'showTax', e.target.checked)}
                                    />
                                    세액 표시
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={template.settings.showSignature}
                                        onChange={(e) => updateTemplate('settings', 'showSignature', e.target.checked)}
                                    />
                                    서명란 표시
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={template.settings.showAccountInfo}
                                        onChange={(e) => updateTemplate('settings', 'showAccountInfo', e.target.checked)}
                                    />
                                    계좌정보 표시
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">세율 (%)</label>
                                <input
                                    type="number"
                                    value={template.settings.taxRate * 100}
                                    onChange={(e) => updateTemplate('settings', 'taxRate', e.target.value / 100)}
                                    className="w-full p-2 border rounded-lg"
                                    step="1"
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 스타일 설정 */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold mb-4">스타일 설정</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">기본 색상</label>
                                <input
                                    type="color"
                                    value={template.styles.primaryColor}
                                    onChange={(e) => updateTemplate('styles', 'primaryColor', e.target.value)}
                                    className="w-full p-1 border rounded-lg h-10"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">헤더 글자 크기</label>
                                <select
                                    value={template.styles.headerFontSize}
                                    onChange={(e) => updateTemplate('styles', 'headerFontSize', e.target.value)}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    <option value="18px">작게 (18px)</option>
                                    <option value="24px">보통 (24px)</option>
                                    <option value="30px">크게 (30px)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">본문 글자 크기</label>
                                <select
                                    value={template.styles.bodyFontSize}
                                    onChange={(e) => updateTemplate('styles', 'bodyFontSize', e.target.value)}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    <option value="10px">작게 (10px)</option>
                                    <option value="12px">보통 (12px)</option>
                                    <option value="14px">크게 (14px)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentTemplateBuilder;