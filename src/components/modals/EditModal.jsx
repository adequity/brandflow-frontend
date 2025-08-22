import React, { useState, useEffect } from 'react';
import { ImagePlus } from 'lucide-react';
import useImagePaste from '../../hooks/useImagePaste';
import ImageViewer from '../common/ImageViewer';
import api from '../../api/client';

const EditModal = ({ post, type, onSave, onClose }) => {
    const isTopic = type === 'topic';
    const [title, setTitle] = useState(post?.title || '');
    const [workType, setWorkType] = useState(post?.workType || '블로그');
    const [images, setImages] = useState(post?.images || []);
    const [content, setContent] = useState(isTopic ? (post?.title || '') : (post?.outline || ''));
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState(post?.productId || '');
    const [quantity, setQuantity] = useState(post?.quantity || 1);
    const [startDate, setStartDate] = useState(post?.startDate || '');
    const [dueDate, setDueDate] = useState(post?.dueDate || '');
    const [loading, setLoading] = useState(false);
    const [workTypes, setWorkTypes] = useState([]);

    // 업무타입과 상품의 work_type 필드 매핑
    const workTypeCategoryMap = {
        '블로그': '블로그',
        '인스타그램': '인스타그램',
        '유튜브': '유튜브',
        '페이스북': '페이스북',
        '네이버블로그': '네이버블로그',
        '틱톡': '틱톡'
    };

    // 선택된 업무타입에 따라 필터링된 상품 목록 (work_type 필드 기준)
    const filteredProducts = products.filter(product => {
        const expectedWorkType = workTypeCategoryMap[workType];
        return expectedWorkType ? product.work_type === expectedWorkType : true;
    });

    const handleImageAdd = (imageData) => {
        setImages(prev => [...prev, imageData]);
    };

    const handleImageRemove = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const { handlePaste, handleDrop, handleDragOver, handleDragLeave, isDragging } = useImagePaste(handleImageAdd);

    // 업무타입 변경 시 상품 선택 초기화
    const handleWorkTypeChange = (newWorkType) => {
        setWorkType(newWorkType);
        setSelectedProductId('');
        setQuantity(1);
    };

    // 상품 목록과 업무타입 목록 로드 (실제 API 사용 + 더미 fallback)
    useEffect(() => {
        if (!isTopic) return; // 목차 수정 시에는 로드하지 않음
        
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // localStorage에서 토큰 확인
                const token = localStorage.getItem('authToken');
                if (!token) {
                    console.warn('EditModal: 인증 토큰이 없어 더미 데이터 사용');
                    // 더미 데이터 사용
                    const dummyProducts = [
                        { id: 1, name: '블로그 포스트 작성', category: '블로그', costPrice: 100000, sellingPrice: 150000 },
                        { id: 2, name: '인스타그램 포스트 제작', category: '인스타그램', costPrice: 50000, sellingPrice: 80000 },
                        { id: 3, name: '페이스북 광고 제작', category: '페이스북', costPrice: 80000, sellingPrice: 120000 },
                        { id: 4, name: '유튜브 영상 제작', category: '유튜브', costPrice: 300000, sellingPrice: 500000 },
                        { id: 5, name: '브랜드 디자인', category: '디자인', costPrice: 500000, sellingPrice: 800000 },
                        { id: 6, name: '마케팅 전략 수립', category: '마케팅', costPrice: 600000, sellingPrice: 1000000 },
                        { id: 7, name: '영상 편집 서비스', category: '영상 편집', costPrice: 180000, sellingPrice: 300000 }
                    ];
                    const dummyWorkTypes = [
                        { id: 1, name: '블로그' },
                        { id: 2, name: '인스타그램' },
                        { id: 3, name: '페이스북' },
                        { id: 4, name: '유튜브' },
                        { id: 5, name: '디자인' },
                        { id: 6, name: '마케팅' },
                        { id: 7, name: '영상 편집' }
                    ];
                    setProducts(dummyProducts);
                    setWorkTypes(dummyWorkTypes);
                    return;
                }

                // 실제 API 호출 시도
                const [productsResponse, workTypesResponse] = await Promise.all([
                    api.get('/api/products').catch(err => {
                        console.warn('상품 API 실패, 더미 데이터 사용:', err.message);
                        return { data: { results: [] } };
                    }),
                    api.get('/api/work-types').catch(err => {
                        console.warn('업무타입 API 실패, 더미 데이터 사용:', err.message);
                        return { data: { results: [] } };
                    })
                ]);
                
                // 실제 데이터가 있으면 사용, 없으면 더미 데이터
                const realProducts = productsResponse.data?.results || productsResponse.data || [];
                const realWorkTypes = workTypesResponse.data?.results || workTypesResponse.data || [];
                
                if (realProducts.length > 0 && realWorkTypes.length > 0) {
                    setProducts(realProducts);
                    setWorkTypes(realWorkTypes);
                    console.log('✅ 실제 API 데이터 로드 성공 - 상품:', realProducts.length, '업무타입:', realWorkTypes.length);
                } else {
                    // 실제 API에 데이터가 없으면 더미 데이터 사용
                    const dummyProducts = [
                        { id: 1, name: '블로그 포스트 작성', category: '블로그', costPrice: 100000, sellingPrice: 150000 },
                        { id: 2, name: '인스타그램 포스트 제작', category: '인스타그램', costPrice: 50000, sellingPrice: 80000 },
                        { id: 3, name: '페이스북 광고 제작', category: '페이스북', costPrice: 80000, sellingPrice: 120000 },
                        { id: 4, name: '유튜브 영상 제작', category: '유튜브', costPrice: 300000, sellingPrice: 500000 },
                        { id: 5, name: '브랜드 디자인', category: '디자인', costPrice: 500000, sellingPrice: 800000 },
                        { id: 6, name: '마케팅 전략 수립', category: '마케팅', costPrice: 600000, sellingPrice: 1000000 },
                        { id: 7, name: '영상 편집 서비스', category: '영상 편집', costPrice: 180000, sellingPrice: 300000 }
                    ];
                    const dummyWorkTypes = [
                        { id: 1, name: '블로그' },
                        { id: 2, name: '인스타그램' },
                        { id: 3, name: '페이스북' },
                        { id: 4, name: '유튜브' },
                        { id: 5, name: '디자인' },
                        { id: 6, name: '마케팅' },
                        { id: 7, name: '영상 편집' }
                    ];
                    setProducts(dummyProducts);
                    setWorkTypes(dummyWorkTypes);
                    console.log('⚠️ API 데이터 없음, 더미 데이터 사용');
                }
            } catch (error) {
                console.error('EditModal - 데이터 로드 실패:', error);
                // 에러 시 더미 데이터로 fallback
                const dummyProducts = [
                    { id: 1, name: '블로그 포스트 작성', category: '블로그', costPrice: 100000, sellingPrice: 150000 },
                    { id: 2, name: '인스타그램 포스트 제작', category: '인스타그램', costPrice: 50000, sellingPrice: 80000 },
                    { id: 3, name: '페이스북 광고 제작', category: '페이스북', costPrice: 80000, sellingPrice: 120000 },
                    { id: 4, name: '유튜브 영상 제작', category: '유튜브', costPrice: 300000, sellingPrice: 500000 },
                    { id: 5, name: '브랜드 디자인', category: '디자인', costPrice: 500000, sellingPrice: 800000 },
                    { id: 6, name: '마케팅 전략 수립', category: '마케팅', costPrice: 600000, sellingPrice: 1000000 },
                    { id: 7, name: '영상 편집 서비스', category: '영상 편집', costPrice: 180000, sellingPrice: 300000 }
                ];
                const dummyWorkTypes = [
                    { id: 1, name: '블로그' },
                    { id: 2, name: '인스타그램' },
                    { id: 3, name: '페이스북' },
                    { id: 4, name: '유튜브' },
                    { id: 5, name: '디자인' },
                    { id: 6, name: '마케팅' },
                    { id: 7, name: '영상 편집' }
                ];
                setProducts(dummyProducts);
                setWorkTypes(dummyWorkTypes);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [isTopic]);

    const handleSave = () => {
        if (isTopic) {
            // 주제 수정 시 전체 데이터 전송
            const data = {
                title,
                workType,
                images: images,
                productId: selectedProductId || null,
                quantity: quantity || 1,
                startDate: startDate || null,
                dueDate: dueDate || null
            };
            onSave(data);
        } else {
            // 목차 수정 시 기존 방식 유지
            onSave(content);
        }
    };

    if (!isTopic) {
        // 목차 수정 시 기존 단순 모달 유지
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                    <h3 className="text-lg font-bold mb-4">목차 수정</h3>
                    <textarea
                        value={content || ''}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        rows="4"
                    />
                    <div className="flex justify-end space-x-2 mt-4">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">취소</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">재요청하기</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">업무 수정</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">업무 타입</label>
                        <select
                            value={workType}
                            onChange={(e) => handleWorkTypeChange(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            {workTypes.map((type) => (
                                <option key={type.id} value={type.name}>{type.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* 상품 선택 섹션 */}
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                            💰 매출 연결 (선택사항)
                            {workTypeCategoryMap[workType] && (
                                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {workTypeCategoryMap[workType]} 카테고리 상품만 표시
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
                                                {product.name} - {product.costPrice?.toLocaleString()}원
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>해당 업무타입의 상품이 없습니다</option>
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
                                    min={startDate}
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
                                placeholder="업무 내용을 입력하세요..."
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
                    >
                        수정 완료
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditModal;