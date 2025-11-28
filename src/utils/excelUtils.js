import * as XLSX from 'xlsx';

// Excel 컬럼 정의 (순서대로) - 단순화된 7개 필수 컬럼
export const EXCEL_COLUMNS = [
    { key: 'workType', label: '업무 타입', required: true },
    { key: 'productName', label: '제품명', required: true },
    { key: 'quantity', label: '수량', required: true },
    { key: 'startDate', label: '시작일', required: true },
    { key: 'dueDate', label: '마감일', required: true },
    { key: 'budget', label: '매출', required: true },
    { key: 'financialStatus', label: '재무 상태', required: true }
];

// 자동 설정되는 필드 (사용자 입력 불필요)
export const AUTO_FIELDS = {
    cost: 0, // 업무타입 + 제품명으로 자동 매칭
    title: '', // 제품명을 title로 자동 설정
    topicStatus: '미정', // 기본값
    outline: '', // 빈 값
    outlineStatus: '미정', // 기본값
    rejectionReason: '', // 빈 값
    publishedUrl: '' // 빈 값
};

// 유효한 값 정의 (동적으로 API에서 가져올 예정)
export const VALID_VALUES = {
    workType: [], // API에서 동적으로 설정: /api/work-types
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

    // 예시 데이터 행 1: 블로그
    const exampleRow1 = [
        '블로그', // 업무 타입
        '블로그 포스팅', // 제품명
        '1', // 수량
        '2025-01-01', // 시작일
        '2025-01-31', // 마감일
        '200000', // 매출
        '미발행' // 재무 상태
    ];

    // 예시 데이터 행 2: SNS
    const exampleRow2 = [
        'SNS', // 업무 타입
        '인스타그램 포스팅', // 제품명
        '5', // 수량
        '2025-02-01', // 시작일
        '2025-02-28', // 마감일
        '500000', // 매출
        '미발행' // 재무 상태
    ];

    // 예시 데이터 행 3: 비디오
    const exampleRow3 = [
        '비디오', // 업무 타입
        '유튜브 영상', // 제품명
        '2', // 수량
        '2025-03-01', // 시작일
        '2025-03-15', // 마감일
        '800000', // 매출
        '발행완료' // 재무 상태
    ];

    // 워크시트 데이터 생성 (헤더 + 3개 예시)
    const wsData = [
        headers,
        exampleRow1,
        exampleRow2,
        exampleRow3
    ];

    // 워크시트 생성
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // 컬럼 너비 설정
    ws['!cols'] = EXCEL_COLUMNS.map(() => ({ wch: 20 }));

    // 워크북에 워크시트 추가
    XLSX.utils.book_append_sheet(wb, ws, '캠페인 업무');

    // 가이드 시트 생성
    const guideData = [
        ['📋 Excel 일괄 업무 등록 가이드'],
        [],
        ['1. 필수 입력 항목 (7개)'],
        ['컬럼명', '설명', '입력 예시', '비고'],
        ['업무 타입', '업무의 종류', '블로그, SNS, 비디오 등', '상품 관리에 등록된 업무 타입만 사용 가능'],
        ['제품명', '제품 이름', '블로그 포스팅, 인스타그램 포스팅', '업무 타입에 맞는 제품명 입력'],
        ['수량', '업무 수량', '1, 5, 10', '1 이상의 숫자'],
        ['시작일', '업무 시작 날짜', '2025-01-01', 'YYYY-MM-DD 형식'],
        ['마감일', '업무 마감 날짜', '2025-01-31', 'YYYY-MM-DD 형식'],
        ['매출', '예상 매출 금액', '200000, 500000', '0 이상의 숫자 (원)'],
        ['재무 상태', '세금계산서 발행 상태', '미발행, 발행완료, 지급완료', '3가지 중 하나 선택'],
        [],
        ['2. 자동 설정 항목'],
        ['항목', '설명'],
        ['원가 (cost)', '업무 타입 + 제품명으로 자동 매칭'],
        ['업무 내용 (title)', '제품명으로 자동 설정'],
        ['승인 상태', '기본값: 미정'],
        ['세부사항 검토', '빈 값으로 설정'],
        ['세부사항 승인 상태', '기본값: 미정'],
        ['반려 사유', '빈 값으로 설정'],
        ['결과물 링크', '빈 값으로 설정'],
        [],
        ['3. 업무 타입 안내'],
        ['※ 상품 관리 메뉴에 등록된 업무 타입만 사용할 수 있습니다.'],
        ['※ 업무 타입과 제품명이 상품 관리에 등록되어 있어야 원가가 자동으로 매칭됩니다.'],
        [],
        ['4. 재무 상태 설명'],
        ['미발행', '세금계산서를 아직 발행하지 않음'],
        ['발행완료', '세금계산서를 발행했으나 지급은 완료되지 않음'],
        ['지급완료', '세금계산서를 발행하고 지급도 완료됨'],
        [],
        ['5. 주의사항 (⚠️ 필독)'],
        ['• 첫 번째 행(헤더)은 절대 수정하지 마세요.'],
        ['• 모든 7개 컬럼은 필수 입력 항목입니다. 빈 칸이 있으면 업로드가 실패합니다.'],
        ['• 날짜는 반드시 YYYY-MM-DD 형식으로 입력하세요. (예: 2025-01-15)'],
        ['• 숫자 항목(수량, 매출)에는 숫자만 입력하세요. 쉼표나 원 기호는 입력하지 마세요.'],
        [''],
        ['⚠️ 업무 타입 및 제품명 입력 시 주의사항'],
        ['• 업무 타입은 "상품 관리" 메뉴에 등록된 타입명과 100% 일치해야 합니다.'],
        ['• 제품명도 "상품 관리" 메뉴에 등록된 제품명과 100% 일치해야 합니다.'],
        ['• 띄어쓰기, 대소문자, 특수문자까지 정확히 일치해야 합니다.'],
        ['• 등록되지 않은 업무 타입이나 제품명은 업로드가 거부됩니다.'],
        ['• 업무 타입과 제품명이 일치하지 않으면 원가가 자동 매칭되지 않습니다.'],
        [''],
        ['💡 올바른 업무 타입과 제품명을 확인하는 방법:'],
        ['1. BrandFlow에 로그인합니다.'],
        ['2. "상품 관리" 메뉴로 이동합니다.'],
        ['3. 등록된 업무 타입과 제품명을 정확히 확인하여 복사합니다.'],
        ['4. Excel에 붙여넣기하여 사용합니다.']
    ];

    const guideWs = XLSX.utils.aoa_to_sheet(guideData);

    // 가이드 시트 컬럼 너비 설정
    guideWs['!cols'] = [
        { wch: 25 },  // 첫 번째 컬럼
        { wch: 40 },  // 두 번째 컬럼
        { wch: 30 },  // 세 번째 컬럼
        { wch: 50 }   // 네 번째 컬럼
    ];

    XLSX.utils.book_append_sheet(wb, guideWs, '사용 가이드');

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
 * @param {Array} products - 제품 목록 (제품명 검증용, optional)
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateExcelData = (rows, products = []) => {
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

        // 업무 타입 검증 (상품 관리에 등록된 타입만 허용)
        if (row.workType && VALID_VALUES.workType.length > 0 && !VALID_VALUES.workType.includes(row.workType)) {
            rowErrors.push(`업무 타입 "${row.workType}"은(는) 상품 관리에 등록되지 않았습니다. 등록된 업무 타입: ${VALID_VALUES.workType.join(', ')}`);
        }

        // 제품명 검증 (상품 관리에 등록된 제품만 허용)
        if (row.productName && row.workType && products.length > 0) {
            // 해당 업무 타입의 제품 목록 조회
            const validProducts = products.filter(p => p.category === row.workType);
            const productNames = validProducts.map(p => p.name);

            if (productNames.length > 0 && !productNames.includes(row.productName)) {
                rowErrors.push(`제품명 "${row.productName}"은(는) 업무 타입 "${row.workType}"에 등록되지 않았습니다. 등록된 제품: ${productNames.join(', ')}`);
            }
        }

        // 수량 검증 (양수)
        if (row.quantity !== '' && (isNaN(Number(row.quantity)) || Number(row.quantity) <= 0)) {
            rowErrors.push('수량은 1 이상의 숫자여야 합니다.');
        }

        // 매출 검증 (0 이상 숫자)
        if (row.budget !== '' && (isNaN(Number(row.budget)) || Number(row.budget) < 0)) {
            rowErrors.push('매출은 0 이상의 숫자여야 합니다.');
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
 * 업무 타입과 제품명으로 원가 찾기
 * @param {string} workType - 업무 타입
 * @param {string} productName - 제품명
 * @param {Array} products - 제품 목록
 * @returns {number} 매칭된 원가 (찾지 못하면 0)
 */
export const findProductCost = (workType, productName, products) => {
    if (!products || products.length === 0) return 0;

    // category(업무타입) + name(제품명) 매칭
    const matchedProduct = products.find(
        product => product.category === workType && product.name === productName
    );

    return matchedProduct?.costPrice || 0;
};

/**
 * Excel 데이터를 API 형식으로 변환
 * @param {Array} rows - 파싱된 데이터 배열
 * @param {number} campaignId - 캠페인 ID
 * @param {Array} products - 제품 목록 (원가 자동 매칭용, optional)
 * @returns {Array} API 요청 형식 배열
 */
export const convertToApiFormat = (rows, campaignId, products = []) => {
    return rows.map(row => {
        // 재무 상태 파싱
        const invoiceIssued = row.financialStatus === '발행완료' || row.financialStatus === '지급완료';
        const paymentCompleted = row.financialStatus === '지급완료';

        // 업무타입 + 제품명으로 원가 자동 매칭
        const matchedCost = findProductCost(row.workType, row.productName, products);

        return {
            campaignId,
            workType: row.workType,
            productName: row.productName,
            quantity: Number(row.quantity),
            cost: matchedCost, // 업무타입 + 제품명으로 자동 매칭된 원가
            title: row.productName, // 제품명을 title로 자동 설정
            startDate: convertExcelDate(row.startDate),
            dueDate: convertExcelDate(row.dueDate),
            topicStatus: AUTO_FIELDS.topicStatus,
            outline: AUTO_FIELDS.outline,
            outlineStatus: AUTO_FIELDS.outlineStatus,
            rejectionReason: AUTO_FIELDS.rejectionReason,
            budget: Number(row.budget),
            invoiceIssued,
            paymentCompleted,
            publishedUrl: AUTO_FIELDS.publishedUrl
        };
    });
};
