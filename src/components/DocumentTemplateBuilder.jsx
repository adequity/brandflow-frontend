import React, { useState, useEffect } from 'react';
import { FileText, Plus, Minus, Download, Eye, Settings, Building } from 'lucide-react';
import api from '../api/client';

const DocumentTemplateBuilder = ({ onSave, initialTemplate = null }) => {
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
        businessItem: ""
    });

    const [previewMode, setPreviewMode] = useState(false);
    const [editingCompanyInfo, setEditingCompanyInfo] = useState(false);

    // 회사 정보 로드
    useEffect(() => {
        fetchCompanyInfo();
    }, []);

    const fetchCompanyInfo = async () => {
        try {
            const response = await api.get('/api/admin/system-settings/?category=company_info');
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
                            <div>입금계좌: [계좌정보 입력]</div>
                        </div>
                    )}
                </div>
                {template.settings.showSignature && (
                    <div className="text-center">
                        <div>공급자 (인)</div>
                        <div className="w-20 h-20 border border-black mt-2"></div>
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
                            <button
                                onClick={() => setEditingCompanyInfo(!editingCompanyInfo)}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {editingCompanyInfo ? '취소' : '편집'}
                            </button>
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
                                <button
                                    onClick={saveCompanyInfo}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                                >
                                    회사 정보 저장
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2 text-sm text-gray-700">
                                <div><span className="font-medium">사업자번호:</span> {companyInfo.businessNumber}</div>
                                <div><span className="font-medium">회사명:</span> {companyInfo.name}</div>
                                <div><span className="font-medium">대표자:</span> {companyInfo.ceo}</div>
                                <div><span className="font-medium">주소:</span> {companyInfo.address}</div>
                                <div><span className="font-medium">업태:</span> {companyInfo.businessType}</div>
                                <div><span className="font-medium">종목:</span> {companyInfo.businessItem}</div>
                                <div className="text-xs text-gray-500 mt-3">
                                    💡 이 정보는 모든 문서에서 공통으로 사용됩니다.
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