import * as XLSX from 'xlsx';

// Excel 컬럼 정의 (순서대로)
export const EXCEL_COLUMNS = [
    { key: 'workType', label: '업무 타입', required: true },
    { key: 'productName', label: '제품명', required: true },
    { key: 'quantity', label: '수량', required: true },
    { key: 'cost', label: '원가', required: true },
    { key: 'title', label: '업무 내용', required: true },
    { key: 'startDate', label: '시작일', required: true },
    { key: 'dueDate', label: '마감일', required: true },
    { key: 'topicStatus', label: '승인 상태', required: true },
    { key: 'outline', label: '세부사항 검토', required: true },
    { key: 'outlineStatus', label: '세부사항 승인 상태', required: true },
    { key: 'rejectionReason', label: '반려 사유', required: true },
    { key: 'budget', label: '매출', required: true },
    { key: 'financialStatus', label: '재무 상태', required: true },
    { key: 'publishedUrl', label: '결과물 링크', required: true }
];

// 유효한 값 정의
export const VALID_VALUES = {
    workType: ['블로그', '인스타그램', '유튜브', '기타'],
    topicStatus: ['미정', '대기', '승인', '반려'],
    outlineStatus: ['미정', '대기', '승인', '반려'],
    financialStatus: ['미발행', '발행완료', '지급완료']
};

/**
 * Excel 템플릿 다운로드
 */
export const downloadExcelTemplate = () => {
    // 워크북 생성
    const wb = XLSX.utils.book_new();

    // 헤더 행 생성
    const headers = EXCEL_COLUMNS.map(col => col.label);

    // 예시 데이터 행 (선택 가능 값 표시)
    const exampleRow = [
        '블로그', // 업무 타입
        '샘플 제품', // 제품명
        '1', // 수량
        '100000', // 원가
        '블로그 포스팅 작성', // 업무 내용
        '2025-01-01', // 시작일
        '2025-01-31', // 마감일
        '미정', // 승인 상태
        '샘플 세부사항', // 세부사항 검토
        '미정', // 세부사항 승인 상태
        '', // 반려 사유
        '200000', // 매출
        '미발행', // 재무 상태
        '' // 결과물 링크
    ];

    // 워크시트 데이터 생성
    const wsData = [
        headers,
        exampleRow
    ];

    // 워크시트 생성
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // 컬럼 너비 설정
    ws['!cols'] = EXCEL_COLUMNS.map(() => ({ wch: 20 }));

    // 워크북에 워크시트 추가
    XLSX.utils.book_append_sheet(wb, ws, '캠페인 업무');

    // 파일 다운로드
    const fileName = `캠페인_업무_템플릿_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
};

/**
 * Excel 파일 파싱
 * @param {File} file - 업로드된 Excel 파일
 * @returns {Promise<Array>} 파싱된 데이터 배열
 */
export const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // 첫 번째 시트 가져오기
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // JSON으로 변환
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    reject(new Error('Excel 파일에 데이터가 없습니다.'));
                    return;
                }

                // 헤더 검증
                const headers = jsonData[0];
                const expectedHeaders = EXCEL_COLUMNS.map(col => col.label);

                const headersMatch = expectedHeaders.every((header, index) =>
                    headers[index] === header
                );

                if (!headersMatch) {
                    reject(new Error('Excel 템플릿 형식이 올바르지 않습니다. 템플릿을 다시 다운로드해주세요.'));
                    return;
                }

                // 데이터 행 파싱 (헤더 제외)
                const rows = jsonData.slice(1)
                    .filter(row => row.some(cell => cell !== undefined && cell !== ''))
                    .map((row, index) => {
                        const rowData = { rowNumber: index + 2 }; // Excel 행 번호 (1-based + 헤더)

                        EXCEL_COLUMNS.forEach((col, colIndex) => {
                            rowData[col.key] = row[colIndex] !== undefined ? row[colIndex] : '';
                        });

                        return rowData;
                    });

                resolve(rows);
            } catch (error) {
                reject(new Error('Excel 파일을 읽는 중 오류가 발생했습니다: ' + error.message));
            }
        };

        reader.onerror = () => {
            reject(new Error('파일을 읽을 수 없습니다.'));
        };

        reader.readAsArrayBuffer(file);
    });
};

/**
 * 데이터 유효성 검증
 * @param {Array} rows - 파싱된 데이터 배열
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateExcelData = (rows) => {
    const errors = [];

    rows.forEach((row) => {
        const rowErrors = [];

        // 필수 필드 검증
        EXCEL_COLUMNS.forEach(col => {
            if (col.required) {
                const value = row[col.key];
                if (value === undefined || value === null || value === '') {
                    rowErrors.push(`${col.label}은(는) 필수 항목입니다.`);
                }
            }
        });

        // 업무 타입 검증
        if (row.workType && !VALID_VALUES.workType.includes(row.workType)) {
            rowErrors.push(`업무 타입은 ${VALID_VALUES.workType.join(', ')} 중 하나여야 합니다.`);
        }

        // 수량 검증 (숫자)
        if (row.quantity !== '' && isNaN(Number(row.quantity))) {
            rowErrors.push('수량은 숫자여야 합니다.');
        }

        // 원가 검증 (숫자)
        if (row.cost !== '' && isNaN(Number(row.cost))) {
            rowErrors.push('원가는 숫자여야 합니다.');
        }

        // 매출 검증 (숫자)
        if (row.budget !== '' && isNaN(Number(row.budget))) {
            rowErrors.push('매출은 숫자여야 합니다.');
        }

        // 날짜 검증
        const dateFields = ['startDate', 'dueDate'];
        dateFields.forEach(field => {
            if (row[field]) {
                const dateStr = String(row[field]);
                // YYYY-MM-DD 형식 또는 Excel 날짜 숫자 허용
                const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !isNaN(Date.parse(dateStr));
                if (!isValidDate) {
                    const label = EXCEL_COLUMNS.find(col => col.key === field)?.label;
                    rowErrors.push(`${label}은(는) YYYY-MM-DD 형식이어야 합니다.`);
                }
            }
        });

        // 승인 상태 검증
        if (row.topicStatus && !VALID_VALUES.topicStatus.includes(row.topicStatus)) {
            rowErrors.push(`승인 상태는 ${VALID_VALUES.topicStatus.join(', ')} 중 하나여야 합니다.`);
        }

        // 세부사항 승인 상태 검증
        if (row.outlineStatus && !VALID_VALUES.outlineStatus.includes(row.outlineStatus)) {
            rowErrors.push(`세부사항 승인 상태는 ${VALID_VALUES.outlineStatus.join(', ')} 중 하나여야 합니다.`);
        }

        // 재무 상태 검증
        if (row.financialStatus && !VALID_VALUES.financialStatus.includes(row.financialStatus)) {
            rowErrors.push(`재무 상태는 ${VALID_VALUES.financialStatus.join(', ')} 중 하나여야 합니다.`);
        }

        if (rowErrors.length > 0) {
            errors.push({
                rowNumber: row.rowNumber,
                errors: rowErrors
            });
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Excel 날짜를 JavaScript Date로 변환
 * @param {*} excelDate - Excel 날짜 값
 * @returns {string} YYYY-MM-DD 형식 문자열
 */
export const convertExcelDate = (excelDate) => {
    if (!excelDate) return '';

    // 이미 문자열 형식이면 그대로 반환
    if (typeof excelDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
        return excelDate;
    }

    // Excel 날짜 숫자를 Date로 변환
    if (typeof excelDate === 'number') {
        const date = XLSX.SSF.parse_date_code(excelDate);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }

    // 기타 형식 시도
    try {
        const date = new Date(excelDate);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {
        // 변환 실패
    }

    return '';
};

/**
 * Excel 데이터를 API 형식으로 변환
 * @param {Array} rows - 파싱된 데이터 배열
 * @param {number} campaignId - 캠페인 ID
 * @returns {Array} API 요청 형식 배열
 */
export const convertToApiFormat = (rows, campaignId) => {
    return rows.map(row => {
        // 재무 상태 파싱
        const invoiceIssued = row.financialStatus === '발행완료' || row.financialStatus === '지급완료';
        const paymentCompleted = row.financialStatus === '지급완료';

        return {
            campaignId,
            workType: row.workType,
            productName: row.productName,
            quantity: Number(row.quantity),
            cost: Number(row.cost),
            title: row.title,
            startDate: convertExcelDate(row.startDate),
            dueDate: convertExcelDate(row.dueDate),
            topicStatus: row.topicStatus,
            outline: row.outline,
            outlineStatus: row.outlineStatus,
            rejectionReason: row.rejectionReason || '',
            budget: Number(row.budget),
            invoiceIssued,
            paymentCompleted,
            publishedUrl: row.publishedUrl || ''
        };
    });
};
