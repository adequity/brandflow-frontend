import { useState, useEffect } from 'react';
import api from '../api/client';

const useLogo = () => {
    const [logo, setLogo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadLogo();
    }, []);

    const loadLogo = async () => {
        setIsLoading(true);
        try {
            // 현재 사용자의 회사 정보 가져오기
            const userData = localStorage.getItem('user');
            const user = userData ? JSON.parse(userData) : null;
            const companyName = user?.company || 'default';
            
            // 회사별 localStorage 키 생성
            const companyLogoKey = `companyLogo_${companyName}`;
            
            // 먼저 회사별 localStorage에서 확인
            const storedLogo = localStorage.getItem(companyLogoKey);
            if (storedLogo) {
                setLogo(JSON.parse(storedLogo));
            }

            // API에서도 로고 데이터 확인 (선택사항)
            try {
                const response = await api.get('/api/company/logo');
                if (response.data?.logoUrl) {
                    const logoData = {
                        logoUrl: response.data.logoUrl,
                        uploadedAt: response.data.uploadedAt,
                        companyId: response.data.companyId
                    };
                    setLogo(logoData);
                    // 회사별로 localStorage에 저장
                    localStorage.setItem(companyLogoKey, JSON.stringify(logoData));
                } else if (storedLogo) {
                    // API에 로고가 없으면 localStorage에서 제거
                    localStorage.removeItem(companyLogoKey);
                    setLogo(null);
                }
            } catch (apiError) {
                // API 오류는 조용히 처리 (localStorage 데이터 사용)
                console.log('로고 API 로드 실패, localStorage 사용:', apiError.message);
            }
        } catch (error) {
            console.error('로고 로드 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateLogo = (newLogo) => {
        setLogo(newLogo);
    };

    const getLogoDisplay = () => {
        if (logo?.logoUrl) {
            return {
                type: 'image',
                src: logo.logoUrl,
                alt: '회사 로고'
            };
        }
        
        return {
            type: 'text',
            text: 'BrandFlow',
            className: 'text-blue-600 font-bold'
        };
    };

    return {
        logo,
        isLoading,
        updateLogo,
        loadLogo,
        getLogoDisplay
    };
};

export default useLogo;