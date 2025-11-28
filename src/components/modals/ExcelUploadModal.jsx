import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from 'lucide-react';
import {
    downloadExcelTemplate,
    parseExcelFile,
    validateExcelData,
    convertToApiFormat,
    EXCEL_COLUMNS,
    VALID_VALUES
} from '../../utils/excelUtils';
import { API_BASE_URL } from '../../api/client';

const ExcelUploadModal = ({ campaignId, onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [uploadResults, setUploadResults] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [workTypes, setWorkTypes] = useState([]); // 업무 타입 목록 (템플릿 다운로드용)
    const [products, setProducts] = useState([]); // 제품 목록 (원가 매칭용)
    const fileInputRef = useRef(null);

    // 컴포넌트 마운트 시 업무 타입과 제품 목록 가져오기
    useEffect(() => {
        const fetchWorkTypes = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/work-types`);
                if (response.ok) {
                    const data = await response.json();
                    setWorkTypes(data); // 전체 데이터 저장 (템플릿 다운로드용)
                    // VALID_VALUES.workType 배열을 동적으로 설정
                    VALID_VALUES.workType = data.map(item => item.name);
                    console.log('✅ 업무 타입 로드 완료:', VALID_VALUES.workType);
                } else {
                    console.error('❌ 업무 타입 로드 실패:', response.status);
                }
            } catch (error) {
                console.error('❌ 업무 타입 API 호출 오류:', error);
            }
        };

        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    console.warn('⚠️ 인증 토큰이 없어 제품 목록을 가져올 수 없습니다.');
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/products/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const productList = data.products || data;
                    setProducts(productList);
                    console.log('✅ 제품 목록 로드 완료:', productList.length, '개');
                } else {
                    console.error('❌ 제품 목록 로드 실패:', response.status);
                }
            } catch (error) {
                console.error('❌ 제품 API 호출 오류:', error);
            }
        };

        fetchWorkTypes();
        fetchProducts();
    }, []);

    // 파일 선택 핸들러
    const handleFileChange = async (selectedFile) => {
        if (!selectedFile) return;

        // 파일 형식 검증
        const validExtensions = ['.xlsx', '.xls'];
        const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

        if (!validExtensions.includes(fileExtension)) {
            alert('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.');
            return;
        }

        setFile(selectedFile);
        setValidationErrors([]);
        setUploadResults(null);
        setIsValidating(true);

        try {
            // Excel 파일 파싱
            const rows = await parseExcelFile(selectedFile);
            setParsedData(rows);

            // 데이터 유효성 검증 (제품 목록도 함께 전달하여 제품명 검증)
            const validation = validateExcelData(rows, products);
            if (!validation.valid) {
                setValidationErrors(validation.errors);
            }
        } catch (error) {
            alert(error.message);
            setFile(null);
            setParsedData([]);
        } finally {
            setIsValidating(false);
        }
    };

    // 드래그 앤 드롭 핸들러
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileChange(droppedFile);
        }
    };

    // 파일 선택 버튼 클릭
    const handleFileInputClick = () => {
        fileInputRef.current?.click();
    };

    // 파일 초기화
    const handleReset = () => {
        setFile(null);
        setParsedData([]);
        setValidationErrors([]);
        setUploadResults(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 업로드 실행
    const handleUpload = async () => {
        if (validationErrors.length > 0) {
            alert('유효성 검증 오류를 해결해주세요.');
            return;
        }

        setIsUploading(true);
        setUploadProgress({ current: 0, total: parsedData.length });

        const results = {
            success: [],
            failed: []
        };

        try {
            // API 형식으로 변환 (제품 목록 전달하여 원가 자동 매칭)
            const apiData = convertToApiFormat(parsedData, campaignId, products);

            // 각 행을 개별적으로 업로드
            for (let i = 0; i < apiData.length; i++) {
                try {
                    const token = localStorage.getItem('authToken');
                    const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/posts/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(apiData[i])
                    });

                    if (response.ok) {
                        results.success.push({
                            rowNumber: parsedData[i].rowNumber,
                            title: parsedData[i].title
                        });
                    } else {
                        let errorMessage = '업로드 실패';
                        try {
                            const errorData = await response.json();
                            errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
                        } catch (e) {
                            const errorText = await response.text();
                            errorMessage = `HTTP ${response.status}: ${errorText.substring(0, 100)}`;
                        }
                        results.failed.push({
                            rowNumber: parsedData[i].rowNumber,
                            title: parsedData[i].title,
                            error: errorMessage
                        });
                    }
                } catch (error) {
                    results.failed.push({
                        rowNumber: parsedData[i].rowNumber,
                        title: parsedData[i].title,
                        error: error.message
                    });
                }

                setUploadProgress({ current: i + 1, total: parsedData.length });
            }

            setUploadResults(results);

            // 모두 성공한 경우 자동으로 모달 닫기
            if (results.failed.length === 0) {
                setTimeout(() => {
                    onSuccess?.();
                    onClose();
                }, 1500);
            }
        } catch (error) {
            alert('업로드 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FileSpreadsheet className="text-blue-600" size={28} />
                            Excel 일괄 업무 등록
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Excel 파일을 업로드하여 여러 업무를 한 번에 등록하세요
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        disabled={isUploading}
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* 템플릿 다운로드 안내 */}
                <div className="p-6 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">📋 템플릿 다운로드</h3>
                            <p className="text-sm text-gray-700">
                                먼저 Excel 템플릿을 다운로드하여 양식에 맞게 데이터를 입력해주세요.
                                모든 컬럼은 필수 항목입니다.
                            </p>
                        </div>
                        <button
                            onClick={() => downloadExcelTemplate(workTypes, products)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
                        >
                            <Download size={18} />
                            템플릿 다운로드
                        </button>
                    </div>
                </div>

                {/* 파일 업로드 영역 */}
                {!file && (
                    <div className="flex-1 p-6">
                        <div
                            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                                isDragging
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <Upload size={64} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Excel 파일을 드래그하거나 클릭하여 업로드
                            </h3>
                            <p className="text-gray-600 mb-6">
                                .xlsx, .xls 파일을 지원합니다
                            </p>
                            <button
                                onClick={handleFileInputClick}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg hover:shadow-xl"
                            >
                                파일 선택
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => handleFileChange(e.target.files[0])}
                                className="hidden"
                            />
                        </div>
                    </div>
                )}

                {/* 데이터 미리보기 및 유효성 검증 */}
                {file && !uploadResults && (
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* 파일 정보 */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="text-green-600" size={24} />
                                <div>
                                    <p className="font-semibold text-gray-900">{file.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {parsedData.length}개 행 감지됨
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={isUploading}
                            >
                                파일 변경
                            </button>
                        </div>

                        {/* 유효성 검증 결과 */}
                        {isValidating && (
                            <div className="text-center py-8">
                                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-gray-600">데이터 검증 중...</p>
                            </div>
                        )}

                        {!isValidating && validationErrors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-red-900 mb-2">
                                            유효성 검증 오류 ({validationErrors.length}개)
                                        </h4>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {validationErrors.map((error, index) => (
                                                <div key={index} className="text-sm">
                                                    <p className="font-medium text-red-800">
                                                        행 {error.rowNumber}:
                                                    </p>
                                                    <ul className="list-disc list-inside ml-4 text-red-700">
                                                        {error.errors.map((err, i) => (
                                                            <li key={i}>{err}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isValidating && validationErrors.length === 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="text-green-600" size={24} />
                                    <div>
                                        <h4 className="font-semibold text-green-900">
                                            유효성 검증 통과
                                        </h4>
                                        <p className="text-sm text-green-700">
                                            모든 데이터가 올바른 형식입니다. 업로드를 진행하세요.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 데이터 미리보기 테이블 */}
                        {parsedData.length > 0 && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto max-h-96">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                                                    행
                                                </th>
                                                {EXCEL_COLUMNS.map(col => (
                                                    <th
                                                        key={col.key}
                                                        className="px-3 py-2 text-left font-semibold text-gray-700 border-b whitespace-nowrap"
                                                    >
                                                        {col.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.map((row, index) => (
                                                <tr
                                                    key={index}
                                                    className={`border-b hover:bg-gray-50 ${
                                                        validationErrors.some(err => err.rowNumber === row.rowNumber)
                                                            ? 'bg-red-50'
                                                            : ''
                                                    }`}
                                                >
                                                    <td className="px-3 py-2 text-gray-600 font-medium">
                                                        {row.rowNumber}
                                                    </td>
                                                    {EXCEL_COLUMNS.map(col => (
                                                        <td key={col.key} className="px-3 py-2 text-gray-800">
                                                            {row[col.key] || '-'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 업로드 결과 */}
                {uploadResults && (
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-4">
                            {/* 성공 통계 */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <CheckCircle className="text-green-600" size={32} />
                                    <div>
                                        <h3 className="text-xl font-bold text-green-900">
                                            업로드 완료
                                        </h3>
                                        <p className="text-green-700">
                                            {uploadResults.success.length}개 성공, {uploadResults.failed.length}개 실패
                                        </p>
                                    </div>
                                </div>

                                {uploadResults.success.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-green-900 mb-2">
                                            ✓ 성공한 업무 ({uploadResults.success.length}개)
                                        </h4>
                                        <div className="max-h-40 overflow-y-auto">
                                            {uploadResults.success.map((item, index) => (
                                                <p key={index} className="text-sm text-green-700">
                                                    행 {item.rowNumber}: {item.title}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 실패 목록 */}
                            {uploadResults.failed.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                    <h4 className="font-semibold text-red-900 mb-3">
                                        ✗ 실패한 업무 ({uploadResults.failed.length}개)
                                    </h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {uploadResults.failed.map((item, index) => (
                                            <div key={index} className="text-sm">
                                                <p className="font-medium text-red-800">
                                                    행 {item.rowNumber}: {item.title}
                                                </p>
                                                <p className="text-red-700 ml-4">
                                                    오류: {item.error}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 푸터 */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    {isUploading && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                    업로드 진행 중...
                                </span>
                                <span className="text-sm text-gray-600">
                                    {uploadProgress.current} / {uploadProgress.total}
                                </span>
                            </div>
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
                                    style={{
                                        width: `${(uploadProgress.current / uploadProgress.total) * 100}%`
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            {file && !uploadResults && parsedData.length > 0 && (
                                <span>
                                    {parsedData.length}개 업무가 등록됩니다
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                disabled={isUploading}
                            >
                                {uploadResults ? '닫기' : '취소'}
                            </button>
                            {file && !uploadResults && (
                                <button
                                    onClick={handleUpload}
                                    disabled={
                                        isUploading ||
                                        isValidating ||
                                        validationErrors.length > 0 ||
                                        parsedData.length === 0
                                    }
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl"
                                >
                                    {isUploading ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            업로드 중...
                                        </span>
                                    ) : (
                                        `${parsedData.length}개 업무 등록`
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExcelUploadModal;
