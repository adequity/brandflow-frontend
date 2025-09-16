import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Edit, Trash2, Link as LinkIcon, ChevronLeft, ChevronRight, FileText, FileImage } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useOrder } from '../contexts/OrderContext';
import ConfirmModal from '../components/ui/ConfirmModal';

// 필요한 컴포넌트들을 import 합니다.
import StatusBadge from '../components/common/StatusBadge';
import AdvancedFilter from '../components/common/AdvancedFilter';
import ImagePreview from '../components/common/ImagePreview';
import EditModal from '../components/modals/EditModal';
import DeleteModal from '../components/modals/DeleteModal';
import OutlineRegisterModal from '../components/modals/OutlineRegisterModal';
import TopicRegisterModal from '../components/modals/TopicRegisterModal';
import LinkRegisterModal from '../components/modals/LinkRegisterModal';

const CampaignDetailPage = () => {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const { showSuccess, showError, showInfo } = useToast();
    const { createOrderRequest } = useOrder();
    
    
    const [campaign, setCampaign] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isOutlineModalOpen, setOutlineModalOpen] = useState(false);
    const [isTopicModalOpen, setTopicModalOpen] = useState(false);
    const [isLinkModalOpen, setLinkModalOpen] = useState(false);
    const [modalType, setModalType] = useState('topic');
    const [selectedPost, setSelectedPost] = useState(null);
    const [users, setUsers] = useState([]);
    const [editingCell, setEditingCell] = useState(null); // { postId, field }
    const [editingValue, setEditingValue] = useState('');
    const [orderRequestConfirm, setOrderRequestConfirm] = useState({ isOpen: false, post: null });
    const [reorderRequestConfirm, setReorderRequestConfirm] = useState({ isOpen: false, post: null });
    const [isCampaignEditing, setIsCampaignEditing] = useState(false);
    const [campaignEditData, setCampaignEditData] = useState({ name: '', description: '' });
    const [filters, setFilters] = useState({
        workType: 'all',
        status: 'all', 
        manager: 'all',
        dateRange: 'all',
        stage: 'all'
    });

    const fetchCampaignDetail = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            console.log('CampaignDetailPage: 토큰 상태:', token ? '존재' : '없음');
            
            if (token) {
                try {
                    // JWT 토큰 기반 보안 API 호출 (파라미터 없이 토큰만 사용)
                    const [campaignResponse, postsResponse] = await Promise.all([
                        api.get(`/api/campaigns/${campaignId}`),
                        api.get(`/api/campaigns/${campaignId}/posts/jwt`)
                    ]);

                    const campaignData = campaignResponse.data;
                    const postsData = postsResponse.data;

                    setCampaign(campaignData);
                    setPosts(postsData || []);
                    console.log('CampaignDetailPage: 실제 API 데이터 로드 성공');
                    console.log('캠페인:', campaignData.name);
                    console.log('포스트:', (postsData || []).length, '개');
                } catch (apiError) {
                    console.error('CampaignDetailPage: API 호출 실패', apiError);
                    setError(`캠페인 데이터를 불러올 수 없습니다: ${apiError.message}`);
                    setIsLoading(false);
                    return;
                }
            } else {
                console.error('CampaignDetailPage: 인증 토큰이 없습니다');
                setError('로그인이 필요합니다. 다시 로그인해주세요.');
                setIsLoading(false);
                return;
            }
        } catch (error) {
            console.error("캠페인 상세 정보 로딩 실패:", error);
            setCampaign(null);
        } finally {
            setIsLoading(false);
        }
    }, [campaignId]);

    useEffect(() => {
        fetchCampaignDetail();
    }, [fetchCampaignDetail]);

    // 발주 상태 업데이트 이벤트 리스너
    useEffect(() => {
        const handleOrderStatusUpdate = (event) => {
            const { orderId, postId, campaignId, newStatus } = event.detail;
            
            // 현재 캠페인의 업무인지 확인
            if (parseInt(campaign?.id) === parseInt(campaignId)) {
                setPosts(prevPosts => 
                    prevPosts.map(post => 
                        post.id === parseInt(postId) 
                            ? { ...post, orderRequestStatus: newStatus }
                            : post
                    )
                );
            }
        };
        
        window.addEventListener('orderStatusUpdate', handleOrderStatusUpdate);
        
        return () => {
            window.removeEventListener('orderStatusUpdate', handleOrderStatusUpdate);
        };
    }, [campaignId]);

    // 더미 사용자 목록 및 상품 정보
    useEffect(() => {
        const dummyUsers = [
            { id: 1, name: '슈퍼 관리자' },
            { id: 2, name: '대행사 관리자' },
            { id: 3, name: '직원1' },
            { id: 4, name: '직원2' }
        ];
        setUsers(dummyUsers);
    }, []);

    // 업무타입별 원가 정보 조회 함수 (상품관리에서 가져옴)
    const getProductCostByWorkType = (workType) => {
        const productPrices = {
            '블로그': 500000,
            '인스타그램': 300000,
            '페이스북': 400000,
            '유튜브': 1200000,
            '디자인': 700000,
            '마케팅': 2000000,
            '영상 편집': 450000
        };
        return productPrices[workType] || 0;
    };

    // 필터링 로직
    useEffect(() => {
        let filtered = [...posts];

        // 업무 타입 필터
        if (filters.workType !== 'all') {
            filtered = filtered.filter(post => 
                (post.workType || '블로그') === filters.workType
            );
        }

        // 상태 필터 (승인 상태 기준) - 대기/승인/거절 3단계
        if (filters.status !== 'all') {
            let statusFilter = filters.status;
            if (statusFilter === '대기') {
                filtered = filtered.filter(post => 
                    post.topicStatus === '대기' || 
                    post.outlineStatus === '대기'
                );
            } else if (statusFilter === '승인') {
                filtered = filtered.filter(post => 
                    post.topicStatus === '승인' || 
                    post.outlineStatus === '승인'
                );
            } else if (statusFilter === '거절') {
                filtered = filtered.filter(post => 
                    post.topicStatus === '거절' || 
                    post.outlineStatus === '거절'
                );
            }
        }

        // 담당자 필터 (캠페인의 매니저 기준)
        if (filters.manager !== 'all' && campaign?.managerId) {
            if (filters.manager !== campaign.managerId.toString()) {
                filtered = [];
            }
        }

        // 날짜 범위 필터
        if (filters.dateRange !== 'all') {
            const now = new Date();
            let cutoffDate;
            
            if (filters.dateRange === '7days') {
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            } else if (filters.dateRange === '30days') {
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            } else if (filters.dateRange === '3months') {
                cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            }
            
            if (cutoffDate) {
                filtered = filtered.filter(post => 
                    new Date(post.createdAt) >= cutoffDate
                );
            }
        }

        // 진행 단계 필터
        if (filters.stage !== 'all') {
            if (filters.stage === 'work_only') {
                filtered = filtered.filter(post => 
                    !post.outline && !post.publishedUrl
                );
            } else if (filters.stage === 'has_details') {
                filtered = filtered.filter(post => 
                    post.outline && !post.publishedUrl
                );
            } else if (filters.stage === 'has_result') {
                filtered = filtered.filter(post => post.publishedUrl);
            }
        }

        setFilteredPosts(filtered);
    }, [posts, filters, campaign]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleRowSelect = (id) => { setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [id]); };
    const handleSelectAll = (e) => { setSelectedRows(e.target.checked ? filteredPosts.map(p => p.id) : []); };
    const openEditModal = (post, type) => { setSelectedPost(post); setModalType(type); setEditModalOpen(true); };
    const handleDeleteClick = (post) => { setSelectedPost(post); setDeleteModalOpen(true); };
    
    const handleReRequest = async (updatedContent) => {
        const postToUpdate = filteredPosts.find(p => p.id === selectedPost.id) || posts.find(p => p.id === selectedPost.id);
        let payload = {};
        if (modalType === 'topic') {
            // 새로운 확장된 수정 데이터 처리
            if (typeof updatedContent === 'object') {
                payload = {
                    title: updatedContent.title,
                    workType: updatedContent.workType,
                    images: updatedContent.images,
                    productId: updatedContent.productId,
                    quantity: updatedContent.quantity,
                    startDate: updatedContent.startDate,
                    dueDate: updatedContent.dueDate,
                    topicStatus: '대기' // 수정 시 재승인 필요
                };
            } else {
                // 기존 방식 호환성
                payload = { title: updatedContent, topicStatus: '대기', outline: null, outlineStatus: null };
            }
        } else {
            payload = { outline: updatedContent, outlineStatus: '대기' };
        }
        try {
            console.log('업무 수정 시작:', payload);

            // 백엔드 API 호출
            const response = await api.put(`/api/campaigns/${campaignId}/posts/${selectedPost.id}`, payload);
            const updatedPost = response.data;

            console.log('백엔드 수정 응답:', updatedPost);

            // 프론트엔드 형식으로 변환
            const updatedPostFrontend = {
                id: updatedPost.id,
                title: updatedPost.title,
                workType: updatedPost.work_type,
                topicStatus: updatedPost.topic_status,
                outline: updatedPost.outline,
                outlineStatus: updatedPost.outline_status,
                images: updatedPost.images || [],
                publishedUrl: updatedPost.published_url,
                orderRequestStatus: updatedPost.order_request_status,
                orderRequestId: updatedPost.order_request_id,
                createdAt: updatedPost.created_at,
                startDate: updatedPost.start_date,
                dueDate: updatedPost.due_date,
                productId: updatedPost.product_id,
                productName: updatedPost.productName,
                quantity: updatedPost.quantity,
                campaignId: updatedPost.campaign_id
            };

            // 전체 데이터 다시 가져오기
            await fetchCampaignDetail();

            console.log('업무 수정 성공:', updatedPostFrontend);
            showSuccess(`업무 "${updatedPost.title}"이(가) 수정되었습니다.`);
        } catch (error) {
            console.error('업무 수정 실패:', error);
            console.error('API 에러 상세:', error.response?.data);
            showError(`업무 수정 실패: ${error.response?.data?.detail || error.message}`);
        }
        setEditModalOpen(false); setSelectedPost(null);
    };

    const handleRegisterOutline = async (outlineData) => {
        const postId = selectedRows[0];
        try {
            // Django API로 목차 등록
            await api.put(`/api/posts/${postId}`, {
                outline: outlineData.outline,
                outline_status: 'pending'
            });
            showSuccess('목차가 등록되었습니다!');
            fetchCampaignDetail();
        } catch (error) { 
            console.error('목차 등록 실패:', error);
            showError('목차 등록 실패'); 
        }
        setOutlineModalOpen(false); setSelectedRows([]);
    };

    const handleRegisterTopic = async (topicData) => {
        try {
            console.log('새 업무 등록 시작:', topicData);

            // 백엔드 API 호출로 DB에 저장
            const postPayload = {
                title: topicData.title,
                work_type: topicData.workType,
                topic_status: topicData.skipApproval ? '승인' : '대기',
                outline: null,
                outline_status: null,
                images: topicData.images || [],
                published_url: null,
                order_request_status: null,
                order_request_id: null,
                start_date: topicData.startDate,
                due_date: topicData.dueDate,
                product_id: topicData.productId,
                quantity: topicData.quantity || 1
            };

            console.log('API 호출 페이로드:', postPayload);

            const response = await api.post(`/api/campaigns/${campaignId}/posts/`, postPayload);
            const savedPost = response.data;

            console.log('백엔드 응답:', savedPost);

            // 프론트엔드 형식으로 변환
            const newPost = {
                id: savedPost.id,
                title: savedPost.title,
                workType: savedPost.work_type,
                topicStatus: savedPost.topic_status,
                outline: savedPost.outline,
                outlineStatus: savedPost.outline_status,
                images: savedPost.images || [],
                publishedUrl: savedPost.published_url,
                orderRequestStatus: savedPost.order_request_status,
                orderRequestId: savedPost.order_request_id,
                createdAt: savedPost.created_at,
                startDate: savedPost.start_date,
                dueDate: savedPost.due_date,
                productId: savedPost.product_id,
                productName: savedPost.productName, // 백엔드에서 조인으로 가져온 제품명
                quantity: savedPost.quantity,
                campaignId: savedPost.campaign_id
            };

            // 전체 데이터 다시 가져오기
            await fetchCampaignDetail();
            setTopicModalOpen(false);

            console.log('새 업무 등록 성공:', newPost);
            showSuccess(`새 업무 "${topicData.title}"이(가) 등록되었습니다.`);
        } catch (error) {
            console.error('업무 등록 실패:', error);
            console.error('API 에러 상세:', error.response?.data);
            console.error('API 응답 상태:', error.response?.status);
            console.error('API 응답 헤더:', error.response?.headers);
            console.error('요청 URL:', error.config?.url);
            console.error('요청 데이터:', error.config?.data);
            showError(`업무 등록 실패: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleRegisterLink = async (url) => {
        const postId = selectedRows[0];
        try {
            // Django API로 링크 등록
            await api.put(`/api/posts/${postId}`, {
                published_url: url
            });
            showSuccess('링크가 등록되었습니다!');
            fetchCampaignDetail();
        } catch(error) { 
            console.error('링크 등록 실패:', error);
            showError('링크 등록 실패'); 
        }
        setLinkModalOpen(false); setSelectedRows([]);
    };

    const handleConfirmDelete = async () => { 
        try {
            // 더미로 삭제 성공 처리
            showSuccess('컨텐츠가 삭제되었습니다! (더미 모드)');
            fetchCampaignDetail();
        } catch (error) { showError('삭제 실패'); }
        setDeleteModalOpen(false); setSelectedPost(null); 
    };

    const handleOrderRequest = async (post) => {
        setOrderRequestConfirm({ isOpen: true, post });
    };

    const handleReorderRequest = async (post) => {
        setReorderRequestConfirm({ isOpen: true, post });
    };

    // 발주 요청 확인 함수
    const confirmOrderRequest = async () => {
        if (!orderRequestConfirm.post) return;
        
        const post = orderRequestConfirm.post;
        const costPrice = getProductCostByWorkType(post.workType);
        
        try {
            // OrderContext를 통해 발주 요청 생성
            const orderData = {
                title: `캠페인 업무 발주 - ${post.title}`,
                description: `${post.workType} 콘텐츠 제작을 위한 발주요청입니다.\n상품관리 연동 원가: ${costPrice.toLocaleString()}원\n\n업무 세부내용:\n- 제목: ${post.title}\n- 시작일: ${post.startDate || '미정'}\n- 마감일: ${post.endDate || '미정'}`,
                amount: costPrice,
                resourceType: '캠페인 업무 발주',
                priority: '보통',
                requester: { 
                    name: '직원1', // 실제로는 로그인한 사용자 정보
                    email: 'staff1@agency.com'
                },
                linkedCampaignId: parseInt(campaignId),
                linkedPostId: post.id,
                workType: post.workType,
                dueDate: post.endDate
            };
            
            const newOrder = await createOrderRequest(orderData);
            
            // 포스트의 발주 상태 업데이트
            setPosts(prevPosts => 
                prevPosts.map(p => 
                    p.id === post.id 
                        ? { 
                            ...p, 
                            orderRequestStatus: '발주 대기', 
                            orderRequestId: newOrder.id,
                            orderNumber: newOrder.orderNumber
                          }
                        : p
                )
            );
            
        } catch (error) {
            console.error('발주 요청 실패:', error);
            showError('발주 요청에 실패했습니다.');
        }
        
        setOrderRequestConfirm({ isOpen: false, post: null });
    };

    // 발주 재요청 확인 함수
    const confirmReorderRequest = async () => {
        if (!reorderRequestConfirm.post) return;
        
        const post = reorderRequestConfirm.post;
        const costPrice = getProductCostByWorkType(post.workType);
        
        try {
            // 더미로 재발주 요청 성공 처리
            showSuccess(`발주 재요청이 완료되었습니다! (더미 모드)\n\n업무: ${post.title}\n업무타입: ${post.workType}\n예상 원가: ${costPrice.toLocaleString()}원`);
            
            // 더미 상태 업데이트 - 재요청 시 상태를 다시 "발주 대기"로 변경
            setPosts(prevPosts => 
                prevPosts.map(p => 
                    p.id === post.id 
                        ? { ...p, orderRequestStatus: '발주 대기', orderRequestId: Date.now() }
                        : p
                )
            );
        } catch (error) {
            console.error('발주 재요청 실패:', error);
            showError('발주 재요청에 실패했습니다.');
        }
        
        setReorderRequestConfirm({ isOpen: false, post: null });
    };

    // 인라인 편집 기능
    const handleCellEdit = (postId, field, currentValue) => {
        setEditingCell({ postId, field });
        setEditingValue(currentValue || '');
    };

    const handleCellSave = async (postId, field) => {
        try {
            // 더미로 업데이트 성공 처리
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post.id === postId 
                        ? { ...post, [field]: editingValue }
                        : post
                )
            );
            showSuccess('수정이 완료되었습니다! (더미 모드)');
        } catch (error) {
            console.error('업데이트 실패:', error);
            showError('수정에 실패했습니다.');
        }
        setEditingCell(null);
        setEditingValue('');
    };

    const handleCellCancel = () => {
        setEditingCell(null);
        setEditingValue('');
    };

    const handleGenerateDocuments = async (campaignId, type = 'transaction', selectedPostIds = null) => {
        try {
            // 더미로 문서 생성 성공 처리
            await new Promise(resolve => setTimeout(resolve, 1000)); // 생성 중 효과
            
            let message = '';
            if (selectedPostIds && selectedPostIds.length > 0) {
                const selectedPosts = posts.filter(post => selectedPostIds.includes(post.id));
                const workTypes = selectedPosts.map(post => post.workType).join(', ');
                message = `📄 선택한 업무들 (${workTypes})의 ${type === 'quote' ? '견적서' : '거래명세서'}가 PDF와 JPG로 생성되었습니다! (더미 모드)\n드래그해서 카카오톡으로 전송하세요! 🚀`;
            } else {
                message = `📄 전체 캠페인의 ${type === 'quote' ? '견적서' : '거래명세서'}가 PDF와 JPG로 생성되었습니다! (더미 모드)\n드래그해서 카카오톡으로 전송하세요! 🚀`;
            }
            
            showInfo(message);
            
        } catch (error) {
            console.error('문서 생성 실패:', error);
            showError('문서 생성에 실패했습니다.');
        }
    };

    // 캠페인 편집 기능
    const handleCampaignEdit = () => {
        setCampaignEditData({
            name: campaign.name || '',
            description: campaign.description || ''
        });
        setIsCampaignEditing(true);
    };

    const handleCampaignSave = async () => {
        try {
            const response = await api.put(`/api/campaigns/${campaignId}`, campaignEditData);
            setCampaign(prev => ({ ...prev, ...response.data }));
            setIsCampaignEditing(false);
            showSuccess('캠페인 정보가 성공적으로 수정되었습니다!');
        } catch (error) {
            console.error('캠페인 수정 실패:', error);
            showError('캠페인 수정에 실패했습니다.');
        }
    };

    const handleCampaignCancel = () => {
        setIsCampaignEditing(false);
        setCampaignEditData({ name: '', description: '' });
    };
    
    const canRegisterOutline = selectedRows.length === 1 && (filteredPosts.find(p => p.id === selectedRows[0]) || posts.find(p => p.id === selectedRows[0]))?.topicStatus === '승인' && !(filteredPosts.find(p => p.id === selectedRows[0]) || posts.find(p => p.id === selectedRows[0]))?.outline;
    const canRegisterLink = selectedRows.length === 1;

    if (isLoading) {
        return <div className="p-6">캠페인 상세 정보를 불러오는 중...</div>;
    }
    
    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <h3 className="font-medium">오류가 발생했습니다</h3>
                    <p className="mt-1">{error}</p>
                    <button 
                        onClick={() => { setError(null); fetchCampaignDetail(); }}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }
    
    if (!campaign) {
        return <div className="p-6">캠페인 정보를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex-shrink-0">
                <button onClick={() => navigate('/admin/campaigns')} className="text-sm text-blue-600 hover:underline mb-2">&larr; 전체 캠페인 목록으로</button>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{campaign.name}</h2>
                        <p className="text-gray-600 mt-1">담당자: {campaign.Manager?.name || '지정되지 않음'}</p>
                    </div>
                    <button 
                        onClick={handleCampaignEdit}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 flex items-center space-x-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>캠페인 편집</span>
                    </button>
                </div>
            </div>
            <div className="flex-grow bg-white p-6 rounded-xl border border-gray-200 flex flex-col mt-4">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold text-gray-800">콘텐츠 기획 및 승인</h3>
                        <AdvancedFilter 
                            onFilterChange={handleFilterChange}
                            users={users}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="space-x-2">
                            <button onClick={() => setTopicModalOpen(true)} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">업무 등록</button>
                            <button onClick={() => setOutlineModalOpen(true)} disabled={!canRegisterOutline} className="px-3 py-1.5 text-sm font-semibold rounded-lg disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700">세부사항 등록</button>
                            <button onClick={() => setLinkModalOpen(true)} disabled={!canRegisterLink} className="px-3 py-1.5 text-sm font-semibold rounded-lg disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700">{(filteredPosts.find(p => p.id === selectedRows[0]) || posts.find(p => p.id === selectedRows[0]))?.publishedUrl ? '결과물 수정' : '결과물 등록'}</button>
                        </div>
                        <div className="border-l border-gray-300 h-8 mx-2"></div>
                        <div className="flex items-center space-x-2">
                            <div className="text-xs text-gray-600">📄 문서생성:</div>
                            
                            {/* 전체 캠페인 문서생성 */}
                            <div className="flex items-center space-x-1 border-r border-gray-200 pr-2">
                                <span className="text-xs text-gray-500">전체</span>
                                <button
                                    onClick={() => handleGenerateDocuments(campaign.id, 'transaction')}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
                                    title="전체 캠페인 거래명세서 생성 (PDF + JPG)"
                                >
                                    <FileText size={16} />
                                </button>
                                <button
                                    onClick={() => handleGenerateDocuments(campaign.id, 'quote')}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors group"
                                    title="전체 캠페인 견적서 생성 (PDF + JPG)"
                                >
                                    <FileImage size={16} />
                                </button>
                            </div>
                            
                            {/* 선택한 업무들 문서생성 */}
                            <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">선택</span>
                                <button
                                    onClick={() => handleGenerateDocuments(campaign.id, 'transaction', selectedRows)}
                                    disabled={selectedRows.length === 0}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group disabled:text-gray-300 disabled:hover:text-gray-300 disabled:hover:bg-transparent"
                                    title={selectedRows.length > 0 ? `선택한 ${selectedRows.length}개 업무 거래명세서 생성` : "업무를 선택해주세요"}
                                >
                                    <FileText size={16} />
                                </button>
                                <button
                                    onClick={() => handleGenerateDocuments(campaign.id, 'quote', selectedRows)}
                                    disabled={selectedRows.length === 0}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors group disabled:text-gray-300 disabled:hover:text-gray-300 disabled:hover:bg-transparent"
                                    title={selectedRows.length > 0 ? `선택한 ${selectedRows.length}개 업무 견적서 생성` : "업무를 선택해주세요"}
                                >
                                    <FileImage size={16} />
                                </button>
                                {selectedRows.length > 0 && (
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        {selectedRows.length}개 선택됨
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-grow overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="p-2 w-4"><input type="checkbox" onChange={handleSelectAll} /></th>
                                <th className="p-2">업무 타입</th>
                                <th className="p-2">제품명</th>
                                <th className="p-2">업무 내용</th>
                                <th className="p-2">시작일</th>
                                <th className="p-2">마감일</th>
                                <th className="p-2">승인 상태</th>
                                <th className="p-2">세부사항 검토</th>
                                <th className="p-2">세부사항 승인 상태</th>
                                <th className="p-2">첨부 이미지</th>
                                <th className="p-2">결과물 링크</th>
                                <th className="p-2">발주 요청</th>
                                <th className="p-2">작성 시간</th>
                                <th className="p-2">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredPosts.map(post => (
                                <tr key={post.id} className="hover:bg-gray-50">
                                    <td className="p-2"><input type="checkbox" checked={selectedRows.includes(post.id)} onChange={() => handleRowSelect(post.id)} /></td>
                                    <td className="p-2">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                            {post.workType || '블로그'}
                                        </span>
                                    </td>
                                    <td className="p-2">
                                        <span className="text-sm text-gray-600">
                                            {post.productName || '-'}
                                        </span>
                                    </td>
                                    <td className="p-2">
                                        {editingCell?.postId === post.id && editingCell?.field === 'title' ? (
                                            <div className="flex items-center space-x-1">
                                                <input
                                                    type="text"
                                                    value={editingValue}
                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                    className="text-sm border border-blue-300 rounded px-2 py-1 w-full"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleCellSave(post.id, 'title');
                                                        if (e.key === 'Escape') handleCellCancel();
                                                    }}
                                                    autoFocus
                                                />
                                                <button onClick={() => handleCellSave(post.id, 'title')} className="text-green-600 hover:text-green-800">✓</button>
                                                <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800">✗</button>
                                            </div>
                                        ) : (
                                            <span 
                                                className="font-medium text-gray-900 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                                                onClick={() => handleCellEdit(post.id, 'title', post.title)}
                                                title="클릭하여 편집"
                                            >
                                                {post.title}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {editingCell?.postId === post.id && editingCell?.field === 'startDate' ? (
                                            <div className="flex items-center space-x-1">
                                                <input
                                                    type="date"
                                                    value={editingValue}
                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                    className="text-sm border border-blue-300 rounded px-2 py-1"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleCellSave(post.id, 'startDate');
                                                        if (e.key === 'Escape') handleCellCancel();
                                                    }}
                                                    autoFocus
                                                />
                                                <button onClick={() => handleCellSave(post.id, 'startDate')} className="text-green-600 hover:text-green-800">✓</button>
                                                <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800">✗</button>
                                            </div>
                                        ) : (
                                            <span 
                                                className="text-sm text-gray-600 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                                                onClick={() => handleCellEdit(post.id, 'startDate', post.startDate)}
                                                title="클릭하여 편집"
                                            >
                                                {post.startDate ? new Date(post.startDate).toLocaleDateString('ko-KR') : '-'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {editingCell?.postId === post.id && editingCell?.field === 'dueDate' ? (
                                            <div className="flex items-center space-x-1">
                                                <input
                                                    type="date"
                                                    value={editingValue}
                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                    className="text-sm border border-blue-300 rounded px-2 py-1"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleCellSave(post.id, 'dueDate');
                                                        if (e.key === 'Escape') handleCellCancel();
                                                    }}
                                                    autoFocus
                                                />
                                                <button onClick={() => handleCellSave(post.id, 'dueDate')} className="text-green-600 hover:text-green-800">✓</button>
                                                <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800">✗</button>
                                            </div>
                                        ) : (
                                            <span 
                                                className="text-sm text-gray-600 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                                                onClick={() => handleCellEdit(post.id, 'dueDate', post.dueDate)}
                                                title="클릭하여 편집"
                                            >
                                                {post.dueDate ? new Date(post.dueDate).toLocaleDateString('ko-KR') : '-'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {editingCell?.postId === post.id && editingCell?.field === 'topicStatus' ? (
                                            <div className="flex items-center space-x-1">
                                                <select
                                                    value={editingValue}
                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                    className="text-sm border border-blue-300 rounded px-2 py-1"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleCellSave(post.id, 'topicStatus');
                                                        if (e.key === 'Escape') handleCellCancel();
                                                    }}
                                                    autoFocus
                                                >
                                                    <option value="대기">대기</option>
                                                    <option value="승인">승인</option>
                                                    <option value="거절">거절</option>
                                                </select>
                                                <button onClick={() => handleCellSave(post.id, 'topicStatus')} className="text-green-600 hover:text-green-800">✓</button>
                                                <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800">✗</button>
                                            </div>
                                        ) : (
                                            <div 
                                                className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                                                onClick={() => handleCellEdit(post.id, 'topicStatus', post.topicStatus)}
                                                title="클릭하여 편집"
                                            >
                                                <StatusBadge status={post.topicStatus} />
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-2">{post.outline ? <div className="flex items-center justify-between"><span className="text-xs truncate max-w-xs">{post.outline}</span><button onClick={() => openEditModal(post, 'outline')} className="text-gray-400 hover:text-blue-600 ml-2 shrink-0"><Edit size={14} /></button></div> : '-'}</td>
                                    <td className="p-2">{post.outlineStatus ? <StatusBadge status={post.outlineStatus} /> : '-'}</td>
                                    <td className="p-2"><ImagePreview images={post.images} /></td>
                                    <td className="p-2">{post.publishedUrl ? <a href={post.publishedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><LinkIcon size={14} className="inline"/></a> : '-'}</td>
                                    <td className="p-2">
                                        {post.orderRequestStatus ? (
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    post.orderRequestStatus === '승인완료' ? 'bg-green-100 text-green-800' :
                                                    post.orderRequestStatus === '거절됨' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {post.orderRequestStatus}
                                                </span>
                                                {post.orderRequestStatus === '거절됨' && (
                                                    <button
                                                        onClick={() => handleReorderRequest(post)}
                                                        className="px-2 py-1 text-xs font-medium bg-orange-600 text-white rounded hover:bg-orange-700"
                                                        title="재요청"
                                                    >
                                                        재요청
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleOrderRequest(post)}
                                                className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                발주 요청
                                            </button>
                                        )}
                                    </td>
                                    <td className="p-2 text-xs text-gray-600">{new Date(post.createdAt).toLocaleDateString()}</td>
                                    <td className="p-2"><div className="flex items-center space-x-2"><button onClick={() => openEditModal(post, 'topic')} className="text-gray-400 hover:text-blue-600"><Edit size={16} /></button><button onClick={() => handleDeleteClick(post)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-center items-center mt-4 flex-shrink-0">
                    <nav className="flex items-center space-x-2">
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"><ChevronLeft size={16}/></button>
                        <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md">1</button>
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"><ChevronRight size={16}/></button>
                    </nav>
                </div>
            </div>
            {isEditModalOpen && <EditModal post={selectedPost} type={modalType} onSave={handleReRequest} onClose={() => setEditModalOpen(false)} />}
            {<DeleteModal isOpen={isDeleteModalOpen} itemType="콘텐츠" itemName={selectedPost?.title} onConfirm={handleConfirmDelete} onClose={() => setDeleteModalOpen(false)} />}
            {isOutlineModalOpen && <OutlineRegisterModal onSave={handleRegisterOutline} onClose={() => setOutlineModalOpen(false)} />}
            {isTopicModalOpen && <TopicRegisterModal onSave={handleRegisterTopic} onClose={() => setTopicModalOpen(false)} campaignId={campaignId} />}
            {isLinkModalOpen && <LinkRegisterModal onSave={handleRegisterLink} onClose={() => setLinkModalOpen(false)} initialUrl={(filteredPosts.find(p => p.id === selectedRows[0]) || posts.find(p => p.id === selectedRows[0]))?.publishedUrl} />}
            
            {/* 발주 요청 확인 모달 */}
            <ConfirmModal
                isOpen={orderRequestConfirm.isOpen}
                onClose={() => setOrderRequestConfirm({ isOpen: false, post: null })}
                onConfirm={confirmOrderRequest}
                title="발주 요청 확인"
                message={orderRequestConfirm.post && (
                    <div>
                        <p>"{orderRequestConfirm.post.title}" 업무에 대한 발주를 요청하시겠습니까?</p>
                        <p className="mt-2 text-sm text-gray-600">
                            예상 원가: {getProductCostByWorkType(orderRequestConfirm.post.workType).toLocaleString()}원
                        </p>
                    </div>
                )}
                type="info"
                confirmText="발주 요청"
                cancelText="취소"
            />

            {/* 발주 재요청 확인 모달 */}
            <ConfirmModal
                isOpen={reorderRequestConfirm.isOpen}
                onClose={() => setReorderRequestConfirm({ isOpen: false, post: null })}
                onConfirm={confirmReorderRequest}
                title="발주 재요청 확인"
                message={reorderRequestConfirm.post && (
                    <div>
                        <p>"{reorderRequestConfirm.post.title}" 업무에 대한 발주를 재요청하시겠습니까?</p>
                        <p className="mt-2 text-sm text-gray-600">
                            예상 원가: {getProductCostByWorkType(reorderRequestConfirm.post.workType).toLocaleString()}원
                        </p>
                    </div>
                )}
                type="warning"
                confirmText="재요청"
                cancelText="취소"
            />

            {/* 캠페인 편집 모달 */}
            {isCampaignEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">캠페인 편집</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    캠페인명
                                </label>
                                <input
                                    type="text"
                                    value={campaignEditData.name}
                                    onChange={(e) => setCampaignEditData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="캠페인명을 입력하세요"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    설명
                                </label>
                                <textarea
                                    value={campaignEditData.description}
                                    onChange={(e) => setCampaignEditData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="캠페인 설명을 입력하세요"
                                    rows="3"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                onClick={handleCampaignCancel}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleCampaignSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                disabled={!campaignEditData.name.trim()}
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignDetailPage;
