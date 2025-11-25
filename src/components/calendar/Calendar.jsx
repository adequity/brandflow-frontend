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

            // 실제 캠페인 데이터에서 일정 생성 (JWT 기반)
            const response = await api.get('/api/campaigns/');

            const campaigns = response.data.data || response.data.results || response.data || [];
            console.log('캘린더용 캠페인 데이터:', response.data);
            console.log('추출된 캠페인 배열:', campaigns);

            // 캠페인 데이터를 기반으로 일정 생성
            const calendarTasks = [];
            
            for (const campaign of campaigns) {
                try {
                    // 캠페인 객체에서 posts 데이터 사용 (이미 포함되어 있으면 별도 API 호출 안함)
                    let posts = campaign.posts || [];
                    console.log(`캠페인 ${campaign.id} 포스트 데이터:`, posts.length > 0 ? `${posts.length}개 포스트 포함` : '포스트 없음');
                    
                    // posts가 없거나 빈 배열인 경우에만 JWT API 호출
                    if (!posts || posts.length === 0) {
                        try {
                            const postsResponse = await api.get(`/api/campaigns/${campaign.id}/posts/jwt`);
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
                        assignee: campaign.User?.name || campaign.staff_name || '담당자 미정',
                        agency: campaign.client || '클라이언트 미정',
                        campaign: campaign,
                        description: `클라이언트: ${campaign.client || '미정'}, 포스트 수: ${posts.length}개`
                    });

                    // 송장 마감일 일정 추가 (여러 필드명 시도)
                    const invoiceDueDateValue = campaign.invoiceDueDate || campaign.invoice_due_date;
                    if (invoiceDueDateValue) {
                        const invoiceDate = new Date(invoiceDueDateValue);
                        if (!isNaN(invoiceDate.getTime())) {
                            calendarTasks.push({
                                id: `invoice-${campaign.id}`,
                                title: `송장 마감: ${campaign.name}`,
                                date: invoiceDate,
                                type: 'deadline',
                                workType: '송장',
                                status: campaign.invoiceIssued ? '완료' : '대기',
                                priority: 'high',
                                assignee: campaign.User?.name || campaign.staff_name || '담당자 미정',
                                agency: campaign.client || '클라이언트 미정',
                                campaign: campaign,
                                description: `송장 발행 마감일 - ${campaign.invoiceIssued ? '발행완료' : '발행대기'}`
                            });
                        }
                    }

                    // 결제 마감일 일정 추가 (여러 필드명 시도)
                    const paymentDueDateValue = campaign.paymentDueDate || campaign.payment_due_date;
                    if (paymentDueDateValue) {
                        const paymentDate = new Date(paymentDueDateValue);
                        if (!isNaN(paymentDate.getTime())) {
                            calendarTasks.push({
                                id: `payment-${campaign.id}`,
                                title: `결제 마감: ${campaign.name}`,
                                date: paymentDate,
                                type: 'deadline',
                                workType: '결제',
                                status: campaign.paymentCompleted ? '완료' : '대기',
                                priority: 'high',
                                assignee: campaign.User?.name || campaign.staff_name || '담당자 미정',
                                agency: campaign.client || '클라이언트 미정',
                                campaign: campaign,
                                description: `결제 마감일 - ${campaign.paymentCompleted ? '결제완료' : '결제대기'}`
                            });
                        }
                    }

                    // 각 포스트별 일정 생성 - start_date와 due_date 기반
                    posts.forEach((post, index) => {
                        // Post 시작일 일정 추가 (posts.start_date 또는 startDate 기준)
                        const startDateValue = post.start_date || post.startDate;
                        if (startDateValue) {
                            try {
                                const startDate = new Date(startDateValue);
                                if (!isNaN(startDate.getTime())) {
                                    calendarTasks.push({
                                        id: `post-start-${post.id}`,
                                        title: `🚀 시작: ${post.title || post.work_type}`,
                                        date: startDate,
                                        type: 'post-start',
                                        workType: post.work_type || '기타',
                                        status: post.topic_status || '대기',
                                        priority: 'medium',
                                        assignee: campaign.User?.name || campaign.staff_name || campaign.creator_name || '담당자 미정',
                                        agency: campaign.client_company || campaign.client || '클라이언트 미정',
                                        campaign: campaign,
                                        post: post,
                                        description: `${post.work_type || '작업'} 시작 - ${post.title || '제목 없음'}`,
                                        detail: {
                                            outline: post.outline,
                                            images: post.images,
                                            publishedUrl: post.publishedUrl || post.published_url,
                                            quantity: post.quantity,
                                            productName: post.productName
                                        }
                                    });
                                }
                            } catch (error) {
                                console.warn(`Post ${post.id} start_date 파싱 오류:`, startDateValue, error);
                            }
                        }

                        // Post 마감일 일정 추가 (posts.due_date 또는 dueDate 기준)
                        const dueDateValue = post.due_date || post.dueDate;
                        if (dueDateValue) {
                            try {
                                const dueDate = new Date(dueDateValue);
                                if (!isNaN(dueDate.getTime())) {
                                    calendarTasks.push({
                                        id: `post-due-${post.id}`,
                                        title: `⏰ 마감: ${post.title || post.work_type}`,
                                        date: dueDate,
                                        type: 'post-deadline',
                                        workType: post.work_type || '기타',
                                        status: post.topic_status || '대기',
                                        priority: 'high',
                                        assignee: campaign.User?.name || campaign.staff_name || campaign.creator_name || '담당자 미정',
                                        agency: campaign.client_company || campaign.client || '클라이언트 미정',
                                        campaign: campaign,
                                        post: post,
                                        description: `${post.work_type || '작업'} 마감 - ${post.title || '제목 없음'}`,
                                        detail: {
                                            outline: post.outline,
                                            images: post.images,
                                            publishedUrl: post.publishedUrl || post.published_url,
                                            quantity: post.quantity,
                                            productName: post.productName
                                        }
                                    });
                                }
                            } catch (error) {
                                console.warn(`Post ${post.id} due_date 파싱 오류:`, dueDateValue, error);
                            }
                        }


                        // 날짜가 없는 포스트는 캠페인 시작일 기준으로 자동 배치
                        if (!startDateValue && !dueDateValue) {
                            let autoDate;
                            if (campaign.start_date) {
                                autoDate = new Date(campaign.start_date);
                                autoDate.setDate(autoDate.getDate() + index + 1);
                            } else {
                                autoDate = new Date(campaign.createdAt || Date.now());
                                autoDate.setDate(autoDate.getDate() + index + 1);
                            }

                            calendarTasks.push({
                                id: `post-auto-${post.id}`,
                                title: `📝 ${post.title || post.work_type}`,
                                date: autoDate,
                                type: 'post-auto',
                                workType: post.work_type || '기타',
                                status: post.topic_status || '대기',
                                priority: 'low',
                                assignee: campaign.User?.name || campaign.staff_name || campaign.creator_name || '담당자 미정',
                                agency: campaign.client_company || campaign.client || '클라이언트 미정',
                                campaign: campaign,
                                post: post,
                                description: `${post.work_type || '작업'} (자동배치) - ${post.title || '제목 없음'}`,
                                detail: {
                                    outline: post.outline,
                                    images: post.images,
                                    publishedUrl: post.publishedUrl || post.published_url,
                                    quantity: post.quantity,
                                    productName: post.productName
                                }
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
            days.push(<div key={`empty-${i}`} className="h-24 md:h-32 border border-gray-200 bg-gray-50"></div>);
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

            // 오늘 날짜인지 확인
            const today = new Date();
            const isToday = currentDay.getFullYear() === today.getFullYear() &&
                          currentDay.getMonth() === today.getMonth() &&
                          currentDay.getDate() === today.getDate();

            // 선택된 날짜인지 확인
            const isSelected = selectedDate === currentDay.toISOString().split('T')[0];

            days.push(
                <div
                    key={day}
                    className={`h-24 md:h-32 border border-gray-200 cursor-pointer transition-all touch-manipulation relative ${
                        isSelected ? 'bg-blue-50 border-blue-400 shadow-md' :
                        isToday ? 'bg-yellow-50 border-yellow-300' :
                        'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDate(currentDay.toISOString().split('T')[0])}
                >
                    <div className="p-1.5 md:p-2 h-full flex flex-col">
                        {/* 날짜 표시 */}
                        <div className={`text-xs md:text-sm font-bold mb-1 md:mb-2 ${
                            isToday ? 'text-blue-600' :
                            isSelected ? 'text-blue-700' :
                            'text-gray-900'
                        }`}>
                            {isToday ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-blue-600 text-white text-xs md:text-sm">
                                    {day}
                                </span>
                            ) : (
                                day
                            )}
                        </div>

                        {/* 일정 점 표시 */}
                        {dayTasks.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {dayTasks.slice(0, 6).map((task, idx) => {
                                    const typeStyle = getTaskTypeStyle(task.type, task.priority);
                                    const colorClass = getTaskColor(task.workType).split(' ')[0];

                                    return (
                                        <div
                                            key={task.id}
                                            className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${colorClass} cursor-pointer hover:scale-150 transition-transform`}
                                            title={`${typeStyle.icon} ${task.title}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedDate(currentDay.toISOString().split('T')[0]);
                                            }}
                                        />
                                    );
                                })}
                                {dayTasks.length > 6 && (
                                    <div className="text-[8px] md:text-[10px] text-gray-500 font-medium ml-0.5">
                                        +{dayTasks.length - 6}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 일정 개수 표시 (모바일) */}
                        {dayTasks.length > 0 && (
                            <div className="mt-auto text-[9px] md:text-[10px] text-gray-500 font-medium">
                                {dayTasks.length}개
                            </div>
                        )}
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
            '리워드 광고': 'bg-yellow-100 text-yellow-800',
            '캠페인': 'bg-green-100 text-green-800',
            '송장': 'bg-orange-100 text-orange-800',
            '결제': 'bg-purple-100 text-purple-800',
            '기타': 'bg-gray-100 text-gray-800',
            'default': 'bg-gray-100 text-gray-800'
        };
        return colors[workType] || colors.default;
    };

    // 일정 타입별 아이콘과 스타일
    const getTaskTypeStyle = (type, priority) => {
        const styles = {
            'post-start': { icon: '🚀', border: 'border-l-4 border-green-400' },
            'post-deadline': { icon: '⏰', border: 'border-l-4 border-red-400' },
            'post': { icon: '📝', border: 'border-l-4 border-blue-400' },
            'post-auto': { icon: '📝', border: 'border-l-4 border-gray-400' },
            'campaign': { icon: '📋', border: 'border-l-4 border-green-400' },
            'deadline': { icon: '📅', border: priority === 'high' ? 'border-l-4 border-red-400' : 'border-l-4 border-orange-400' },
            'default': { icon: '📌', border: 'border-l-4 border-gray-400' }
        };
        return styles[type] || styles.default;
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
        // 실제 데이터에서 업무타입, 상태, 담당자, 대행사 목록 추출
        const uniqueWorkTypes = [...new Set(tasks.map(task => task.workType).filter(Boolean))];
        const uniqueStatuses = [...new Set(tasks.map(task => task.status).filter(Boolean))];
        const uniqueAssignees = [...new Set(tasks.map(task => task.assignee).filter(Boolean))];
        const uniqueAgencies = [...new Set(tasks.map(task => task.agency).filter(Boolean))];

        const baseOptions = {
            workTypes: uniqueWorkTypes.length > 0 ? uniqueWorkTypes : ['기타'],
            statuses: uniqueStatuses.length > 0 ? uniqueStatuses : ['대기', '승인']
        };

        if (user.role === 'SUPER_ADMIN') {
            return {
                ...baseOptions,
                agencies: uniqueAgencies,
                assignees: uniqueAssignees
            };
        } else if (user.role === 'AGENCY_ADMIN') {
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

    // 오늘의 할 일 계산
    const getTodayTasks = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return filteredTasks.filter(task => {
            const taskDate = new Date(task.date);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() === today.getTime();
        }).sort((a, b) => {
            // 우선순위 정렬: high > medium > low
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
        });
    };

    const todayTasks = getTodayTasks();

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-6">
            {/* 오늘의 할 일 */}
            {todayTasks.length > 0 && (
                <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-base md:text-lg font-semibold text-blue-800 mb-2 md:mb-3 flex items-center">
                        📅 오늘의 할 일 ({todayTasks.length}개)
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {todayTasks.map(task => {
                            const typeStyle = getTaskTypeStyle(task.type, task.priority);
                            return (
                                <div
                                    key={task.id}
                                    className={`flex items-center justify-between p-2 md:p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${typeStyle.border.split(' ').slice(-2).join(' ')} touch-manipulation min-h-[44px]`}
                                    onClick={(e) => handleCampaignClick(task, e)}
                                    title="클릭하여 캠페인 상세 보기"
                                >
                                    <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                                        <div className="text-base md:text-lg flex-shrink-0">{typeStyle.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 flex items-center text-xs md:text-base truncate">
                                                <span className="truncate">{task.title}</span>
                                                {task.priority === 'high' && <span className="ml-1 md:ml-2 text-red-500 text-xs flex-shrink-0">🔥</span>}
                                            </div>
                                            <div className="text-[10px] md:text-sm text-gray-600 truncate">
                                                👤 {task.assignee} • 📊 {task.status}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs md:text-sm text-gray-500 text-right flex-shrink-0 ml-2">
                                        <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs ${getTaskColor(task.workType)}`}>
                                            {task.workType}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 헤더 */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0 mb-4 md:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <h2 className="text-lg md:text-2xl font-bold text-gray-800 flex items-center">
                        <CalendarIcon className="mr-2" size={20} />
                        일정 관리
                    </h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm md:text-lg font-semibold min-w-[100px] md:min-w-[120px] text-center">
                            {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                        </span>
                        <button
                            onClick={() => navigateMonth(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* 뷰 모드 선택 */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        {['month', 'week', 'day'].map(viewType => (
                            <button
                                key={viewType}
                                onClick={() => setView(viewType)}
                                className={`px-3 md:px-4 py-2 md:py-2.5 rounded-md text-xs md:text-sm font-medium transition-colors min-h-[44px] touch-manipulation ${
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
                        className={`flex items-center px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors min-h-[44px] touch-manipulation ${
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
                <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {/* 업무타입 필터 */}
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">업무타입</label>
                            <select
                                value={filters.workType}
                                onChange={(e) => setFilters({...filters, workType: e.target.value})}
                                className="w-full px-3 py-2.5 md:py-2 text-base md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
                            >
                                <option value="all">전체</option>
                                {filterOptions.workTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* 상태 필터 */}
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">상태</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({...filters, status: e.target.value})}
                                className="w-full px-3 py-2.5 md:py-2 text-base md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
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
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">담당자</label>
                                <select
                                    value={filters.assignee}
                                    onChange={(e) => setFilters({...filters, assignee: e.target.value})}
                                    className="w-full px-3 py-2.5 md:py-2 text-base md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
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
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">대행사</label>
                                <select
                                    value={filters.agency}
                                    onChange={(e) => setFilters({...filters, agency: e.target.value})}
                                    className="w-full px-3 py-2.5 md:py-2 text-base md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
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
                        <div key={day} className="bg-gray-100 p-2 md:p-3 text-center text-xs md:text-sm font-medium text-gray-700 border-b border-gray-200">
                            {day}
                        </div>
                    ))}
                    {/* 날짜 셀들 */}
                    {renderMonthView()}
                </div>
            )}

            {/* 선택된 날짜의 상세 정보 */}
            {selectedDate && (
                <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 md:mb-3">
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
                                    className={`flex items-start sm:items-center justify-between p-2 md:p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${getTaskTypeStyle(task.type, task.priority).border} touch-manipulation min-h-[44px]`}
                                    onClick={(e) => handleCampaignClick(task, e)}
                                    title="클릭하여 캠페인 상세 보기"
                                >
                                    <div className="flex items-start sm:items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                                        <div className="text-base md:text-lg flex-shrink-0">{getTaskTypeStyle(task.type, task.priority).icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 flex items-center text-xs md:text-base">
                                                <span className="truncate">{task.title}</span>
                                                {task.priority === 'high' && <span className="ml-1 md:ml-2 text-red-500 text-xs flex-shrink-0">🔥</span>}
                                            </div>
                                            <div className="text-[10px] md:text-sm text-gray-600 truncate">
                                                📋 {task.campaign?.name || '캠페인 정보 없음'} • 👤 {task.assignee} • 📊 {task.status}
                                            </div>
                                            {task.detail && (
                                                <div className="text-[10px] md:text-xs text-gray-500 mt-1 space-y-0.5 md:space-y-1">
                                                    {task.detail.outline && (
                                                        <div className="truncate">📝 {task.detail.outline}</div>
                                                    )}
                                                    {task.detail.publishedUrl && (
                                                        <div className="truncate">🔗 결과물:
                                                            <a
                                                                href={task.detail.publishedUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-500 hover:underline ml-1 min-h-[44px] inline-flex items-center touch-manipulation"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                링크 보기
                                                            </a>
                                                        </div>
                                                    )}
                                                    {task.detail.quantity && task.detail.productName && (
                                                        <div>📦 {task.detail.productName} ({task.detail.quantity}개)</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs md:text-sm text-gray-500 text-right flex-shrink-0 ml-2">
                                        <div className="hidden sm:block">{task.date ? new Date(task.date).toLocaleDateString('ko-KR') : '날짜 없음'}</div>
                                        <div className="text-[10px] md:text-xs mt-0.5 md:mt-1">
                                            <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs ${getTaskColor(task.workType)}`}>
                                                {task.workType}
                                            </span>
                                        </div>
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
            <div className="mt-4 md:mt-6 space-y-2 md:space-y-3 text-xs md:text-sm">
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <span className="font-medium text-gray-700">업무타입:</span>
                    {filterOptions.workTypes.map(type => (
                        <div key={type} className="flex items-center space-x-1">
                            <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${getTaskColor(type).split(' ')[0]}`}></div>
                            <span className="text-gray-600 text-[10px] md:text-sm">{type}</span>
                        </div>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <span className="font-medium text-gray-700">일정타입:</span>
                    <div className="flex items-center space-x-1">
                        <span className="text-sm">🚀</span>
                        <span className="text-gray-600 text-[10px] md:text-sm">시작일</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="text-sm">⏰</span>
                        <span className="text-gray-600 text-[10px] md:text-sm">마감일</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="text-sm">📝</span>
                        <span className="text-gray-600 text-[10px] md:text-sm">일반업무</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="text-sm">📋</span>
                        <span className="text-gray-600 text-[10px] md:text-sm">캠페인</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="text-sm">📅</span>
                        <span className="text-gray-600 text-[10px] md:text-sm">재무마감</span>
                    </div>
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