import React, { useState } from 'react';
import { Home, FileText, ChevronDown, ArrowRight, LogOut, XCircle, CheckCircle, MessageSquare, Search } from 'lucide-react';

// --- MOCK DATA ---
const initialClientData = {
    name: '박도윤',
    email: 'client_b@company.com',
    campaigns: [
        { 
            id: 1, name: '2025년 1분기 신제품 런칭', manager: '김대리', 
            posts: [
                { id: 101, title: '신제품 A-Phone, AI로 일상을 바꾸다', topicStatus: '주제 승인', outline: '1. 서론: AI 스마트폰 시대의 개막\n2. 본론1: A-Phone의 혁신적인 AI 기능 3가지\n3. 본론2: 실제 사용자가 느낀 AI 기능 후기\n4. 결론: A-Phone으로 달라질 우리의 미래', outlineStatus: '목차 승인 대기', publishedUrl: null },
                { id: 102, title: 'A-Phone 카메라, 전문가급 사진의 비밀', topicStatus: '주제 반려', outline: null, outlineStatus: null, publishedUrl: null, rejectReason: '경쟁사 대비 차별점이 부족합니다.' },
                { id: 103, title: '배터리 걱정 끝! A-Phone 초고속 충전 후기', topicStatus: '주제 승인', outline: '1. 배터리 용량 및 스펙\n2. 타사 제품과의 충전 속도 비교\n3. 실사용 후기', outlineStatus: '목차 승인 대기' },
                { id: 104, title: '브랜드 가치, A-Phone의 디자인 철학', topicStatus: '주제 승인', outline: '1. 디자인 컨셉\n2. 주요 디자인 요소\n3. 사용자 경험', outlineStatus: '목차 승인', publishedUrl: 'https://blog.naver.com/sample/12345' },
                { id: 105, title: '사전예약 혜택 총정리', topicStatus: '주제 승인 대기', outline: null, outlineStatus: null, publishedUrl: null },
            ]
        },
        { 
            id: 2, name: '여름 시즌 음료 프로모션', manager: '이주임',
            posts: [
                { id: 201, title: '신메뉴! 수박주스 출시', topicStatus: '주제 승인', outline: '1.인트로\n2.신메뉴 소개\n3.이벤트 안내', outlineStatus: '목차 승인', publishedUrl: 'https://blog.naver.com/sample/67890' },
                { id: 202, title: '여름 휴가, B카페와 함께', topicStatus: '주제 승인', outline: '1. 휴가지 추천\n2. B카페 음료 추천', outlineStatus: '목차 승인', publishedUrl: 'https://blog.naver.com/sample/67891' },
            ]
        },
    ]
};

// --- HELPER COMPONENTS ---
const StatusBadge = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full inline-block whitespace-nowrap";
    const statusStyles = {
        '주제 승인 대기': 'bg-yellow-100 text-yellow-800', '목차 승인 대기': 'bg-yellow-100 text-yellow-800',
        '주제 승인': 'bg-green-100 text-green-800', '목차 승인': 'bg-green-100 text-green-800',
        '주제 반려': 'bg-red-100 text-red-800', '목차 반려': 'bg-red-100 text-red-800',
        '발행 완료': 'bg-blue-100 text-blue-800',
    };
    return <span className={`${baseClasses} ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

// --- CLIENT-SIDE COMPONENTS ---
const ClientSidebar = ({ activePage, setActivePage }) => {
    const menuItems = [ { id: 'dashboard', label: '대시보드', icon: <Home size={20} /> }, { id: 'campaigns', label: '캠페인 목록', icon: <FileText size={20} /> }];
    return ( <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0"><div className="h-16 flex items-center px-6 border-b border-gray-200"><h1 className="text-xl font-bold text-blue-600">BrandFlow</h1></div><nav className="flex-1 px-4 py-6 space-y-2">{menuItems.map(item => ( <div key={item.id} role="button" tabIndex={0} onClick={() => setActivePage(item.id, null)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActivePage(item.id, null); }} className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${activePage === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>{item.icon}<span className="ml-3">{item.label}</span></div> ))}</nav></div> );
};

const ClientHeader = ({ user, onLogout, title }) => {
    const [isProfileOpen, setProfileOpen] = useState(false);
    return ( 
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            <div className="relative">
                <div onClick={() => setProfileOpen(!isProfileOpen)} className="flex items-center space-x-2 cursor-pointer">
                    <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">{user.name.charAt(0)}</div>
                    <div><p className="text-sm font-semibold text-gray-800">{user.name} 님</p><p className="text-xs text-gray-500">{user.email}</p></div>
                    <button className="text-gray-500 hover:text-gray-700"><ChevronDown size={20} /></button>
                </div>
                {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"><LogOut size={16} className="mr-2"/> 로그아웃</button>
                    </div>
                )}
            </div>
        </header> 
    );
};

const ClientDashboard = ({ user, campaigns, setActivePage }) => {
    const allPosts = campaigns.flatMap(c => c.posts);
    const pendingTopics = allPosts.filter(p => p.topicStatus === '주제 승인 대기').length;
    const pendingOutlines = allPosts.filter(p => p.outlineStatus === '목차 승인 대기').length;
    const totalPending = pendingTopics + pendingOutlines;
    const recentlyPublished = allPosts.filter(p => p.publishedUrl).slice(0, 3);

    return (
        <div className="p-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{user.name}님, 안녕하세요!</h2>
                <p className="text-gray-600 mt-2">현재 검토가 필요한 콘텐츠가 <span className="font-bold text-blue-600">{totalPending}건</span> 있습니다.</p>
                <div className="flex space-x-4 mt-4">
                    <div className="bg-yellow-50 p-4 rounded-lg flex-1"><p className="text-sm text-yellow-800">주제 승인 대기</p><p className="text-2xl font-bold text-yellow-900">{pendingTopics}건</p></div>
                    <div className="bg-yellow-50 p-4 rounded-lg flex-1"><p className="text-sm text-yellow-800">목차 승인 대기</p><p className="text-2xl font-bold text-yellow-900">{pendingOutlines}건</p></div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">진행 중인 캠페인</h3>
                        <button onClick={() => setActivePage('campaigns', null)} className="text-sm text-blue-600 hover:underline flex items-center">전체보기 <ArrowRight size={14} className="ml-1" /></button>
                    </div>
                    <div className="space-y-4">
                        {campaigns.map(campaign => {
                            const total = campaign.posts.length;
                            const completed = campaign.posts.filter(p => p.publishedUrl).length;
                            const pendingCount = campaign.posts.filter(p => p.topicStatus?.includes('대기') || p.outlineStatus?.includes('대기')).length;
                            return (
                                <div key={campaign.id} onClick={() => setActivePage('campaignDetail', campaign.id)} className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md cursor-pointer transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center">
                                                <h4 className="font-bold text-lg text-gray-800">{campaign.name}</h4>
                                                {pendingCount > 0 && <span className="ml-2 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full">{pendingCount}</span>}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">담당자: {campaign.manager}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800">{completed}/{total}</p>
                                            <p className="text-xs text-gray-500">진행률</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}></div></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">최근 발행된 글</h3>
                    <div className="bg-white p-5 rounded-xl border border-gray-200">
                        <ul className="space-y-4">{recentlyPublished.map(post => ( <li key={post.id}><p className="font-semibold text-gray-800">{post.title}</p><a href={post.publishedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center mt-1">블로그 링크 바로가기 <ArrowRight size={14} className="ml-1" /></a></li>))}</ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ClientCampaignList = ({ campaigns, setActivePage }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredCampaigns = campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="relative mb-4">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="캠페인명 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full max-w-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                        <tr><th className="px-4 py-3">캠페인명</th><th className="px-4 py-3">담당자</th><th className="px-4 py-3">진행률</th><th className="px-4 py-3">승인대기</th></tr>
                    </thead>
                    <tbody>
                        {filteredCampaigns.map(campaign => {
                            const total = campaign.posts.length;
                            const completed = campaign.posts.filter(p => p.publishedUrl).length;
                            const pendingCount = campaign.posts.filter(p => p.topicStatus?.includes('대기') || p.outlineStatus?.includes('대기')).length;
                            return (
                                <tr key={campaign.id} onClick={() => setActivePage('campaignDetail', campaign.id)} className="border-b hover:bg-gray-50 cursor-pointer">
                                    <td className="px-4 py-3 font-semibold text-gray-900">{campaign.name}</td>
                                    <td className="px-4 py-3">{campaign.manager}</td>
                                    <td className="px-4 py-3">{completed}/{total}</td>
                                    <td className="px-4 py-3">{pendingCount > 0 ? <span className="font-bold text-yellow-600">{pendingCount} 건</span> : '-'}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ClientCampaignDetail = ({ campaign, setActivePage, onUpdatePostStatus }) => {
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    const handleReviewClick = (post) => { setSelectedPost(post); setReviewModalOpen(true); };
    const handleDetailClick = (post) => { setSelectedPost(post); setDetailModalOpen(true); };
    const handleModalClose = () => { setReviewModalOpen(false); setDetailModalOpen(false); setSelectedPost(null); };

    return (
        <div className="p-6">
            <button onClick={() => setActivePage('campaigns', null)} className="text-sm text-blue-600 hover:underline mb-4">&larr; 캠페인 목록으로</button>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">{campaign.name}</h2>
                <p className="text-gray-600 mt-1">담당자: {campaign.manager}</p>
                <div className="mt-6">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase"><tr><th className="px-4 py-3">주제</th><th className="px-4 py-3">목차</th><th className="px-4 py-3">상태</th><th className="px-4 py-3 text-center">액션</th></tr></thead>
                        <tbody>
                            {campaign.posts.map(post => {
                                const status = post.outlineStatus || post.topicStatus;
                                const isPending = status && status.includes('대기');
                                const isPublished = !!post.publishedUrl;
                                return (
                                    <tr key={post.id} className="border-b">
                                        <td onClick={() => handleDetailClick(post)} className="px-4 py-3 font-medium text-gray-900 hover:text-blue-600 cursor-pointer">{post.title}</td>
                                        <td onClick={() => handleDetailClick(post)} className="px-4 py-3 text-gray-600 hover:text-blue-600 cursor-pointer">{post.outline ? `${post.outline.substring(0, 30)}...` : '-'}</td>
                                        <td className="px-4 py-3"><StatusBadge status={status} /></td>
                                        <td className="px-4 py-3 text-center">
                                            {isPending && <button onClick={() => handleReviewClick(post)} className="font-semibold text-blue-600 hover:underline">검토하기</button>}
                                            {isPublished && <a href={post.publishedUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">링크 보기</a>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {isReviewModalOpen && <ReviewModal post={selectedPost} onClose={handleModalClose} onUpdate={onUpdatePostStatus} />}
            {isDetailModalOpen && <ContentDetailModal post={selectedPost} onClose={handleModalClose} />}
        </div>
    );
};

const ReviewModal = ({ post, onClose, onUpdate }) => {
    const [isRejecting, setRejecting] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const status = post.outlineStatus || post.topicStatus;
    const isTopicReview = status.includes('주제');

    const handleApprove = () => {
        const newStatus = isTopicReview ? '주제 승인' : '목차 승인';
        onUpdate(post.id, newStatus, null);
        onClose();
    };

    const handleReject = () => {
        if (!rejectReason) { alert('반려 사유를 입력해주세요.'); return; }
        const newStatus = isTopicReview ? '주제 반려' : '목차 반려';
        onUpdate(post.id, newStatus, rejectReason);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h3 className="text-xl font-bold mb-4">콘텐츠 검토</h3>
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div><h4 className="font-semibold text-gray-800">주제</h4><p className="text-gray-600 mt-1">{post.title}</p></div>
                    {post.outline && (<div><h4 className="font-semibold text-gray-800">목차</h4><p className="text-gray-600 mt-1 whitespace-pre-wrap">{post.outline}</p></div>)}
                </div>
                {isRejecting ? (
                    <div className="mt-6">
                        <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700">반려 사유 (필수)</label>
                        <textarea id="rejectReason" value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows="4" className="w-full p-2 mt-1 border border-gray-300 rounded-lg" />
                        <div className="flex justify-end space-x-3 mt-4">
                            <button onClick={() => setRejecting(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">취소</button>
                            <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">반려 제출</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-end space-x-3 mt-6">
                        <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50">취소</button>
                        <button onClick={() => setRejecting(true)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50">반려</button>
                        <button onClick={handleApprove} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">승인</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ContentDetailModal = ({ post, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h3 className="text-xl font-bold mb-4">콘텐츠 상세 내용</h3>
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
                    <div><h4 className="font-semibold text-gray-800">주제</h4><p className="text-gray-600 mt-1">{post.title}</p></div>
                    {post.outline && (<div><h4 className="font-semibold text-gray-800">목차</h4><p className="text-gray-600 mt-1 whitespace-pre-wrap">{post.outline}</p></div>)}
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">닫기</button>
                </div>
            </div>
        </div>
    );
};


// Main Client UI Component
export default function ClientUI({ onLogout }) {
    const [activePage, setActivePage] = useState('dashboard');
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);
    const [clientDataState, setClientDataState] = useState(initialClientData);

    const handleSetActivePage = (page, id) => {
        setActivePage(page);
        setSelectedCampaignId(id);
    }

    const handleUpdatePostStatus = (postId, newStatus, rejectReason) => {
        const updatedCampaigns = clientDataState.campaigns.map(c => ({
            ...c,
            posts: c.posts.map(p => {
                if (p.id === postId) {
                    const isTopicUpdate = p.topicStatus.includes('주제');
                    if(isTopicUpdate) {
                        return { ...p, topicStatus: newStatus, rejectReason: rejectReason || null };
                    } else {
                        return { ...p, outlineStatus: newStatus, rejectReason: rejectReason || null };
                    }
                }
                return p;
            })
        }));
        setClientDataState({...clientDataState, campaigns: updatedCampaigns});
    };

    const renderPage = () => {
        if (activePage === 'campaignDetail' && selectedCampaignId) {
            const campaign = clientDataState.campaigns.find(c => c.id === selectedCampaignId);
            return <ClientCampaignDetail campaign={campaign} setActivePage={handleSetActivePage} onUpdatePostStatus={handleUpdatePostStatus} />;
        }
        if (activePage === 'campaigns') {
            return <ClientCampaignList campaigns={clientDataState.campaigns} setActivePage={handleSetActivePage} />;
        }
        return <ClientDashboard user={clientDataState} campaigns={clientDataState.campaigns} setActivePage={handleSetActivePage} />;
    }
    
    const getPageTitle = () => {
        switch(activePage) {
            case 'dashboard': return '대시보드';
            case 'campaigns': return '캠페인 목록';
            case 'campaignDetail': return '캠페인 상세';
            default: return '대시보드';
        }
    }

    return (
        <div className="h-screen w-full bg-gray-50 flex font-sans">
            <ClientSidebar activePage={activePage} setActivePage={handleSetActivePage} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <ClientHeader user={clientDataState} onLogout={onLogout} title={getPageTitle()} />
                <div className="flex-1 overflow-y-auto">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
}
