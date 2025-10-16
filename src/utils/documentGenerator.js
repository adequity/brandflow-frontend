import api, { API_BASE_URL } from '../api/client';

/**
 * 문서 생성을 위한 유틸리티 함수들
 */

// 회사 로고 가져오기
export const fetchCompanyLogo = async () => {
    try {
        console.log('🎨 회사 로고 API 호출 시작...');
        const response = await api.get('/api/company/logo');
        console.log('🎨 로고 API 응답:', response.data);

        if (response.data?.logoUrl) {
            const logoUrl = response.data.logoUrl.startsWith('http')
                ? response.data.logoUrl
                : `${API_BASE_URL}${response.data.logoUrl}`;
            console.log('🎨 처리된 로고 URL:', logoUrl);
            return logoUrl;
        }
        return null;
    } catch (error) {
        console.error('❌ 로고 로딩 실패:', error);
        return null;
    }
};

// 회사 정보 가져오기
export const fetchCompanyInfo = async () => {
    try {
        console.log('🏢 공급자 정보 API 호출 시작...');
        const response = await api.get('/api/company-settings/info');
        console.log('🏢 API 응답:', response.data);

        if (response.data && response.data.success && response.data.info) {
            const companyData = response.data.info;

            // ✅ 도장 이미지 URL 처리
            if (companyData.sealImageUrl && !companyData.sealImageUrl.startsWith('http')) {
                companyData.sealImageUrl = companyData.sealImageUrl.startsWith('/')
                    ? `${API_BASE_URL}${companyData.sealImageUrl}`
                    : `${API_BASE_URL}/${companyData.sealImageUrl}`;
                console.log('🔐 처리된 도장 URL:', companyData.sealImageUrl);
            }

            console.log('🏢 처리된 공급자 정보:', companyData);
            return companyData;
        } else {
            console.log('⚠️ 공급자 정보가 비어있어 기본값 사용');
            return getDefaultCompanyInfo();
        }
    } catch (error) {
        console.error('❌ 회사 정보 로딩 실패:', error);
        console.log('🏢 기본값 반환');
        return getDefaultCompanyInfo();
    }
};

// 기본 공급자 정보 (빈 값으로 초기화)
const getDefaultCompanyInfo = () => {
    return {
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
    };
};

// 문서 번호 생성
export const generateDocumentNumber = () => {
    const today = new Date();
    const dateString = today.getFullYear().toString() +
                      (today.getMonth() + 1).toString().padStart(2, '0') +
                      today.getDate().toString().padStart(2, '0');

    // 시간을 이용한 고유 번호 생성
    const timeString = today.getHours().toString().padStart(2, '0') +
                      today.getMinutes().toString().padStart(2, '0');

    return `${dateString}-${timeString}`;
};

// 숫자에 천 단위 콤마 추가
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
};

// 숫자를 한글로 변환
export const numberToKorean = (num) => {
    const units = ['', '만', '억', '조'];
    const digits = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const teens = ['', '십', '백', '천'];

    if (num === 0) return '영원';

    let result = '';
    let unitIndex = 0;

    while (num > 0) {
        const segment = num % 10000;

        if (segment > 0) {
            let segmentStr = '';

            const thousands = Math.floor(segment / 1000);
            const hundreds = Math.floor((segment % 1000) / 100);
            const tens = Math.floor((segment % 100) / 10);
            const ones = segment % 10;

            if (thousands > 0) {
                if (thousands > 1) segmentStr += digits[thousands];
                segmentStr += '천';
            }
            if (hundreds > 0) {
                if (hundreds > 1) segmentStr += digits[hundreds];
                segmentStr += '백';
            }
            if (tens > 0) {
                if (tens > 1) segmentStr += digits[tens];
                segmentStr += '십';
            }
            if (ones > 0) {
                segmentStr += digits[ones];
            }

            result = segmentStr + units[unitIndex] + result;
        }

        num = Math.floor(num / 10000);
        unitIndex++;
    }

    return result + '원정';
};

// 캠페인 데이터를 문서 데이터로 변환
export const transformCampaignToDocument = (campaign, posts, selectedPostIds = null, type = 'transaction', products = []) => {
    console.log('🔍 Document Generation Debug:');
    console.log('Campaign:', campaign);
    console.log('Campaign client_user:', campaign.client_user);
    console.log('Posts:', posts);
    console.log('Selected Post IDs:', selectedPostIds);
    console.log('Products:', products);

    // 수신자 정보 디버깅 - 상세 확인
    console.log('🏢 수신자 정보 디버깅:');
    console.log('  campaign.client_user 전체:', campaign.client_user);
    console.log('  client_company_name:', campaign.client_user?.client_company_name);
    console.log('  client_business_number:', campaign.client_user?.client_business_number);
    console.log('  client_ceo_name:', campaign.client_user?.client_ceo_name);
    console.log('  client_company_address:', campaign.client_user?.client_company_address);
    console.log('  client_business_type:', campaign.client_user?.client_business_type);
    console.log('  client_business_item:', campaign.client_user?.client_business_item);
    console.log('  name (fallback):', campaign.client_user?.name);
    console.log('  clientName:', campaign.clientName);
    console.log('  client_company:', campaign.client_company);

    // 최종 선택된 수신자명 미리 확인
    const recipientName = campaign.client_user?.client_company_name || campaign.client_user?.name || campaign.clientName || campaign.client_company || '고객사';
    console.log('  → 최종 선택된 수신자명:', recipientName);

    // 포스트의 productId나 productName으로 상품의 원가 찾기 함수
    const getProductCost = (post) => {
        console.log(`🔍 문서생성용 원가 찾기 - 포스트 ID: ${post.id}, 제목: ${post.title}`);

        // 1. 포스트에 직접 설정된 원가가 있으면 사용
        if (post.cost) {
            console.log('✅ 포스트에 직접 설정된 원가 사용:', post.cost);
            return post.cost;
        }

        if (post.productCost) {
            console.log('✅ 포스트의 productCost 사용:', post.productCost);
            return post.productCost;
        }

        // 2. productId로 상품에서 찾기
        if (post.productId && products.length > 0) {
            console.log('🔍 productId로 상품 찾기:', post.productId);
            const product = products.find(p => p.id === post.productId);
            if (product) {
                console.log('✅ 상품 찾음:', product);
                if (product.cost) {
                    console.log('💰 상품 원가(cost) 반환:', product.cost);
                    return product.cost;
                } else if (product.price) {
                    console.log('💰 상품 가격(price) 반환:', product.price);
                    return product.price;
                }
            } else {
                console.log('❌ productId로 상품을 찾을 수 없음');
            }
        }

        // 3. productName으로 상품에서 찾기
        if (post.productName && products.length > 0) {
            console.log('🔍 productName으로 상품 찾기:', post.productName);
            const product = products.find(p => p.name === post.productName);
            if (product) {
                console.log('✅ 이름으로 상품 찾음:', product);
                if (product.cost) {
                    console.log('💰 상품 원가(cost) 반환:', product.cost);
                    return product.cost;
                } else if (product.price) {
                    console.log('💰 상품 가격(price) 반환:', product.price);
                    return product.price;
                }
            } else {
                console.log('❌ productName으로 상품을 찾을 수 없음');
            }
        }

        // 4. 업무 타입별 기본 가격 사용
        const defaultPrice = getBasePriceByWorkType(post.workType);
        console.log('🏷️ 업무 타입별 기본 가격 사용:', defaultPrice);
        return defaultPrice;
    };

    const filteredPosts = selectedPostIds && selectedPostIds.length > 0
        ? posts.filter(post => selectedPostIds.includes(post.id))
        : posts;

    console.log('Filtered Posts:', filteredPosts);

    // 승인된 포스트만 필터링 (주제 승인 또는 목차 승인된 포스트)
    const approvedPosts = filteredPosts.filter(post =>
        post.topicStatus === '승인' ||
        post.topicStatus === '주제 승인' ||
        post.outlineStatus === '승인' ||
        post.outlineStatus === '목차 승인'
    );

    console.log('Approved Posts:', approvedPosts);
    if (approvedPosts.length > 0) {
        console.log('Sample approved post:', approvedPosts[0]);
        console.log('Sample post cost:', approvedPosts[0].cost);
        console.log('Sample post productCost:', approvedPosts[0].productCost);
        console.log('Sample post quantity:', approvedPosts[0].quantity);
    }

    const items = approvedPosts.map(post => {
        // 새로운 getProductCost 함수 사용
        const unitPrice = getProductCost(post);
        const quantity = post.quantity || 1;
        const supplyAmount = unitPrice * quantity;
        const taxAmount = Math.floor(supplyAmount * 0.1); // 10% 부가세

        // 제품명과 업무 타입을 모두 포함하는 품목명 생성
        const productInfo = post.productName ? `${post.productName} - ` : '';
        const itemDescription = `${productInfo}${post.title} (${post.workType})`;

        return {
            startDate: post.startDate || '-',
            dueDate: post.dueDate || '-',
            itemName: itemDescription,
            cost: unitPrice,
            quantity: quantity,
            unitPrice: unitPrice,
            supplyAmount: supplyAmount,
            taxAmount: taxAmount
        };
    });

    const totalSupplyAmount = items.reduce((sum, item) => sum + item.supplyAmount, 0);
    const totalTaxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = totalSupplyAmount + totalTaxAmount;

    return {
        header: {
            title: type === 'quote' ? '견적서' : '거래명세표',
            documentNumber: generateDocumentNumber(),
            issueDate: new Date().toLocaleDateString('ko-KR')
        },
        recipient: {
            name: campaign.client_user?.client_company_name || campaign.client_user?.name || campaign.clientName || campaign.client_company || '고객사',
            businessNumber: campaign.client_user?.client_business_number || campaign.client_user?.business_number || campaign.clientBusinessNumber || '',
            contact: campaign.client_user?.contact || '',
            ceoName: campaign.client_user?.client_ceo_name || '',
            address: campaign.client_user?.client_company_address || '',
            businessType: campaign.client_user?.client_business_type || '',
            businessItem: campaign.client_user?.client_business_item || ''
        },
        items: items,
        summary: {
            totalSupplyAmount: totalSupplyAmount,
            totalTaxAmount: totalTaxAmount,
            totalAmount: totalAmount,
            totalAmountInKorean: numberToKorean(totalAmount)
        }
    };
};

// 업무 타입별 기본 가격 (실제로는 DB에서 가져와야 함)
const getBasePriceByWorkType = (workType) => {
    const priceMap = {
        '블로그': 300000,
        '카페': 250000,
        '인스타그램': 400000,
        '유튜브': 500000,
        '틱톡': 350000,
        '페이스북': 200000,
        '네이버포스트': 150000,
        '기타': 200000
    };

    return priceMap[workType] || 200000;
};

// 문서 HTML 생성
export const generateDocumentHTML = (documentData, companyInfo, template = {}, companyLogo = null) => {
    console.log('📄 HTML 생성 시 공급자 정보:', companyInfo);
    console.log('📄 HTML 생성 시 회사 로고:', companyLogo);

    // 공급자 정보가 없거나 비어있으면 기본값 사용
    const safeCompanyInfo = companyInfo && Object.keys(companyInfo).length > 0
        ? companyInfo
        : getDefaultCompanyInfo();
    const styles = {
        primaryColor: template.styles?.primaryColor || '#000000',
        headerFontSize: template.styles?.headerFontSize || '24px',
        bodyFontSize: template.styles?.bodyFontSize || '12px'
    };

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${documentData.header.title}</title>
    <style>
        @media print {
            @page { margin: 20mm; }
            body { margin: 0; }
        }

        body {
            font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
            font-size: ${styles.bodyFontSize};
            line-height: 1.4;
            color: ${styles.primaryColor};
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }

        .document-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid ${styles.primaryColor};
            padding-bottom: 20px;
        }

        .company-logo {
            max-height: 60px;
            max-width: 200px;
            margin-bottom: 15px;
            object-fit: contain;
        }

        .document-title {
            font-size: ${styles.headerFontSize};
            font-weight: bold;
            margin-bottom: 15px;
        }

        .document-info {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #666;
        }

        .parties-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
            border: 1px solid ${styles.primaryColor};
            padding: 20px;
        }

        .party-section h3 {
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }

        .party-section div {
            margin-bottom: 5px;
        }

        .total-amount {
            text-align: center;
            margin-bottom: 30px;
            border: 2px solid ${styles.primaryColor};
            padding: 15px;
            background-color: #f9f9f9;
        }

        .total-amount-text {
            font-size: 18px;
            font-weight: bold;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .items-table th,
        .items-table td {
            border: 1px solid ${styles.primaryColor};
            padding: 8px;
            text-align: center;
        }

        .items-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }

        .items-table td.text-left {
            text-align: left;
        }

        .items-table td.text-right {
            text-align: right;
        }

        .footer-info {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 40px;
        }

        .account-info {
            flex: 1;
        }

        .signature-area {
            text-align: center;
        }

        .signature-box {
            width: 80px;
            height: 80px;
            border: 1px solid ${styles.primaryColor};
            margin-top: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background-color: white;
        }

        .signature-box img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
    </style>
</head>
<body>
    <div class="document-header">
        ${companyLogo ? `<img src="${companyLogo}" alt="회사 로고" class="company-logo" />` : ''}
        <div class="document-title">${documentData.header.title}</div>
        <div class="document-info">
            <div>문서번호: ${documentData.header.documentNumber}</div>
            <div>발행일: ${documentData.header.issueDate}</div>
        </div>
    </div>

    <div class="parties-info">
        <div class="party-section">
            <h3>수신</h3>
            <div>${documentData.recipient.name} 귀하</div>
            ${documentData.recipient.businessNumber ? `<div>사업자번호: ${documentData.recipient.businessNumber}</div>` : ''}
            ${documentData.recipient.ceoName ? `<div>대표자: ${documentData.recipient.ceoName}</div>` : ''}
            ${documentData.recipient.address ? `<div>소재지: ${documentData.recipient.address}</div>` : ''}
            ${documentData.recipient.businessType ? `<div>업태: ${documentData.recipient.businessType}</div>` : ''}
            ${documentData.recipient.businessItem ? `<div>종목: ${documentData.recipient.businessItem}</div>` : ''}
            ${documentData.recipient.contact ? `<div>연락처: ${documentData.recipient.contact}</div>` : ''}
        </div>
        <div class="party-section">
            <h3>공급자</h3>
            <div>사업자번호: ${safeCompanyInfo.businessNumber}</div>
            <div>상호: ${safeCompanyInfo.name}</div>
            <div>대표자: ${safeCompanyInfo.ceo}</div>
            <div>소재지: ${safeCompanyInfo.address}</div>
            <div>업태: ${safeCompanyInfo.businessType}</div>
            <div>종목: ${safeCompanyInfo.businessItem}</div>
        </div>
    </div>

    <div class="total-amount">
        <div class="total-amount-text">
            합계금액: ${formatCurrency(documentData.summary.totalAmount)}원 (${documentData.summary.totalAmountInKorean})
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>시작일</th>
                <th>마감일</th>
                <th>품목 및 규격</th>
                <th>원가</th>
                <th>수량</th>
                <th>단가</th>
                <th>공급가액</th>
                <th>세액</th>
            </tr>
        </thead>
        <tbody>
            ${documentData.items.map(item => `
                <tr>
                    <td>${item.startDate}</td>
                    <td>${item.dueDate}</td>
                    <td class="text-left">${item.itemName}</td>
                    <td class="text-right">${formatCurrency(item.cost)}</td>
                    <td>${item.quantity}</td>
                    <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                    <td class="text-right">${formatCurrency(item.supplyAmount)}</td>
                    <td class="text-right">${formatCurrency(item.taxAmount)}</td>
                </tr>
            `).join('')}
            <tr style="font-weight: bold; background-color: #f9f9f9;">
                <td colspan="6">합계</td>
                <td class="text-right">${formatCurrency(documentData.summary.totalSupplyAmount)}</td>
                <td class="text-right">${formatCurrency(documentData.summary.totalTaxAmount)}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer-info">
        <div class="account-info">
            <h4>계좌정보</h4>
            ${safeCompanyInfo.bankName || safeCompanyInfo.accountNumber || safeCompanyInfo.accountHolder ? `
                <div>은행명: ${safeCompanyInfo.bankName || '-'}</div>
                <div>계좌번호: ${safeCompanyInfo.accountNumber || '-'}</div>
                <div>예금주: ${safeCompanyInfo.accountHolder || '-'}</div>
            ` : '<div>입금계좌: [계좌정보 미입력]</div>'}
        </div>
        <div class="signature-area">
            <div>공급자 (인)</div>
            <div class="signature-box">
                ${safeCompanyInfo.sealImageUrl ?
                    `<img src="${safeCompanyInfo.sealImageUrl}" alt="회사 도장" />` :
                    ''
                }
            </div>
        </div>
    </div>
</body>
</html>
    `;
};