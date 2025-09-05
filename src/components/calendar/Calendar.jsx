import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter, Users, Eye, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import CampaignQuickModal from '../modals/CampaignQuickModal';
import api from '../../api/client';

const Calendar = ({ user, viewMode = 'month' }) => {
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [filters, setFilters] = useState({
        workType: 'all',
        status: 'all',
        assignee: 'all',
        agency: 'all'
    });
    const [view, setView] = useState(viewMode); // 'month', 'week', 'day'
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [showCampaignModal, setShowCampaignModal] = useState(false);

    // 권한별 데이터 로드
    useEffect(() => {
        loadCalendarData();
    }, [currentDate, user]);

    const loadCalendarData = async () => {
        try {
            if (!user?.id) {
                setTasks([]);
                return;
            }

            // 실제 캠페인 데이터에서 일정 생성
            const response = await api.get('/api/campaigns/', {
                params: {
                    viewerId: user.id,
                    viewerRole: user.role
                }
            });

            const campaigns = response.data.results || response.data || [];
            console.log('캘린더용 캠페인 데이터:', campaigns);

            // 캠페인 데이터를 기반으로 일정 생성
            const calendarTasks = [];
            
            for (const campaign of campaigns) {
                try {
                    // 캠페인 객체에서 posts 데이터 사용 (이미 포함되어 있으면 별도 API 호출 안함)
                    let posts = campaign.posts || [];
                    
                    // posts가 없거나 빈 배열인 경우에만 API 호출
                    if (!posts || posts.length === 0) {
                        try {
                            const postsResponse = await api.get(`/api/campaigns/${campaign.id}/posts/`);
                            posts = postsResponse.data || [];
                        } catch (postError) {
                            console.warn(`캠페인 ${campaign.id}의 posts 조회 실패:`, postError);
                            posts = [];
                        }
                    }

                    // 캠페인 생성일 일정 추가
                    calendarTasks.push({
                        id: `campaign-${campaign.id}`,
                        title: `캠페인 시작: ${campaign.name}`,
                        date: new Date(campaign.createdAt || Date.now()),
                        type: 'campaign',
                        workType: '캠페인',
                        status: '진행중',
                        priority: 'high',
                        assignee: campaign.User?.name || campaign.manager_name || '담당자 미정',
                        agency: campaign.client || '클라이언트 미정',
                        campaign: campaign,
                        description: `클라이언트: ${campaign.client || '미정'}, 포스트 수: ${posts.length}개`
                    });

                    // 송장 마감일 일정 추가
                    if (campaign.invoiceDueDate) {
                        const invoiceDate = new Date(campaign.invoiceDueDate);
                        if (!isNaN(invoiceDate.getTime())) {
                            calendarTasks.push({
                                id: `invoice-${campaign.id}`,
                                title: `송장 마감: ${campaign.name}`,
                                date: invoiceDate,
                                type: 'deadline',
                                workType: '송장',
                                status: campaign.invoiceIssued ? '완료' : '대기',
                                priority: 'high',
                                assignee: campaign.User?.name || campaign.manager_name || '담당자 미정',
                                agency: campaign.client || '클라이언트 미정',
                                campaign: campaign,
                                description: `송장 발행 마감일 - ${campaign.invoiceIssued ? '발행완료' : '발행대기'}`
                            });
                        }
                    }

                    // 결제 마감일 일정 추가
                    if (campaign.paymentDueDate) {
                        const paymentDate = new Date(campaign.paymentDueDate);
                        if (!isNaN(paymentDate.getTime())) {
                            calendarTasks.push({
                                id: `payment-${campaign.id}`,
                                title: `결제 마감: ${campaign.name}`,
                                date: paymentDate,
                                type: 'deadline',
                                workType: '결제',
                                status: campaign.paymentCompleted ? '완료' : '대기',
                                priority: 'high',
                                assignee: campaign.User?.name || campaign.manager_name || '담당자 미정',
                                agency: campaign.client || '클라이언트 미정',
                                campaign: campaign,
                                description: `결제 마감일 - ${campaign.paymentCompleted ? '결제완료' : '결제대기'}`
                            });
                        }
                    }

                    // 각 포스트별 일정 생성
                    posts.forEach((post, index) => {
                        if (post.scheduledDate) {
                            calendarTasks.push({
                                id: `post-${post.id}`,
                                title: post.title || `${post.workType} 포스트`,
                                date: new Date(post.scheduledDate),
                                type: 'post',
                                workType: post.workType || '기타',
                                status: post.topicStatus || post.status || '대기',
                                priority: 'medium',
                                assignee: campaign.User?.name || campaign.manager_name || '담당자 미정',
                                agency: campaign.client || '클라이언트 미정',
                                campaign: campaign,
                                post: post,
                                description: `${post.workType || '작업'} - ${post.title || '제목 없음'}`
                            });
                        } else {
                            // 일정이 없는 포스트는 캠페인 생성일 + (인덱스+1)일 후로 설정
                            const scheduledDate = new Date(campaign.createdAt || Date.now());
                            scheduledDate.setDate(scheduledDate.getDate() + index + 1);
                            
                            calendarTasks.push({
                                id: `post-${post.id}`,
                                title: post.title || `${post.workType} 포스트`,
                                date: scheduledDate,
                                type: 'post',
                                workType: post.workType || '기타',
                                status: post.topicStatus || post.status || '대기',
                                priority: 'medium',
                                assignee: campaign.User?.name || campaign.manager_name || '담당자 미정',
                                agency: campaign.client || '클라이언트 미정',
                                campaign: campaign,
                                post: post,
                                description: `${post.workType || '작업'} - ${post.title || '제목 없음'}`
                            });
                        }
                    });

                } catch (campaignError) {
                    console.error(`캠페인 ${campaign.id} 처리 중 오류:`, campaignError);
                }
            }

            console.log('생성된 캘린더 일정:', calendarTasks);
            setTasks(calendarTasks);
            
        } catch (error) {
            console.error('캘린더 데이터 로드 실패:', error);
            showError('일정을 불러오는데 실패했습니다.');
            setTasks([]);
        }
    };

    // 실제 캠페인 데이터를 기반으로 캘린더 일정 생성 (더미 데이터 제거됨)

    // 필터링 로직
    useEffect(() => {
        let filtered = [...tasks];

        if (filters.workType !== 'all') {
            filtered = filtered.filter(task => task.workType === filters.workType);
        }
        if (filters.status !== 'all') {
            filtered = filtered.filter(task => task.status === filters.status);
        }
        if (filters.assignee !== 'all') {
            filtered = filtered.filter(task => task.assignee === filters.assignee);
        }
        if (filters.agency !== 'all') {
            filtered = filtered.filter(task => task.agency === filters.agency);
        }

        setFilteredTasks(filtered);
    }, [tasks, filters]);

    // 캠페인 클릭 핸들러
    const handleCampaignClick = (task, event) => {
        event.stopPropagation(); // 날짜 클릭 이벤트 방지
        if (task.campaign) {
            setSelectedCampaign(task.campaign);
            setShowCampaignModal(true);
        }
    };

    // 캠페인 수정 페이지로 이동
    const handleEditCampaign = (campaign) => {
        setShowCampaignModal(false);
        navigate(`/admin/campaigns/${campaign.id}`);
    };

    // 캠페인 모달 닫기
    const handleCloseModal = () => {
        setShowCampaignModal(false);
        setSelectedCampaign(null);
    };

    // 달력 네비게이션
    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        if (view === 'month') {
            newDate.setMonth(newDate.getMonth() + direction);
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() + (direction * 7));
        } else {
            newDate.setDate(newDate.getDate() + direction);
        }
        setCurrentDate(newDate);
    };

    // 월 달력 렌더링
    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        
        // 빈 셀들 (이전 달)
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 border border-gray-200 bg-gray-50"></div>);
        }

        // 현재 달의 날짜들
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDay = new Date(year, month, day);
            const dayTasks = filteredTasks.filter(task => {
                const taskDate = new Date(task.date);
                return taskDate.getFullYear() === currentDay.getFullYear() &&
                       taskDate.getMonth() === currentDay.getMonth() &&
                       taskDate.getDate() === currentDay.getDate();
            });

            days.push(
                <div 
                    key={day} 
                    className="h-32 border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedDate(currentDay.toISOString().split('T')[0])}
                >
                    <div className="p-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">{day}</div>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                            {dayTasks.slice(0, 3).map(task => (
                                <div 
                                    key={task.id}
                                    className={`text-xs px-2 py-1 rounded-md truncate cursor-pointer hover:opacity-80 transition-opacity ${getTaskColor(task.workType)} ${getStatusBorder(task.status)}`}
                                    title={`${task.title} (${task.status}) - 클릭하여 캠페인 상세 보기`}
                                    onClick={(e) => handleCampaignClick(task, e)}
                                >
                                    {task.title}
                                </div>
                            ))}
                            {dayTasks.length > 3 && (
                                <div className="text-xs text-gray-500 px-2">
                                    +{dayTasks.length - 3}개 더
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return days;
    };

    // 업무타입별 색상
    const getTaskColor = (workType) => {
        const colors = {
            '블로그': 'bg-blue-100 text-blue-800',
            '인스타그램': 'bg-pink-100 text-pink-800',
            '유튜브': 'bg-red-100 text-red-800',
            '페이스북': 'bg-indigo-100 text-indigo-800',
            '캠페인': 'bg-green-100 text-green-800',
            '송장': 'bg-orange-100 text-orange-800',
            '결제': 'bg-purple-100 text-purple-800',
            '기타': 'bg-gray-100 text-gray-800',
            'default': 'bg-gray-100 text-gray-800'
        };
        return colors[workType] || colors.default;
    };

    // 상태별 테두리
    const getStatusBorder = (status) => {
        const borders = {
            '대기': 'border-l-4 border-yellow-400',
            '진행중': 'border-l-4 border-blue-400',
            '승인': 'border-l-4 border-green-400',
            '완료': 'border-l-4 border-gray-400'
        };
        return borders[status] || '';
    };

    // 권한별 필터 옵션 (실제 데이터 기반)
    const getFilterOptions = () => {
        const baseOptions = {
            workTypes: ['블로그', '인스타그램', '유튜브', '페이스북', '캠페인', '기타'],
            statuses: ['대기', '진행중', '승인', '완료']
        };

        // 실제 데이터에서 담당자와 대행사 목록 추출
        const uniqueAssignees = [...new Set(tasks.map(task => task.assignee).filter(Boolean))];
        const uniqueAgencies = [...new Set(tasks.map(task => task.agency).filter(Boolean))];

        if (user.role === '슈퍼 관리자') {
            return {
                ...baseOptions,
                agencies: uniqueAgencies,
                assignees: uniqueAssignees
            };
        } else if (user.role === '대행사 어드민') {
            return {
                ...baseOptions,
                assignees: uniqueAssignees.filter(assignee => 
                    // 같은 회사의 담당자만 표시
                    tasks.some(task => task.assignee === assignee && task.agency === user.company)
                )
            };
        } else {
            return baseOptions;
        }
    };

    const filterOptions = getFilterOptions();

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <CalendarIcon className="mr-2" size={24} />
                        일정 관리
                    </h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-lg font-semibold min-w-[120px] text-center">
                            {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                        </span>
                        <button
                            onClick={() => navigateMonth(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {/* 뷰 모드 선택 */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        {['month', 'week', 'day'].map(viewType => (
                            <button
                                key={viewType}
                                onClick={() => setView(viewType)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                    view === viewType 
                                        ? 'bg-white text-gray-900 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {viewType === 'month' ? '월' : viewType === 'week' ? '주' : '일'}
                            </button>
                        ))}
                    </div>

                    {/* 필터 버튼 */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <Filter size={16} className="mr-1" />
                        필터
                    </button>
                </div>
            </div>

            {/* 필터 패널 */}
            {showFilters && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* 업무타입 필터 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">업무타입</label>
                            <select
                                value={filters.workType}
                                onChange={(e) => setFilters({...filters, workType: e.target.value})}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">전체</option>
                                {filterOptions.workTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* 상태 필터 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({...filters, status: e.target.value})}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">전체</option>
                                {filterOptions.statuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* 담당자 필터 (대행사 관리자 이상만) */}
                        {filterOptions.assignees && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                                <select
                                    value={filters.assignee}
                                    onChange={(e) => setFilters({...filters, assignee: e.target.value})}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">전체</option>
                                    {filterOptions.assignees.map(assignee => (
                                        <option key={assignee} value={assignee}>{assignee}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* 대행사 필터 (슈퍼 관리자만) */}
                        {filterOptions.agencies && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">대행사</label>
                                <select
                                    value={filters.agency}
                                    onChange={(e) => setFilters({...filters, agency: e.target.value})}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">전체</option>
                                    {filterOptions.agencies.map(agency => (
                                        <option key={agency} value={agency}>{agency}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 달력 */}
            {view === 'month' && (
                <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
                    {/* 요일 헤더 */}
                    {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                        <div key={day} className="bg-gray-100 p-3 text-center text-sm font-medium text-gray-700 border-b border-gray-200">
                            {day}
                        </div>
                    ))}
                    {/* 날짜 셀들 */}
                    {renderMonthView()}
                </div>
            )}

            {/* 선택된 날짜의 상세 정보 */}
            {selectedDate && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        {new Date(selectedDate).toLocaleDateString('ko-KR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            weekday: 'long'
                        })} 일정
                    </h3>
                    <div className="space-y-2">
                        {filteredTasks
                            .filter(task => {
                                const taskDate = new Date(task.date);
                                const selectedDateObj = new Date(selectedDate);
                                return taskDate.getFullYear() === selectedDateObj.getFullYear() &&
                                       taskDate.getMonth() === selectedDateObj.getMonth() &&
                                       taskDate.getDate() === selectedDateObj.getDate();
                            })
                            .map(task => (
                                <div 
                                    key={task.id} 
                                    className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={(e) => handleCampaignClick(task, e)}
                                    title="클릭하여 캠페인 상세 보기"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-3 h-3 rounded-full ${getTaskColor(task.workType).split(' ')[0]}`}></div>
                                        <div>
                                            <div className="font-medium text-gray-900">{task.title}</div>
                                            <div className="text-sm text-gray-600">
                                                {task.campaign?.name || '캠페인 정보 없음'} • {task.assignee} • {task.status}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {task.date ? new Date(task.date).toLocaleDateString('ko-KR') : '날짜 없음'}
                                    </div>
                                </div>
                            ))
                        }
                        {filteredTasks.filter(task => {
                            const taskDate = new Date(task.date);
                            const selectedDateObj = new Date(selectedDate);
                            return taskDate.getFullYear() === selectedDateObj.getFullYear() &&
                                   taskDate.getMonth() === selectedDateObj.getMonth() &&
                                   taskDate.getDate() === selectedDateObj.getDate();
                        }).length === 0 && (
                            <div className="text-center text-gray-500 py-4">
                                선택한 날짜에 일정이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 범례 */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-700">업무타입:</span>
                    {['블로그', '인스타그램', '유튜브', '페이스북', '캠페인'].map(type => (
                        <div key={type} className="flex items-center space-x-1">
                            <div className={`w-3 h-3 rounded-full ${getTaskColor(type).split(' ')[0]}`}></div>
                            <span className="text-gray-600">{type}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 캠페인 상세 팝업 모달 */}
            <CampaignQuickModal
                campaign={selectedCampaign}
                isOpen={showCampaignModal}
                onClose={handleCloseModal}
                onEdit={handleEditCampaign}
            />
        </div>
    );
};

export default Calendar;