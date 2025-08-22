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
            // 먼저 localStorage에서 확인
            const storedLogo = localStorage.getItem('companyLogo');
            if (storedLogo) {
                setLogo(JSON.parse(storedLogo));
            }

            // API에서도 로고 데이터 확인 (선택사항)
            try {
                const response = await api.get('/api/company/logo');
                if (response.data?.logoUrl) {
                    const logoData = {
                        logoUrl: response.data.logoUrl,
                        uploadedAt: response.data.uploadedAt
                    };
                    setLogo(logoData);
                    localStorage.setItem('companyLogo', JSON.stringify(logoData));
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