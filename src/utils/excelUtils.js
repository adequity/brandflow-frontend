import * as XLSX from 'xlsx-js-style';

// Excel 컬럼 정의 (순서대로) - 8개 필수 컬럼
export const EXCEL_COLUMNS = [
    { key: 'workType', label: '업무 타입', required: true },
    { key: 'productName', label: '제품명', required: true },
    { key: 'title', label: '업무내용', required: true },
    { key: 'quantity', label: '수량', required: true },
    { key: 'startDate', label: '시작일', required: true },
    { key: 'dueDate', label: '마감일', required: true },
    { key: 'budget', label: '매출', required: true },
    { key: 'financialStatus', label: '재무 상태', required: true }
];

// 자동 설정되는 필드 (사용자 입력 불필요)
export const AUTO_FIELDS = {
    cost: 0, // 업무타입 + 제품명으로 자동 매칭
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
 * @param {Array} workTypes - 업무 타입 목록 (API에서 가져온 데이터)
 * @param {Array} products - 제품 목록 (API에서 가져온 데이터)
 */
export const downloadExcelTemplate = (workTypes = [], products = []) => {
    // 워크북 생성
    const wb = XLSX.utils.book_new();

    // 헤더 행 생성
    const headers = EXCEL_COLUMNS.map(col => col.label);

    // 예시 데이터 행 1: 블로그
    const exampleRow1 = [
        '블로그', // 업무 타입
        '블로그 포스팅', // 제품명
        '신제품 리뷰 작성', // 업무내용
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
        'SNS 이벤트 홍보', // 업무내용
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
        '브랜드 소개 영상 제작', // 업무내용
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

    // 헤더 스타일 적용 (1행)
    const headerStyle = {
        fill: { fgColor: { rgb: "4472C4" } }, // 파란색 배경
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 }, // 흰색 굵은 글씨
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        }
    };

    // 예시 데이터 스타일 (2-4행)
    const exampleStyle = {
        fill: { fgColor: { rgb: "E7E6E6" } }, // 연한 회색 배경
        alignment: { horizontal: "left", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "D3D3D3" } },
            bottom: { style: "thin", color: { rgb: "D3D3D3" } },
            left: { style: "thin", color: { rgb: "D3D3D3" } },
            right: { style: "thin", color: { rgb: "D3D3D3" } }
        }
    };

    // 헤더 셀에 스타일 적용
    EXCEL_COLUMNS.forEach((col, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
        if (!ws[cellAddress]) ws[cellAddress] = {};
        ws[cellAddress].s = headerStyle;
    });

    // 예시 데이터 행에 스타일 적용
    for (let row = 1; row <= 3; row++) {
        EXCEL_COLUMNS.forEach((col, colIndex) => {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: colIndex });
            if (!ws[cellAddress]) ws[cellAddress] = {};
            ws[cellAddress].s = exampleStyle;
        });
    }

    // 워크북에 워크시트 추가
    XLSX.utils.book_append_sheet(wb, ws, '캠페인 업무');

    // 가이드 시트 생성
    const guideData = [
        ['📋 Excel 일괄 업무 등록 가이드'],
        [],
        ['1. 필수 입력 항목 (8개)'],
        ['컬럼명', '설명', '입력 예시', '비고'],
        ['업무 타입', '업무의 종류', '블로그, SNS, 비디오 등', '상품 관리에 등록된 업무 타입만 사용 가능'],
        ['제품명', '제품 이름', '블로그 포스팅, 인스타그램 포스팅', '업무 타입에 맞는 제품명 입력'],
        ['업무내용', '업무의 구체적 내용', '신제품 리뷰 작성, SNS 이벤트 홍보', '실제 수행할 업무 내용 설명'],
        ['수량', '업무 수량', '1, 5, 10', '1 이상의 숫자'],
        ['시작일', '업무 시작 날짜', '2025-01-01', 'YYYY-MM-DD 형식'],
        ['마감일', '업무 마감 날짜', '2025-01-31', 'YYYY-MM-DD 형식'],
        ['매출', '예상 매출 금액', '200000, 500000', '0 이상의 숫자 (원)'],
        ['재무 상태', '세금계산서 발행 상태', '미발행, 발행완료, 지급완료', '3가지 중 하나 선택'],
        [],
        ['2. 자동 설정 항목'],
        ['항목', '설명'],
        ['원가 (cost)', '업무 타입 + 제품명으로 자동 매칭'],
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
        ['• 모든 8개 컬럼은 필수 입력 항목입니다. 빈 칸이 있으면 업로드가 실패합니다.'],
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

    // 가이드 시트 스타일 정의
    const guideTitleStyle = {
        fill: { fgColor: { rgb: "2E75B6" } }, // 진한 파란색
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
        alignment: { horizontal: "center", vertical: "center" }
    };

    const guideSectionStyle = {
        fill: { fgColor: { rgb: "44546A" } }, // 진한 회색
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        alignment: { horizontal: "left", vertical: "center" }
    };

    const guideTableHeaderStyle = {
        fill: { fgColor: { rgb: "4472C4" } }, // 파란색
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        }
    };

    const guideTableCellStyle = {
        alignment: { horizontal: "left", vertical: "center", wrapText: true },
        border: {
            top: { style: "thin", color: { rgb: "D3D3D3" } },
            bottom: { style: "thin", color: { rgb: "D3D3D3" } },
            left: { style: "thin", color: { rgb: "D3D3D3" } },
            right: { style: "thin", color: { rgb: "D3D3D3" } }
        }
    };

    const guideWarningStyle = {
        fill: { fgColor: { rgb: "FFF2CC" } }, // 연한 노란색
        font: { bold: true, color: { rgb: "C65911" }, sz: 10 }, // 주황색 글씨
        alignment: { horizontal: "left", vertical: "center" }
    };

    const guideTipStyle = {
        fill: { fgColor: { rgb: "E2EFDA" } }, // 연한 녹색
        font: { bold: true, color: { rgb: "385723" }, sz: 10 }, // 진한 녹색 글씨
        alignment: { horizontal: "left", vertical: "center" }
    };

    // 가이드 시트 스타일 적용
    // 제목 (0행)
    const guideTitleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (!guideWs[guideTitleCell]) guideWs[guideTitleCell] = {};
    guideWs[guideTitleCell].s = guideTitleStyle;

    // 섹션 제목들 (2, 7, 12, 17, 22행)
    const sectionRows = [2, 12, 17, 21, 26];
    sectionRows.forEach(rowIndex => {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
        if (guideWs[cellAddress]) {
            guideWs[cellAddress].s = guideSectionStyle;
        }
    });

    // 테이블 헤더들
    // 1. 필수 입력 항목 테이블 헤더 (3행)
    for (let col = 0; col < 4; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 3, c: col });
        if (guideWs[cellAddress]) {
            guideWs[cellAddress].s = guideTableHeaderStyle;
        }
    }

    // 1. 필수 입력 항목 테이블 데이터 (4-11행) - 8개 항목으로 증가
    for (let row = 4; row <= 11; row++) {
        for (let col = 0; col < 4; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (guideWs[cellAddress]) {
                guideWs[cellAddress].s = guideTableCellStyle;
            }
        }
    }

    // 2. 자동 설정 항목 테이블 헤더 (14행) - 행 번호 조정
    for (let col = 0; col < 2; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 14, c: col });
        if (guideWs[cellAddress]) {
            guideWs[cellAddress].s = guideTableHeaderStyle;
        }
    }

    // 2. 자동 설정 항목 테이블 데이터 (15-20행) - 항목이 6개로 감소
    for (let row = 15; row <= 20; row++) {
        for (let col = 0; col < 2; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (guideWs[cellAddress]) {
                guideWs[cellAddress].s = guideTableCellStyle;
            }
        }
    }

    // 4. 재무 상태 설명 테이블 데이터 (28-30행) - 행 번호 조정
    for (let row = 28; row <= 30; row++) {
        for (let col = 0; col < 2; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (guideWs[cellAddress]) {
                guideWs[cellAddress].s = guideTableCellStyle;
            }
        }
    }

    // ⚠️ 주의사항 스타일 적용 (32-38행, 40-44행) - 행 번호 조정
    const warningRows = [32, 33, 34, 35, 36, 40, 41, 42, 43, 44];
    warningRows.forEach(rowIndex => {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
        if (guideWs[cellAddress]) {
            guideWs[cellAddress].s = guideWarningStyle;
        }
    });

    // 💡 팁 스타일 적용 (46-50행) - 행 번호 조정
    const tipRows = [46, 47, 48, 49, 50];
    tipRows.forEach(rowIndex => {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
        if (guideWs[cellAddress]) {
            guideWs[cellAddress].s = guideTipStyle;
        }
    });

    // 가이드 시트 컬럼 너비 설정
    guideWs['!cols'] = [
        { wch: 25 },  // 첫 번째 컬럼
        { wch: 40 },  // 두 번째 컬럼
        { wch: 30 },  // 세 번째 컬럼
        { wch: 50 }   // 네 번째 컬럼
    ];

    // 행 높이 설정
    guideWs['!rows'] = [];
    guideWs['!rows'][0] = { hpt: 25 }; // 제목 행 높이

    XLSX.utils.book_append_sheet(wb, guideWs, '사용 가이드');

    // 사용 가능한 값 목록 시트 생성
    const availableValuesData = [
        ['📋 현재 사용 가능한 업무 타입 및 제품명 목록'],
        [],
        ['※ 이 목록은 현재 로그인한 계정의 "상품 관리"에 등록된 데이터입니다.'],
        ['※ Excel 업로드 시 아래 목록에 있는 값만 사용 가능합니다.'],
        []
    ];

    // 업무 타입 목록 추가
    if (workTypes.length > 0) {
        availableValuesData.push(['1. 사용 가능한 업무 타입']);
        availableValuesData.push(['번호', '업무 타입']);
        workTypes.forEach((type, index) => {
            availableValuesData.push([index + 1, type.name || type]);
        });
        availableValuesData.push([]);
    } else {
        availableValuesData.push(['1. 사용 가능한 업무 타입']);
        availableValuesData.push(['⚠️ 등록된 업무 타입이 없습니다. 상품 관리 메뉴에서 먼저 업무 타입을 등록해주세요.']);
        availableValuesData.push([]);
    }

    // 제품 목록을 업무 타입별로 그룹화
    if (products.length > 0) {
        availableValuesData.push(['2. 사용 가능한 제품명 (업무 타입별)']);
        availableValuesData.push([]);

        // 업무 타입별로 제품 분류
        const productsByType = {};
        products.forEach(product => {
            const category = product.category || '기타';
            if (!productsByType[category]) {
                productsByType[category] = [];
            }
            productsByType[category].push(product);
        });

        // 업무 타입별로 제품 목록 추가
        Object.entries(productsByType).forEach(([category, categoryProducts]) => {
            availableValuesData.push([`📌 ${category}`]);
            availableValuesData.push(['번호', '제품명', '원가', '판매가']);
            categoryProducts.forEach((product, index) => {
                availableValuesData.push([
                    index + 1,
                    product.name,
                    product.costPrice ? `${product.costPrice.toLocaleString()}원` : '-',
                    product.sellingPrice ? `${product.sellingPrice.toLocaleString()}원` : '-'
                ]);
            });
            availableValuesData.push([]);
        });
    } else {
        availableValuesData.push(['2. 사용 가능한 제품명']);
        availableValuesData.push(['⚠️ 등록된 제품이 없습니다. 상품 관리 메뉴에서 먼저 제품을 등록해주세요.']);
    }

    availableValuesData.push([]);
    availableValuesData.push(['💡 중요 안내']);
    availableValuesData.push(['• Excel에 입력할 때는 위 목록의 "업무 타입"과 "제품명"을 정확히 복사하여 사용하세요.']);
    availableValuesData.push(['• 띄어쓰기, 대소문자까지 정확히 일치해야 합니다.']);
    availableValuesData.push(['• 목록에 없는 값을 입력하면 업로드가 거부됩니다.']);

    const availableValuesWs = XLSX.utils.aoa_to_sheet(availableValuesData);

    // 사용가능한 값 시트 스타일 정의
    const valuesTitleStyle = {
        fill: { fgColor: { rgb: "2E75B6" } }, // 진한 파란색
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
        alignment: { horizontal: "center", vertical: "center" }
    };

    const valuesNoticeStyle = {
        fill: { fgColor: { rgb: "FFF2CC" } }, // 연한 노란색
        font: { bold: false, color: { rgb: "C65911" }, sz: 10 },
        alignment: { horizontal: "left", vertical: "center" }
    };

    const valuesSectionStyle = {
        fill: { fgColor: { rgb: "5B9BD5" } }, // 밝은 파란색
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        alignment: { horizontal: "left", vertical: "center" }
    };

    const valuesCategoryStyle = {
        fill: { fgColor: { rgb: "70AD47" } }, // 녹색
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        alignment: { horizontal: "left", vertical: "center" }
    };

    const valuesTableHeaderStyle = {
        fill: { fgColor: { rgb: "4472C4" } }, // 파란색
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        }
    };

    const valuesTableCellStyle = {
        alignment: { horizontal: "left", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "D3D3D3" } },
            bottom: { style: "thin", color: { rgb: "D3D3D3" } },
            left: { style: "thin", color: { rgb: "D3D3D3" } },
            right: { style: "thin", color: { rgb: "D3D3D3" } }
        }
    };

    const valuesTipStyle = {
        fill: { fgColor: { rgb: "E2EFDA" } }, // 연한 녹색
        font: { bold: true, color: { rgb: "385723" }, sz: 10 },
        alignment: { horizontal: "left", vertical: "center" }
    };

    // 사용가능한 값 시트 스타일 적용
    let currentRow = 0;

    // 제목 (0행)
    const valuesTitleCell = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
    if (availableValuesWs[valuesTitleCell]) {
        availableValuesWs[valuesTitleCell].s = valuesTitleStyle;
    }
    currentRow += 2; // 빈 줄 건너뛰기

    // 안내 메시지 (2-3행)
    for (let i = 0; i < 2; i++) {
        const cellAddress = XLSX.utils.encode_cell({ r: currentRow + i, c: 0 });
        if (availableValuesWs[cellAddress]) {
            availableValuesWs[cellAddress].s = valuesNoticeStyle;
        }
    }
    currentRow += 3; // 안내 메시지 2줄 + 빈 줄

    // 동적으로 스타일 적용 (업무 타입 및 제품 섹션)
    // 스타일을 적용할 때는 실제 데이터 구조를 추적해야 함
    for (let r = currentRow; r < availableValuesData.length; r++) {
        const firstCell = availableValuesData[r][0];

        if (!firstCell) continue; // 빈 행 건너뛰기

        const cellAddress = XLSX.utils.encode_cell({ r: r, c: 0 });

        // "1. 사용 가능한 업무 타입" 또는 "2. 사용 가능한 제품명" 섹션 제목
        if (typeof firstCell === 'string' && firstCell.match(/^\d+\./)) {
            if (availableValuesWs[cellAddress]) {
                availableValuesWs[cellAddress].s = valuesSectionStyle;
            }
        }
        // "📌 카테고리명" 형태의 카테고리 헤더
        else if (typeof firstCell === 'string' && firstCell.startsWith('📌')) {
            if (availableValuesWs[cellAddress]) {
                availableValuesWs[cellAddress].s = valuesCategoryStyle;
            }
        }
        // "번호" 로 시작하는 테이블 헤더
        else if (firstCell === '번호') {
            // 테이블 헤더 행 스타일 적용
            const numCols = availableValuesData[r].length;
            for (let col = 0; col < numCols; col++) {
                const headerCell = XLSX.utils.encode_cell({ r: r, c: col });
                if (availableValuesWs[headerCell]) {
                    availableValuesWs[headerCell].s = valuesTableHeaderStyle;
                }
            }
        }
        // 숫자로 시작하는 데이터 행 (테이블 내용)
        else if (typeof firstCell === 'number') {
            const numCols = availableValuesData[r].length;
            for (let col = 0; col < numCols; col++) {
                const dataCell = XLSX.utils.encode_cell({ r: r, c: col });
                if (availableValuesWs[dataCell]) {
                    availableValuesWs[dataCell].s = valuesTableCellStyle;
                }
            }
        }
        // "⚠️" 또는 "💡" 로 시작하는 경고/팁 메시지
        else if (typeof firstCell === 'string') {
            if (firstCell.startsWith('⚠️')) {
                if (availableValuesWs[cellAddress]) {
                    availableValuesWs[cellAddress].s = valuesNoticeStyle;
                }
            } else if (firstCell.startsWith('💡') || firstCell.startsWith('•')) {
                if (availableValuesWs[cellAddress]) {
                    availableValuesWs[cellAddress].s = valuesTipStyle;
                }
            }
        }
    }

    // 사용 가능한 값 시트 컬럼 너비 설정
    availableValuesWs['!cols'] = [
        { wch: 15 },  // 번호
        { wch: 40 },  // 제품명/업무타입
        { wch: 20 },  // 원가
        { wch: 20 }   // 판매가
    ];

    // 행 높이 설정
    availableValuesWs['!rows'] = [];
    availableValuesWs['!rows'][0] = { hpt: 25 }; // 제목 행 높이

    XLSX.utils.book_append_sheet(wb, availableValuesWs, '사용가능한 값');

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
export const findProduct = (workType, productName, products) => {
    if (!products || products.length === 0) return null;

    // category(업무타입) + name(제품명) 매칭
    return products.find(
        product => product.category === workType && product.name === productName
    ) || null;
};

export const findProductCost = (workType, productName, products) => {
    const matched = findProduct(workType, productName, products);
    return matched?.costPrice || 0;
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

        // 업무타입 + 제품명으로 제품 매칭
        const matchedProduct = findProduct(row.workType, row.productName, products);
        const matchedCost = matchedProduct?.costPrice || 0;

        return {
            campaignId,
            workType: row.workType,             // ✅ camelCase (백엔드가 이제 지원)
            productName: row.productName,        // ✅ camelCase (백엔드가 이제 지원)
            productId: matchedProduct?.id || null, // ✅ 제품 ID 연동 (발주 원가 계산용)
            quantity: Number(row.quantity),
            cost: matchedCost,                   // 업무타입 + 제품명으로 자동 매칭된 원가
            productCost: matchedCost,            // ✅ camelCase (백엔드가 이제 지원)
            title: row.title,                    // 업무내용 (사용자 입력)
            startDate: convertExcelDate(row.startDate),     // ✅ camelCase (백엔드가 이제 지원)
            dueDate: convertExcelDate(row.dueDate),         // ✅ camelCase (백엔드가 이제 지원)
            topicStatus: AUTO_FIELDS.topicStatus,           // ✅ camelCase (백엔드가 이제 지원)
            outline: AUTO_FIELDS.outline,
            outlineStatus: AUTO_FIELDS.outlineStatus,       // ✅ camelCase (백엔드가 이제 지원)
            rejectionReason: AUTO_FIELDS.rejectionReason,
            budget: Number(row.budget),
            invoiceIssued,
            paymentCompleted,
            publishedUrl: AUTO_FIELDS.publishedUrl          // ✅ camelCase (백엔드가 이제 지원)
        };
    });
};
