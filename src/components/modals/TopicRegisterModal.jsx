import React, { useState, useEffect } from 'react';
import { ImagePlus } from 'lucide-react';
import useImagePaste from '../../hooks/useImagePaste';
import ImageViewer from '../common/ImageViewer';
import api from '../../api/client';

const TopicRegisterModal = ({ onSave, onClose, campaignId }) => {
    const [title, setTitle] = useState('');
    const [workType, setWorkType] = useState('블로그');
    const [images, setImages] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [skipApproval, setSkipApproval] = useState(false);
    const [loading, setLoading] = useState(false);
    const [workTypes, setWorkTypes] = useState([]);
    const [error, setError] = useState(null);

    // workTypeCategoryMap 제거 - 실제 백엔드 데이터와 직접 매칭

    // 선택된 업무타입에 따라 필터링된 상품 목록 (category 필드 기준)
    const filteredProducts = Array.isArray(products) ? products.filter(product => {
        // 업무타입이 선택되지 않았으면 모든 상품 표시
        if (!workType) return true;

        // 정확한 매칭: work_type 이름과 product.category가 정확히 일치하는 상품만 필터링
        return product.category === workType;
    }) : [];

    console.log('TopicRegisterModal 필터링 디버그:', {
        selectedWorkType: workType,
        workTypesCount: workTypes?.length,
        allWorkTypes: workTypes?.map(wt => ({ id: wt.id, name: wt.name })),
        productsCount: products?.length,
        allProducts: products?.map(p => ({ id: p.id, name: p.name, category: p.category })),
        filteredProductsCount: filteredProducts?.length,
        filteredProducts: filteredProducts?.map(p => ({ id: p.id, name: p.name, category: p.category })),
        matchingCheck: products?.map(p => ({
            productName: p.name,
            productCategory: p.category,
            selectedWorkType: workType,
            isMatch: p.category === workType,
            categoryType: typeof p.category,
            workTypeType: typeof workType
        }))
    });

    const handleImageAdd = (imageData) => {
        setImages(prev => [...prev, imageData]);
    };

    const handleImageRemove = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const { handlePaste, handleDrop, handleDragOver, handleDragLeave, isDragging } = useImagePaste(handleImageAdd);

    // 업무타입 변경 시 상품 선택 초기화 및 상품 목록 로드
    const handleWorkTypeChange = async (newWorkType) => {
        console.log('업무타입 변경:', {
            previousWorkType: workType,
            newWorkType: newWorkType
        });

        setWorkType(newWorkType);
        setSelectedProductId(''); // 상품 선택 초기화
        setQuantity(1); // 수량 초기화

        // 업무타입이 선택되었을 때만 상품 목록 로드
        if (newWorkType) {
            console.log(`"${newWorkType}" 업무타입 선택됨 - 상품 목록 로드 시작`);
            await loadProducts();
        } else {
            console.log('업무타입 선택 해제 - 상품 목록 비우기');
            setProducts([]); // 업무타입이 선택 해제되면 상품 목록 비우기
        }
    };

    // 상품 목록 로드 함수
    const loadProducts = async () => {
        try {
            console.log('상품 목록 로드 시작...');
            const token = localStorage.getItem('authToken');

            if (token) {
                const productsResponse = await api.get('/api/products');
                const productsData = productsResponse.data?.products || productsResponse.data || [];

                setProducts(Array.isArray(productsData) ? productsData : []);

                console.log('상품 목록 로드 성공');
                console.log('상품 목록:', Array.isArray(productsData) ? productsData.length : 'undefined', '개');
                console.log('전체 상품 데이터:', productsData?.map(p => ({ id: p.id, name: p.name, category: p.category })));
                console.log('상품 카테고리 목록:', [...new Set(productsData?.map(p => p.category).filter(Boolean))]);

                // 현재 선택된 업무타입과 매칭되는 상품들 확인
                const matchingProducts = productsData?.filter(p => p.category === workType) || [];
                console.log(`현재 선택된 업무타입 "${workType}"과 매칭되는 상품:`, matchingProducts.length, '개');
                console.log('매칭된 상품들:', matchingProducts?.map(p => ({ id: p.id, name: p.name, category: p.category })));
            }
        } catch (error) {
            console.error('상품 목록 로드 실패:', error);
            setProducts([]);
        }
    };

    // 상품 목록과 업무타입 목록 로드 (모달이 열릴 때마다 최신 데이터 로드)
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                const token = localStorage.getItem('authToken');
                console.log('TopicRegisterModal: 토큰 상태:', token ? '존재' : '없음');
                
                if (token) {
                    try {
                        // JWT 기반 API 호출 - 초기에는 업무타입만 로드
                        console.log('TopicRegisterModal JWT: 업무타입 목록 로드');

                        const workTypesResponse = await api.get('/api/work-types');
                        const workTypesData = workTypesResponse.data || [];

                        setWorkTypes(Array.isArray(workTypesData) ? workTypesData : []);

                        console.log('TopicRegisterModal: 업무타입 로드 성공');
                        console.log('업무타입 목록:', Array.isArray(workTypesData) ? workTypesData.length : 'undefined', '개');
                        console.log('전체 업무타입 데이터:', workTypesData?.map(wt => ({ id: wt.id, name: wt.name })));
                    } catch (apiError) {
                        console.error('TopicRegisterModal: API 호출 실패', apiError);
                        setProducts([]);
                        setWorkTypes([]);
                        setError('상품 및 업무타입 목록을 불러올 수 없습니다. 관리자에게 문의하세요.');
                    }
                } else {
                    console.error('TopicRegisterModal: 인증 토큰이 없습니다');
                    setError('로그인이 필요합니다. 다시 로그인해 주세요.');
                    setProducts([]);
                    setWorkTypes([]);
                }
            } catch (error) {
                console.error('TopicRegisterModal: 데이터 로드 실패:', error);
                setError(`데이터를 불러올 수 없습니다: ${error.message}`);
                setProducts([]);
                setWorkTypes([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [campaignId]); // campaignId가 변경되거나 컴포넌트가 마운트될 때 데이터 로드


    const handleSave = () => {
        const data = {
            title,
            workType,
            images: images,
            productId: selectedProductId || null,
            quantity: quantity || 1,
            startDate: startDate || null,
            dueDate: dueDate || null,
            skipApproval: skipApproval,
            campaignId: campaignId // 캠페인 ID 자동 연결
        };
        onSave(data);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">새 업무 등록</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">업무 타입</label>
                        <select
                            value={workType}
                            onChange={(e) => handleWorkTypeChange(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            {Array.isArray(workTypes) && workTypes.length > 0 ? (
                                workTypes.map((type) => (
                                    <option key={type.id} value={type.name}>{type.name}</option>
                                ))
                            ) : (
                                <option value="블로그">블로그</option>
                            )}
                        </select>
                    </div>
                    
                    {/* 상품 선택 섹션 */}
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                            💰 매출 연결 (선택사항)
                            {workType && (
                                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    "{workType}" 카테고리 상품만 표시 ({filteredProducts.length}개)
                                </span>
                            )}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">상품 선택</label>
                                <select
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="">상품 선택 안함</option>
                                    {filteredProducts && filteredProducts.length > 0 ? (
                                        filteredProducts.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} - {(product.costPrice || product.price)?.toLocaleString()}원
                                            </option>
                                        ))
                                    ) : workType ? (
                                        <option value="" disabled>"{workType}" 업무타입에 해당하는 상품이 없습니다</option>
                                    ) : (
                                        <option value="" disabled>업무타입을 먼저 선택해주세요</option>
                                    )}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">수량</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                    disabled={!selectedProductId}
                                />
                            </div>
                        </div>
                        
                    </div>
                    
                    {/* 업무 일정 섹션 */}
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">📅 업무 일정</h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">시작일</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">마감일</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                    min={startDate} // 시작일 이후로만 선택 가능
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">업무 내용</label>
                        <div 
                            className={`relative ${
                                isDragging 
                                    ? 'border-2 border-dashed border-blue-400 bg-blue-50' 
                                    : 'border border-gray-300'
                            } rounded-lg transition-all duration-200`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            <textarea
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onPaste={handlePaste}
                                className="w-full p-3 text-sm resize-none border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="4"
                                placeholder="업무 내용을 입력하세요...&#10;&#10;💡 팁: Ctrl+V로 이미지를 바로 붙여넣을 수 있습니다!"
                            />
                            {isDragging && (
                                <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 rounded-lg">
                                    <div className="text-center">
                                        <ImagePlus size={32} className="mx-auto text-blue-500 mb-2" />
                                        <p className="text-blue-600 font-medium">이미지를 놓아주세요</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <ImageViewer images={images} onRemove={handleImageRemove} />
                    </div>
                    
                    {/* 승인 설정 섹션 */}
                    <div className="border-t pt-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="skipApproval"
                                checked={skipApproval}
                                onChange={(e) => setSkipApproval(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="skipApproval" className="text-sm font-medium text-gray-700">
                                ⚡ 승인 없이 바로 진행하기
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                            체크 시 승인 과정을 거치지 않고 바로 작업을 시작할 수 있습니다
                        </p>
                    </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">취소</button>
                    <button 
                        onClick={handleSave} 
                        className={`px-4 py-2 rounded-lg ${
                            !title.trim() 
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                        }`}
                        disabled={!title.trim()}
                        title={!title.trim() ? '업무 내용을 입력해주세요' : ''}
                    >
                        {skipApproval ? '바로 등록하기' : '등록 및 승인 요청'} {images.length > 0 && `(${images.length}개 이미지 포함)`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopicRegisterModal;