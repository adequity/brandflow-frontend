import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Edit, Trash2, Link as LinkIcon, ChevronLeft, ChevronRight, FileText, FileImage } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useOrder } from '../contexts/OrderContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import { getCurrentUser, canApprovePost, ROLES } from '../utils/permissions';
import { approvalAPI } from '../api/client';

// 필요한 컴포넌트들을 import 합니다.
import StatusBadge from '../components/common/StatusBadge';
import AdvancedFilter from '../components/common/AdvancedFilter';
import EditModal from '../components/modals/EditModal';
import DeleteModal from '../components/modals/DeleteModal';
import OutlineRegisterModal from '../components/modals/OutlineRegisterModal';
import TopicRegisterModal from '../components/modals/TopicRegisterModal';
import LinkRegisterModal from '../components/modals/LinkRegisterModal';

const CampaignDetailPage = ({ campaigns, setCampaigns }) => {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const { showSuccess, showError, showInfo } = useToast();
    const { createOrderRequest } = useOrder();

    const [loggedInUser, setLoggedInUser] = useState(null);
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
    const [products, setProducts] = useState([]); // 상품 목록
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
        stage: 'all',
        invoiceIssued: 'all',
        paymentCompleted: 'all'
    });
    const [rejectReasonModal, setRejectReasonModal] = useState({ isOpen: false, reason: '' });
    const [outlineDetailModal, setOutlineDetailModal] = useState({ isOpen: false, post: null, outline: '' });

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
                    console.log('포스트 publishedUrl 확인:', (postsData || []).map(p => ({ id: p.id, title: p.title, publishedUrl: p.publishedUrl })));

                    // 첫 번째 포스트의 구조 확인 (원가 정보 디버깅)
                    if (postsData && postsData.length > 0) {
                        console.log('📊 첫 번째 포스트 전체 구조:', postsData[0]);
                        console.log('💰 원가 관련 필드들:', {
                            cost: postsData[0].cost,
                            product_cost: postsData[0].product_cost,
                            productCost: postsData[0].productCost,
                            price: postsData[0].price,
                            productId: postsData[0].productId,
                            product_id: postsData[0].product_id,
                            productName: postsData[0].productName
                        });
                    }
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
        // 사용자 정보 로드
        const user = getCurrentUser();
        setLoggedInUser(user);

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

    // 사용자 목록 및 상품 정보 로드
    useEffect(() => {
        const dummyUsers = [
            { id: 1, name: '슈퍼 관리자' },
            { id: 2, name: '대행사 관리자' },
            { id: 3, name: '직원1' },
            { id: 4, name: '직원2' }
        ];
        setUsers(dummyUsers);

        // 상품 목록 가져오기
        const fetchProducts = async () => {
            try {
                const response = await api.get('/api/products');
                setProducts(response.data || []);
                console.log('🛍️ 상품 목록:', response.data);
                console.log('🔍 상품 목록 상세 분석:');
                if (response.data && response.data.length > 0) {
                    response.data.forEach((product, index) => {
                        console.log(`상품 ${index + 1}:`, {
                            id: product.id,
                            name: product.name,
                            cost: product.cost,
                            전체_구조: product
                        });
                    });
                } else {
                    console.log('❌ 상품 목록이 비어있습니다');
                }
            } catch (error) {
                console.error('상품 목록 로딩 실패:', error);
            }
        };

        fetchProducts();
    }, []);

    // post의 productId나 productName으로 상품의 원가 찾기
    const getPostProductCost = (post) => {
        console.log(`🔍 원가 찾기 시작 - 포스트 ID: ${post.id}, 제목: ${post.title}`);
        console.log('📋 포스트 정보:', {
            productId: post.productId,
            productName: post.productName,
            cost: post.cost,
            product_cost: post.product_cost,
            productCost: post.productCost
        });
        console.log('🛍️ 현재 상품 목록 개수:', products.length);

        if (post.cost) {
            console.log('✅ 개별 설정된 원가 사용:', post.cost);
            return post.cost; // 이미 개별 설정된 원가가 있으면 사용
        }

        // productId로 찾기
        if (post.productId) {
            console.log('🔍 productId로 상품 찾기:', post.productId);
            const product = products.find(p => {
                console.log(`상품 비교: ${p.id} === ${post.productId}?`, p.id === post.productId);
                return p.id === post.productId;
            });

            if (product) {
                console.log('✅ 상품 찾음:', product);
                if (product.cost) {
                    console.log('💰 상품 원가(cost) 반환:', product.cost);
                    return product.cost;
                } else if (product.price) {
                    console.log('💰 상품 가격(price) 반환:', product.price);
                    return product.price;
                } else {
                    console.log('⚠️ 상품은 있지만 원가(cost)나 가격(price)이 없음');
                }
            } else {
                console.log('❌ productId로 상품을 찾을 수 없음');
            }
        }

        // productName으로 찾기 (fallback)
        if (post.productName) {
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

        console.log('❌ 원가를 찾을 수 없음 - null 반환');
        return null;
    };

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

        // 상태 필터 (승인 상태 기준)
        if (filters.status !== 'all') {
            let statusFilter = filters.status;
            if (statusFilter === '대기') {
                filtered = filtered.filter(post =>
                    post.topicStatus?.includes('대기') ||
                    post.outlineStatus?.includes('대기')
                );
            } else if (statusFilter === '승인') {
                filtered = filtered.filter(post =>
                    post.topicStatus?.includes('승인') ||
                    post.outlineStatus?.includes('승인')
                );
            } else if (statusFilter === '거절' || statusFilter === '반려') {
                filtered = filtered.filter(post =>
                    post.topicStatus?.includes('반려') ||
                    post.outlineStatus?.includes('반려')
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

        // 계산서 발행 필터
        if (filters.invoiceIssued !== 'all') {
            if (filters.invoiceIssued === 'issued') {
                filtered = filtered.filter(post => post.invoiceIssued === true);
            } else if (filters.invoiceIssued === 'not_issued') {
                filtered = filtered.filter(post => post.invoiceIssued === false || !post.invoiceIssued);
            }
        }

        // 입금 완료 필터
        if (filters.paymentCompleted !== 'all') {
            if (filters.paymentCompleted === 'completed') {
                filtered = filtered.filter(post => post.paymentCompleted === true);
            } else if (filters.paymentCompleted === 'not_completed') {
                filtered = filtered.filter(post => post.paymentCompleted === false || !post.paymentCompleted);
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
                    budget: updatedContent.budget,
                    startDate: updatedContent.startDate,
                    dueDate: updatedContent.dueDate,
                    topicStatus: '주제 승인 대기', // 수정 시 재승인 필요
                    // 업무 수정 시 발주 요청 상태 초기화
                    orderRequestStatus: null,
                    orderRequestId: null,
                    // 재무 관련 필드 추가
                    invoice_issued: updatedContent.invoiceIssued || false,
                    payment_completed: updatedContent.paymentCompleted || false,
                    invoice_due_date: updatedContent.invoiceDueDate || null,
                    payment_due_date: updatedContent.paymentDueDate || null
                };
            } else {
                // 기존 방식 호환성
                payload = {
                    title: updatedContent,
                    topicStatus: '주제 승인 대기',
                    outline: null,
                    outlineStatus: null,
                    // 업무 수정 시 발주 요청 상태 초기화
                    orderRequestStatus: null,
                    orderRequestId: null
                };
            }
        } else {
            payload = {
                outline: updatedContent,
                outlineStatus: '대기',
                // 세부사항 수정 시에도 발주 요청 상태 초기화
                orderRequestStatus: null,
                orderRequestId: null
            };
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
            showSuccess(`업무 "${updatedPost.title}"이(가) 수정되었고, 발주 요청이 초기화되었습니다. 필요시 발주 요청을 다시 해주세요.`);
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
            // FastAPI로 목차 등록 (올바른 엔드포인트 사용)
            await api.put(`/api/campaigns/${campaignId}/posts/${postId}`, {
                outline: outlineData.outline,
                outlineStatus: '목차 승인 대기'
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
                topic_status: topicData.skipApproval ? '주제 승인' : '주제 승인 대기',
                outline: null,
                outline_status: null,
                images: topicData.images || [],
                published_url: null,
                order_request_status: null,
                order_request_id: null,
                start_date: topicData.startDate,
                due_date: topicData.dueDate,
                product_id: topicData.productId,
                quantity: topicData.quantity || 1,
                budget: topicData.budget || 0,
                // 재무 관련 필드 추가
                invoice_issued: topicData.invoiceIssued || false,
                payment_completed: topicData.paymentCompleted || false,
                invoice_due_date: topicData.invoiceDueDate || null,
                payment_due_date: topicData.paymentDueDate || null
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
            // FastAPI로 링크 등록 (올바른 엔드포인트 사용)
            const response = await api.put(`/api/campaigns/${campaignId}/posts/${postId}`, {
                published_url: url
            });
            console.log('링크 등록 응답:', response.data);
            showSuccess('링크가 등록되었습니다!');
            await fetchCampaignDetail();

            // 상위 campaigns 상태 업데이트
            if (setCampaigns && campaigns) {
                setCampaigns(prevCampaigns =>
                    prevCampaigns.map(c =>
                        c.id === parseInt(campaignId) ? {
                            ...c,
                            posts: c.posts?.map(p =>
                                p.id === postId ? { ...p, publishedUrl: url } : p
                            ) || []
                        } : c
                    )
                );
                console.log('캠페인 목록 상태 업데이트 완료');
            }
        } catch(error) {
            console.error('링크 등록 실패:', error);
            console.error('Error details:', error.response?.data);
            showError(`링크 등록 실패: ${error.response?.data?.detail || error.message}`);
        }
        setLinkModalOpen(false); setSelectedRows([]);
    };

    const handleConfirmDelete = async () => {
        try {
            console.log('업무 삭제 시작:', selectedPost?.id);

            // 실제 API 호출로 삭제
            await api.delete(`/api/campaigns/${campaignId}/posts/${selectedPost.id}`);

            console.log('업무 삭제 성공');
            showSuccess(`"${selectedPost?.title}" 업무가 삭제되었습니다.`);

            // 데이터 새로고침
            await fetchCampaignDetail();
        } catch (error) {
            console.error('업무 삭제 실패:', error);
            showError(`삭제에 실패했습니다: ${error.response?.data?.detail || error.message}`);
        }
        setDeleteModalOpen(false);
        setSelectedPost(null);
    };

    const handleOrderRequest = async (post) => {
        setOrderRequestConfirm({ isOpen: true, post });
    };

    const handleReorderRequest = async (post) => {
        setReorderRequestConfirm({ isOpen: true, post });
    };

    // 발주 요청 확인 함수 (JWT 기반)
    const confirmOrderRequest = async () => {
        if (!orderRequestConfirm.post) return;

        const post = orderRequestConfirm.post;
        const costPrice = getProductCostByWorkType(post.workType);

        try {
            console.log('발주 요청 시작:', post.title);

            // JWT 기반 백엔드 API 호출
            const orderData = {
                title: `캠페인 업무 발주 - ${post.title}`,
                description: `${post.workType} 콘텐츠 제작을 위한 발주요청입니다.\n상품관리 연동 원가: ${costPrice.toLocaleString()}원\n\n업무 세부내용:\n- 제목: ${post.title}\n- 시작일: ${post.startDate || '미정'}\n- 마감일: ${post.dueDate || '미정'}`,
                cost_price: costPrice,
                resource_type: '캠페인 업무 발주',
                post_id: post.id
            };

            console.log('발주 요청 데이터:', orderData);

            const response = await api.post(`/api/campaigns/${campaignId}/posts/${post.id}/order-request`, orderData);
            const newOrderRequest = response.data;

            console.log('발주 요청 성공:', newOrderRequest);

            // 전체 데이터 다시 가져오기
            await fetchCampaignDetail();

            showSuccess(`발주 요청이 완료되었습니다!\n\n업무: ${post.title}\n업무타입: ${post.workType}\n예상 원가: ${costPrice.toLocaleString()}원\n\n발주 번호: ${newOrderRequest.id}`);

        } catch (error) {
            console.error('발주 요청 실패:', error);
            console.error('API 에러 상세:', error.response?.data);
            showError(`발주 요청에 실패했습니다: ${error.response?.data?.detail || error.message}`);
        }

        setOrderRequestConfirm({ isOpen: false, post: null });
    };

    // 발주 재요청 확인 함수 (JWT 기반)
    const confirmReorderRequest = async () => {
        if (!reorderRequestConfirm.post) return;

        const post = reorderRequestConfirm.post;
        const costPrice = getProductCostByWorkType(post.workType);

        try {
            console.log('발주 재요청 시작:', post.title);

            // JWT 기반 백엔드 API 호출 (새 발주요청 생성)
            const orderData = {
                title: `캠페인 업무 재발주 - ${post.title}`,
                description: `${post.workType} 콘텐츠 제작을 위한 재발주요청입니다.\n상품관리 연동 원가: ${costPrice.toLocaleString()}원\n\n업무 세부내용:\n- 제목: ${post.title}\n- 시작일: ${post.startDate || '미정'}\n- 마감일: ${post.dueDate || '미정'}`,
                cost_price: costPrice,
                resource_type: '캠페인 업무 재발주',
                post_id: post.id
            };

            console.log('발주 재요청 데이터:', orderData);

            const response = await api.post(`/api/campaigns/${campaignId}/posts/${post.id}/order-request`, orderData);
            const newOrderRequest = response.data;

            console.log('발주 재요청 성공:', newOrderRequest);

            // 전체 데이터 다시 가져오기
            await fetchCampaignDetail();

            showSuccess(`발주 재요청이 완료되었습니다!\n\n업무: ${post.title}\n업무타입: ${post.workType}\n예상 원가: ${costPrice.toLocaleString()}원\n\n발주 번호: ${newOrderRequest.id}`);

        } catch (error) {
            console.error('발주 재요청 실패:', error);
            console.error('API 에러 상세:', error.response?.data);
            showError(`발주 재요청에 실패했습니다: ${error.response?.data?.detail || error.message}`);
        }

        setReorderRequestConfirm({ isOpen: false, post: null });
    };

    // 발주 승인 처리
    const handleApproveOrder = async (post) => {
        try {
            console.log('발주 승인 처리:', post.title);

            const response = await api.put(`/api/campaigns/${campaignId}/posts/${post.id}/order-status`, {
                status: '승인완료',
                approverComment: '발주 승인 완료'
            });

            // 전체 데이터 다시 가져오기
            await fetchCampaignDetail();

            showSuccess(`"${post.title}" 업무의 발주가 승인되었습니다.`);
        } catch (error) {
            console.error('발주 승인 실패:', error);
            showError(`발주 승인에 실패했습니다: ${error.response?.data?.detail || error.message}`);
        }
    };

    // 발주 거절 처리
    const handleRejectOrder = async (post) => {
        const rejectReason = prompt('거절 사유를 입력하세요:');
        if (!rejectReason) return;

        try {
            console.log('발주 거절 처리:', post.title);

            const response = await api.put(`/api/campaigns/${campaignId}/posts/${post.id}/order-status`, {
                status: '거절됨',
                rejectReason: rejectReason
            });

            // 전체 데이터 다시 가져오기
            await fetchCampaignDetail();

            showInfo(`"${post.title}" 업무의 발주가 거절되었습니다.\n거절 사유: ${rejectReason}`);
        } catch (error) {
            console.error('발주 거절 실패:', error);
            showError(`발주 거절에 실패했습니다: ${error.response?.data?.detail || error.message}`);
        }
    };

    // 승인 상태 편집 권한 체크
    const canEditApprovalStatus = (post) => {
        if (!loggedInUser || !post || !campaign) return false;

        // 슈퍼 어드민은 모든 승인 상태 편집 가능
        if (loggedInUser.role === ROLES.SUPER_ADMIN) {
            return true;
        }

        // 에이전시 어드민은 본인 company의 캠페인만 승인 상태 편집 가능
        if (loggedInUser.role === ROLES.AGENCY_ADMIN) {
            return campaign.companyId === loggedInUser.companyId;
        }

        // 클라이언트는 자신의 캠페인 업무만 승인 가능
        if (loggedInUser.role === ROLES.CLIENT) {
            return campaign.userId === loggedInUser.id;
        }

        // 직원은 승인 상태 편집 불가
        return false;
    };

    // 인라인 편집 기능
    const handleCellEdit = (postId, field, currentValue) => {
        // 승인 상태 관련 필드는 권한 체크
        if ((field === 'topicStatus' || field === 'outlineStatus')) {
            const post = posts.find(p => p.id === postId);
            if (!canEditApprovalStatus(post)) {
                showError('승인 상태를 편집할 권한이 없습니다.');
                return;
            }
        }

        setEditingCell({ postId, field });
        setEditingValue(currentValue || '');
    };

    const handleCellSave = async (postId, field) => {
        try {
            console.log(`${field} 상태 업데이트 시작:`, { postId, field, newValue: editingValue });

            // 모든 필드에 대해 기존 업무 수정 API 사용
            const updateData = { [field]: editingValue };
            const response = await api.put(`/api/campaigns/${campaignId}/posts/${postId}`, updateData);
            console.log('업무 수정 API 호출 성공:', response.data);

            // 로컬 상태 즉시 업데이트
            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post.id === postId
                        ? { ...post, [field]: editingValue }
                        : post
                )
            );

            const fieldName = field === 'topicStatus' ? '승인 상태' : field === 'outlineStatus' ? '세부사항 승인 상태' : field;
            showSuccess(`${fieldName}이(가) "${editingValue}"(으)로 수정되었습니다.`);

            // 서버 데이터와 동기화를 위해 캠페인 데이터 새로고침
            await fetchCampaignDetail();

        } catch (error) {
            console.error('상태 업데이트 실패:', error);
            console.error('API 에러 상세:', error.response?.data);
            showError(`상태 수정에 실패했습니다: ${error.response?.data?.detail || error.message}`);
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
            showInfo('문서를 생성하고 있습니다...');

            // 동적 import로 문서 생성 유틸리티 로드
            const { fetchCompanyInfo, fetchCompanyLogo, transformCampaignToDocument, generateDocumentHTML } = await import('../utils/documentGenerator');

            // 회사 정보와 로고 가져오기
            const [companyInfo, companyLogo] = await Promise.all([
                fetchCompanyInfo(),
                fetchCompanyLogo()
            ]);

            // 캠페인 데이터를 문서 데이터로 변환 (상품 목록도 전달)
            const documentData = transformCampaignToDocument(campaign, posts, selectedPostIds, type, products);

            // 승인된 업무가 없는 경우
            if (documentData.items.length === 0) {
                showError('승인된 업무가 없어 문서를 생성할 수 없습니다. 업무를 승인한 후 다시 시도해주세요.');
                return;
            }

            // HTML 문서 생성 (로고 포함)
            const documentHTML = generateDocumentHTML(documentData, companyInfo, {}, companyLogo);

            // 새 창에서 문서 열기
            const printWindow = window.open('', '_blank');
            printWindow.document.write(documentHTML);
            printWindow.document.close();

            // 인쇄 대화상자 열기
            printWindow.onload = () => {
                printWindow.print();
            };

            let message = '';
            if (selectedPostIds && selectedPostIds.length > 0) {
                const selectedPosts = posts.filter(post => selectedPostIds.includes(post.id));
                const workTypes = selectedPosts.map(post => post.workType).join(', ');
                message = `📄 선택한 업무들 (${workTypes})의 ${type === 'quote' ? '견적서' : '거래명세서'}가 생성되었습니다!\n새 창에서 열렸으며 인쇄할 수 있습니다. 🚀`;
            } else {
                message = `📄 전체 캠페인의 ${type === 'quote' ? '견적서' : '거래명세서'}가 생성되었습니다!\n새 창에서 열렸으며 인쇄할 수 있습니다. 🚀`;
            }

            showSuccess(message);

        } catch (error) {
            console.error('문서 생성 실패:', error);
            showError(`문서 생성에 실패했습니다: ${error.message}`);
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
            // 캠페인 정보 수정
            const response = await api.put(`/api/campaigns/${campaignId}`, campaignEditData);
            setCampaign(prev => ({ ...prev, ...response.data }));

            // 캠페인 수정 시 모든 posts의 발주 요청 상태 초기화
            try {
                console.log('캠페인 수정으로 인한 발주 요청 상태 초기화 시작...');
                await api.put(`/api/campaigns/${campaignId}/reset-order-requests`);
                console.log('발주 요청 상태 초기화 완료');

                // 로컬 상태도 업데이트
                setPosts(prevPosts =>
                    prevPosts.map(post => ({
                        ...post,
                        orderRequestStatus: null,
                        orderRequestId: null
                    }))
                );

                showSuccess('캠페인 정보가 수정되었고, 모든 발주 요청이 초기화되었습니다. 필요시 발주 요청을 다시 해주세요.');
            } catch (resetError) {
                console.error('발주 요청 상태 초기화 실패:', resetError);
                showSuccess('캠페인 정보는 수정되었으나 발주 요청 초기화에 실패했습니다.');
            }

            setIsCampaignEditing(false);

            // 전체 데이터 다시 로드하여 최신 상태 반영
            await fetchCampaignDetail();

        } catch (error) {
            console.error('캠페인 수정 실패:', error);
            showError('캠페인 수정에 실패했습니다.');
        }
    };

    const handleCampaignCancel = () => {
        setIsCampaignEditing(false);
        setCampaignEditData({ name: '', description: '' });
    };
    
    const canRegisterOutline = selectedRows.length === 1 && (filteredPosts.find(p => p.id === selectedRows[0]) || posts.find(p => p.id === selectedRows[0]))?.topicStatus === '주제 승인' && !(filteredPosts.find(p => p.id === selectedRows[0]) || posts.find(p => p.id === selectedRows[0]))?.outline;
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
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-neutral-50">
            {/* Header Section */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
                <div className="max-w-[95%] mx-auto px-4 py-6">
                    <button
                        onClick={() => navigate('/admin/campaigns')}
                        className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 mb-6 group transition-colors duration-200"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform duration-200" />
                        전체 캠페인 목록으로
                    </button>

                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-700 to-primary-900 bg-clip-text text-transparent">
                                {campaign.name}
                            </h1>
                            <p className="text-neutral-600 mt-2 text-lg">담당자: {campaign.Manager?.name || '지정되지 않음'}</p>
                        </div>
                        <button
                            onClick={handleCampaignEdit}
                            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                        >
                            <Edit className="w-4 h-4" />
                            <span>캠페인 편집</span>
                        </button>
                    </div>

                    {/* Campaign Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-neutral-200/50">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-neutral-500">총 업무</p>
                                    <p className="text-2xl font-bold text-neutral-900">{posts.length}개</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-neutral-200/50">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-neutral-500">완료된 업무</p>
                                    <p className="text-2xl font-bold text-neutral-900">{posts.filter(p => p.status === 'approved').length}개</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-neutral-200/50">
                            <div className="flex items-center">
                                <div className="p-3 bg-yellow-100 rounded-lg">
                                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-neutral-500">진행 중</p>
                                    <p className="text-2xl font-bold text-neutral-900">{posts.filter(p => p.status === 'pending').length}개</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-neutral-200/50">
                            <div className="flex items-center">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-neutral-500">총 매출</p>
                                    <p className="text-2xl font-bold text-neutral-900">
                                        {(campaign?.budget || 0).toLocaleString()}원
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Main Content Section */}
            <div className="max-w-[95%] mx-auto px-4 py-6">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-neutral-200/50 shadow-xl overflow-hidden">
                    {/* Control Panel Header */}
                    <div className="bg-gradient-to-r from-neutral-50 to-neutral-100/80 border-b border-neutral-200/70 p-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-6">
                                <h2 className="text-2xl font-bold text-neutral-800">콘텐츠 기획 및 승인</h2>
                                <AdvancedFilter
                                    onFilterChange={handleFilterChange}
                                    users={users}
                                />
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setTopicModalOpen(true)}
                                        className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        업무 등록
                                    </button>
                                    <button
                                        onClick={() => setOutlineModalOpen(true)}
                                        disabled={!canRegisterOutline}
                                        className="px-5 py-2.5 font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:shadow-none bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800"
                                    >
                                        세부사항 등록
                                    </button>
                                    <button
                                        onClick={() => setLinkModalOpen(true)}
                                        disabled={!canRegisterLink}
                                        className="px-5 py-2.5 font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:shadow-none bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
                                    >
                                        {(filteredPosts.find(p => p.id === selectedRows[0]) || posts.find(p => p.id === selectedRows[0]))?.publishedUrl ? '결과물 수정' : '결과물 등록'}
                                    </button>
                                </div>
                                <div className="h-8 w-px bg-neutral-300 mx-4"></div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-neutral-600">📄 문서생성</span>
                                    </div>

                                    {/* 전체 캠페인 문서생성 */}
                                    <div className="flex items-center space-x-2 border-r border-neutral-200 pr-4">
                                        <span className="text-xs text-neutral-500 font-medium">전체</span>
                                        <button
                                            onClick={() => handleGenerateDocuments(campaign.id, 'transaction')}
                                            className="p-2.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
                                            title="전체 캠페인 거래명세서 생성 (PDF + JPG)"
                                        >
                                            <FileText size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleGenerateDocuments(campaign.id, 'quote')}
                                            className="p-2.5 text-neutral-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 group"
                                            title="전체 캠페인 견적서 생성 (PDF + JPG)"
                                        >
                                            <FileImage size={18} />
                                        </button>
                                    </div>

                                    {/* 선택한 업무들 문서생성 */}
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-neutral-500 font-medium">선택</span>
                                        <button
                                            onClick={() => handleGenerateDocuments(campaign.id, 'transaction', selectedRows)}
                                            disabled={selectedRows.length === 0}
                                            className="p-2.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group disabled:text-neutral-300 disabled:hover:text-neutral-300 disabled:hover:bg-transparent"
                                            title={selectedRows.length > 0 ? `선택한 ${selectedRows.length}개 업무 거래명세서 생성` : "업무를 선택해주세요"}
                                        >
                                            <FileText size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleGenerateDocuments(campaign.id, 'quote', selectedRows)}
                                            disabled={selectedRows.length === 0}
                                            className="p-2.5 text-neutral-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 group disabled:text-neutral-300 disabled:hover:text-neutral-300 disabled:hover:bg-transparent"
                                            title={selectedRows.length > 0 ? `선택한 ${selectedRows.length}개 업무 견적서 생성` : "업무를 선택해주세요"}
                                        >
                                            <FileImage size={18} />
                                        </button>
                                        {selectedRows.length > 0 && (
                                            <span className="text-xs text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full font-medium">
                                                {selectedRows.length}개 선택됨
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Table Section */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/50 border-b border-neutral-200">
                                    <tr>
                                        <th className="p-4 w-12">
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 text-primary-600 bg-white border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
                                            />
                                        </th>
                                        <th className="p-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">업무 타입</th>
                                        <th className="p-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">제품명</th>
                                        <th className="p-4 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wider">수량</th>
                                        <th className="p-4 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wider">원가</th>
                                        <th className="p-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">업무 내용</th>
                                        <th className="p-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">시작일</th>
                                        <th className="p-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">마감일</th>
                                        <th className="p-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">승인 상태</th>
                                        <th className="p-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">세부사항 검토</th>
                                        <th className="p-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">세부사항 승인 상태</th>
                                        <th className="p-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">반려 사유</th>
                                        <th className="p-4 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wider">매출</th>
                                        <th className="p-4 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wider">재무 상태</th>
                                        <th className="p-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">결과물 링크</th>
                                        <th className="p-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">발주 요청</th>
                                        <th className="p-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">작성 시간</th>
                                        <th className="p-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 bg-white">
                                    {filteredPosts.map(post => (
                                        <tr key={post.id} className="hover:bg-neutral-50/50 transition-colors duration-150">
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.includes(post.id)}
                                                    onChange={() => handleRowSelect(post.id)}
                                                    className="w-4 h-4 text-primary-600 bg-white border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {post.workType || '블로그'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-neutral-700 font-medium">
                                                    {post.productName || '-'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {editingCell?.postId === post.id && editingCell?.field === 'quantity' ? (
                                                    <div className="flex items-center justify-center space-x-1">
                                                        <input
                                                            type="number"
                                                            value={editingValue}
                                                            onChange={(e) => setEditingValue(e.target.value)}
                                                            className="text-sm border border-blue-300 rounded px-2 py-1 w-16 text-center"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleCellSave(post.id, 'quantity');
                                                                if (e.key === 'Escape') handleCellCancel();
                                                            }}
                                                            min="1"
                                                            autoFocus
                                                        />
                                                        <button onClick={() => handleCellSave(post.id, 'quantity')} className="text-green-600 hover:text-green-800">✓</button>
                                                        <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800">✗</button>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className="text-sm text-neutral-700 font-medium cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                                                        onClick={() => handleCellEdit(post.id, 'quantity', post.quantity || 1)}
                                                        title="클릭하여 편집"
                                                    >
                                                        {post.quantity || 1}
                                                    </span>
                                                )}
                                            </td>

                                            {/* 원가 셀 */}
                                            <td className="p-4 text-center">
                                                {editingCell?.postId === post.id && editingCell?.field === 'cost' ? (
                                                    <div className="flex items-center justify-center space-x-1">
                                                        <input
                                                            type="number"
                                                            value={editingValue}
                                                            onChange={(e) => setEditingValue(e.target.value)}
                                                            className="text-sm border border-blue-300 rounded px-2 py-1 w-20 text-center"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleCellSave(post.id, 'cost');
                                                                if (e.key === 'Escape') handleCellCancel();
                                                            }}
                                                            min="0"
                                                            step="1000"
                                                            autoFocus
                                                        />
                                                        <button onClick={() => handleCellSave(post.id, 'cost')} className="text-green-600 hover:text-green-800">✓</button>
                                                        <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800">✗</button>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className="text-sm text-neutral-700 font-medium cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                                                        onClick={() => handleCellEdit(post.id, 'cost', getPostProductCost(post) || 0)}
                                                        title="클릭하여 편집"
                                                    >
                                                        {getPostProductCost(post) ? `${getPostProductCost(post).toLocaleString()}원` : '미설정'}
                                                    </span>
                                                )}
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
                                                    <option value="주제 승인 대기">주제 승인 대기</option>
                                                    <option value="주제 승인">주제 승인</option>
                                                    <option value="주제 반려">주제 반려</option>
                                                </select>
                                                <button onClick={() => handleCellSave(post.id, 'topicStatus')} className="text-green-600 hover:text-green-800">✓</button>
                                                <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800">✗</button>
                                            </div>
                                        ) : (
                                            <div
                                                className={`px-1 py-0.5 rounded ${
                                                    canEditApprovalStatus(post)
                                                        ? 'cursor-pointer hover:bg-gray-100'
                                                        : 'cursor-not-allowed opacity-75'
                                                }`}
                                                onClick={() => canEditApprovalStatus(post) && handleCellEdit(post.id, 'topicStatus', post.topicStatus)}
                                                title={canEditApprovalStatus(post) ? '클릭하여 편집' : '편집 권한이 없습니다'}
                                            >
                                                <StatusBadge status={post.topicStatus} />
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {post.outline ? (
                                            <button
                                                onClick={() => setOutlineDetailModal({ isOpen: true, post: post, outline: post.outline })}
                                                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                상세보기
                                            </button>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {post.outlineStatus ? (
                                            editingCell?.postId === post.id && editingCell?.field === 'outlineStatus' ? (
                                                <div className="flex items-center space-x-1">
                                                    <select
                                                        value={editingValue}
                                                        onChange={(e) => setEditingValue(e.target.value)}
                                                        className="text-sm border border-blue-300 rounded px-2 py-1"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleCellSave(post.id, 'outlineStatus');
                                                            if (e.key === 'Escape') handleCellCancel();
                                                        }}
                                                        autoFocus
                                                    >
                                                        <option value="목차 승인 대기">목차 승인 대기</option>
                                                        <option value="목차 승인">목차 승인</option>
                                                        <option value="목차 반려">목차 반려</option>
                                                    </select>
                                                    <button onClick={() => handleCellSave(post.id, 'outlineStatus')} className="text-green-600 hover:text-green-800">✓</button>
                                                    <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800">✗</button>
                                                </div>
                                            ) : (
                                                <div
                                                    className={`px-1 py-0.5 rounded ${
                                                        canEditApprovalStatus(post)
                                                            ? 'cursor-pointer hover:bg-gray-100'
                                                            : 'cursor-not-allowed opacity-75'
                                                    }`}
                                                    onClick={() => canEditApprovalStatus(post) && handleCellEdit(post.id, 'outlineStatus', post.outlineStatus)}
                                                    title={canEditApprovalStatus(post) ? '클릭하여 편집' : '편집 권한이 없습니다'}
                                                >
                                                    <StatusBadge status={post.outlineStatus} />
                                                </div>
                                            )
                                        ) : '-'}
                                    </td>
                                    <td className="p-2">
                                        {post.rejectReason ? (
                                            <button
                                                onClick={() => setRejectReasonModal({ isOpen: true, reason: post.rejectReason })}
                                                className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                상세보기
                                            </button>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-sm text-neutral-700">
                                            {post.budget && post.budget > 0 ? (
                                                `${post.budget.toLocaleString()}원`
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </span>
                                    </td>

                                    {/* 재무 상태 */}
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center space-y-1">
                                            {/* 계산서 발행 */}
                                            <div className="flex items-center space-x-1">
                                                <span className={`w-2 h-2 rounded-full ${post.invoiceIssued ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                                                <span className={`text-xs font-medium ${post.invoiceIssued ? 'text-blue-600' : 'text-gray-500'}`}>
                                                    {post.invoiceIssued ? '📄 발행' : '📄 미발행'}
                                                </span>
                                            </div>
                                            {post.invoiceDueDate && (
                                                <div className={`text-xs ${
                                                    !post.invoiceIssued && new Date(post.invoiceDueDate) < new Date()
                                                        ? 'text-red-600 font-medium'
                                                        : 'text-gray-500'
                                                }`}>
                                                    {!post.invoiceIssued && new Date(post.invoiceDueDate) < new Date() && '⚠️ '}
                                                    {new Date(post.invoiceDueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                                </div>
                                            )}

                                            {/* 입금 완료 */}
                                            <div className="flex items-center space-x-1 pt-1">
                                                <span className={`w-2 h-2 rounded-full ${post.paymentCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                <span className={`text-xs font-medium ${post.paymentCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {post.paymentCompleted ? '💰 완료' : '💰 대기'}
                                                </span>
                                            </div>
                                            {post.paymentDueDate && (
                                                <div className={`text-xs ${
                                                    !post.paymentCompleted && new Date(post.paymentDueDate) < new Date()
                                                        ? 'text-red-600 font-medium'
                                                        : 'text-gray-500'
                                                }`}>
                                                    {!post.paymentCompleted && new Date(post.paymentDueDate) < new Date() && '⚠️ '}
                                                    {new Date(post.paymentDueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-2">
                                        {post.publishedUrl ? (
                                            <a href={post.publishedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                <LinkIcon size={14} className="inline"/>
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {post.orderRequestStatus ? (
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm border transition-all duration-200 ${
                                                    post.orderRequestStatus === '승인완료' || post.orderRequestStatus === '발주 승인' ?
                                                        'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200' :
                                                    post.orderRequestStatus === '거절됨' || post.orderRequestStatus === '발주 거절' ?
                                                        'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200' :
                                                    post.orderRequestStatus === '대기' || post.orderRequestStatus === '발주 대기' ?
                                                        'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200' :
                                                        'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200'
                                                }`}>
                                                    {post.orderRequestStatus}
                                                </span>
                                                {post.orderRequestStatus === '거절됨' && (
                                                    <button
                                                        onClick={() => handleReorderRequest(post)}
                                                        className="px-3 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-sm hover:shadow-md transition-all duration-200"
                                                        title="재요청"
                                                    >
                                                        재요청
                                                    </button>
                                                )}
                                                {post.orderRequestStatus === '대기' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApproveOrder(post)}
                                                            className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 shadow-sm hover:shadow-md transition-all duration-200"
                                                            title="발주 승인"
                                                        >
                                                            승인
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectOrder(post)}
                                                            className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 shadow-sm hover:shadow-md transition-all duration-200"
                                                            title="발주 거절"
                                                        >
                                                            거절
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleOrderRequest(post)}
                                                className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
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

                    {/* Pagination */}
                    <div className="bg-gradient-to-r from-neutral-50 to-neutral-100/80 border-t border-neutral-200/70 px-6 py-4">
                        <div className="flex justify-center">
                            <nav className="flex items-center space-x-2">
                                <button className="p-3 text-neutral-500 hover:bg-white/60 rounded-xl transition-colors duration-200">
                                    <ChevronLeft size={18}/>
                                </button>
                                <button className="px-4 py-2 text-sm bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium shadow-md">
                                    1
                                </button>
                                <button className="p-3 text-neutral-500 hover:bg-white/60 rounded-xl transition-colors duration-200">
                                    <ChevronRight size={18}/>
                                </button>
                            </nav>
                        </div>
                    </div>
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

            {/* 반려 사유 상세보기 모달 */}
            {rejectReasonModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-red-600">반려 사유</h3>
                        <div className="mb-6">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{rejectReasonModal.reason}</p>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setRejectReasonModal({ isOpen: false, reason: '' })}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 목차 상세보기 및 수정 모달 */}
            {outlineDetailModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                                <svg className="w-7 h-7 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                세부사항 검토
                            </h3>
                            {outlineDetailModal.post && (
                                <p className="text-sm text-gray-600 mt-2 ml-10">
                                    업무: <span className="font-medium text-gray-900">{outlineDetailModal.post.title}</span>
                                </p>
                            )}
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto px-8 py-6">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        목차 내용
                                    </label>
                                    <textarea
                                        value={outlineDetailModal.outline}
                                        onChange={(e) => setOutlineDetailModal(prev => ({ ...prev, outline: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none font-mono text-sm leading-relaxed"
                                        placeholder="목차 내용을 입력하세요..."
                                        rows="12"
                                    />
                                    <p className="text-xs text-gray-500 mt-2 ml-1">
                                        수정 후 "저장하여 재요청" 버튼을 클릭하면 '목차 승인 대기' 상태로 변경됩니다
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                            <button
                                onClick={() => setOutlineDetailModal({ isOpen: false, post: null, outline: '' })}
                                className="px-5 py-2.5 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium transition-all duration-200 shadow-sm"
                            >
                                취소
                            </button>
                            <button
                                onClick={async () => {
                                    if (!outlineDetailModal.post) return;

                                    try {
                                        // API 호출로 목차 수정 및 상태 변경
                                        await api.put(`/api/campaigns/${campaignId}/posts/${outlineDetailModal.post.id}`, {
                                            outline: outlineDetailModal.outline,
                                            outlineStatus: '목차 승인 대기'
                                        });

                                        showSuccess('목차가 수정되었고 재승인 요청되었습니다.');

                                        // 데이터 새로고침
                                        await fetchCampaignDetail();

                                        // 모달 닫기
                                        setOutlineDetailModal({ isOpen: false, post: null, outline: '' });
                                    } catch (error) {
                                        console.error('목차 수정 실패:', error);
                                        showError(`목차 수정에 실패했습니다: ${error.response?.data?.detail || error.message}`);
                                    }
                                }}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>저장하여 재요청</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignDetailPage;
