// src/utils/mockData.js
// 백엔드가 비어있을 때 사용할 모의 데이터

export const mockUsers = [
  {
    id: 1,
    name: "관리자",
    email: "admin@brandflow.com",
    role: "슈퍼 어드민",
    company: "브랜드플로우",
    contact: "010-1234-5678",
    incentiveRate: 15,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    name: "김대행",
    email: "agency@brandflow.com",
    role: "대행사 어드민",
    company: "브랜드플로우",
    contact: "010-2345-6789",
    incentiveRate: 12,
    isActive: true,
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z"
  },
  {
    id: 3,
    name: "이직원",
    email: "staff@brandflow.com",
    role: "직원",
    company: "브랜드플로우",
    contact: "010-3456-7890",
    incentiveRate: 10,
    isActive: true,
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z"
  },
  {
    id: 4,
    name: "박클라이언트",
    email: "client@example.com",
    role: "클라이언트",
    company: "예시회사",
    contact: "010-4567-8901",
    incentiveRate: 0,
    isActive: true,
    createdAt: "2024-01-04T00:00:00Z",
    updatedAt: "2024-01-04T00:00:00Z"
  },
  {
    id: 5,
    name: "최고객",
    email: "client2@example.com",
    role: "클라이언트",
    company: "샘플기업",
    contact: "010-5678-9012",
    incentiveRate: 0,
    isActive: true,
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-05T00:00:00Z"
  }
];

export const mockCampaigns = [
  {
    id: 1,
    name: "브랜드 인지도 향상 캠페인",
    clientName: "박클라이언트",
    clientId: 4,
    managerId: 3,
    manager: "이직원",
    budget: 5000000,
    status: "진행중",
    notes: "월 2회 포스팅 필요",
    reminders: "매주 금요일 리포트 작성",
    createdAt: "2024-01-10T00:00:00Z",
    posts: [
      {
        id: 1,
        title: "브랜드 소개 포스트",
        topicStatus: "주제 승인",
        outlineStatus: "목차 작성중",
        createdAt: "2024-01-11T00:00:00Z",
        updatedAt: "2024-01-11T00:00:00Z"
      },
      {
        id: 2,
        title: "제품 리뷰 포스트",
        topicStatus: "주제 승인 대기",
        outlineStatus: "목차 미작성",
        createdAt: "2024-01-12T00:00:00Z",
        updatedAt: "2024-01-12T00:00:00Z"
      }
    ]
  },
  {
    id: 2,
    name: "신제품 론칭 캠페인",
    clientName: "최고객",
    clientId: 5,
    managerId: 3,
    manager: "이직원",
    budget: 8000000,
    status: "진행중",
    notes: "긴급 프로젝트",
    reminders: "매일 진행상황 확인",
    createdAt: "2024-01-15T00:00:00Z",
    posts: [
      {
        id: 3,
        title: "신제품 티저",
        topicStatus: "주제 승인",
        outlineStatus: "목차 승인",
        publishedUrl: "https://example.com/post3",
        createdAt: "2024-01-16T00:00:00Z",
        updatedAt: "2024-01-20T00:00:00Z"
      }
    ]
  }
];

export const mockPurchaseRequests = [
  {
    id: 1,
    title: "디자인 툴 라이센스",
    amount: 300000,
    status: "승인 대기",
    requesterId: 3,
    requester: "이직원",
    description: "Adobe Creative Suite 연간 라이센스",
    created_at: "2024-01-20T00:00:00Z"
  },
  {
    id: 2,
    title: "외부 촬영 비용",
    amount: 1200000,
    status: "승인됨",
    requesterId: 3,
    requester: "이직원",
    description: "제품 촬영 및 모델료",
    created_at: "2024-01-18T00:00:00Z"
  }
];

export const mockNotifications = [
  {
    id: 1,
    title: "새로운 캠페인이 할당되었습니다",
    message: "브랜드 인지도 향상 캠페인이 할당되었습니다.",
    userId: 3,
    isRead: false,
    type: "campaign",
    createdAt: "2024-01-10T00:00:00Z"
  },
  {
    id: 2,
    title: "구매 요청이 승인되었습니다",
    message: "외부 촬영 비용 요청이 승인되었습니다.",
    userId: 3,
    isRead: false,
    type: "purchase",
    createdAt: "2024-01-18T00:00:00Z"
  }
];

export const mockDashboardData = {
  totalCampaigns: 2,
  activeCampaigns: 2,
  completedTasks: 1,
  pendingTasks: 2,
  totalRevenue: 13000000,
  thisMonthRevenue: 5000000,
  totalUsers: 5,
  activeUsers: 5,
  pendingApprovals: 1,
  notifications: mockNotifications.filter(n => !n.isRead).length
};

// 백엔드가 비어있을 때 mock 데이터를 사용할지 결정하는 함수
export const shouldUseMockData = () => {
  // 개발 환경에서만 mock 데이터 사용
  return import.meta.env.DEV || localStorage.getItem('useMockData') === 'true';
};

// Mock 검색 기능
export const performMockSearch = (query) => {
  if (!query || query.length < 1) {
    return [];
  }

  const results = [];
  const lowerQuery = query.toLowerCase();

  // 사용자 검색
  mockUsers.forEach(user => {
    if (user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery) ||
        user.company.toLowerCase().includes(lowerQuery) ||
        user.role.toLowerCase().includes(lowerQuery)) {
      results.push({
        id: user.id,
        type: 'user',
        title: user.name,
        description: `${user.email} - ${user.role} (${user.company})`,
        url: `/users/${user.id}`,
        data: user
      });
    }
  });

  // 캠페인 검색
  mockCampaigns.forEach(campaign => {
    if (campaign.name.toLowerCase().includes(lowerQuery) ||
        campaign.clientName.toLowerCase().includes(lowerQuery) ||
        campaign.status.toLowerCase().includes(lowerQuery)) {
      results.push({
        id: campaign.id,
        type: 'campaign',
        title: campaign.name,
        description: `${campaign.clientName} - ${campaign.status}`,
        url: `/campaigns/${campaign.id}`,
        data: campaign
      });
    }
  });

  // 포스트 검색
  mockCampaigns.forEach(campaign => {
    if (campaign.posts) {
      campaign.posts.forEach(post => {
        if (post.title.toLowerCase().includes(lowerQuery) ||
            post.topicStatus.toLowerCase().includes(lowerQuery) ||
            post.outlineStatus.toLowerCase().includes(lowerQuery)) {
          results.push({
            id: post.id,
            type: 'post',
            title: post.title,
            description: `${campaign.name} - ${post.topicStatus} / ${post.outlineStatus}`,
            url: `/posts/${post.id}`,
            data: post
          });
        }
      });
    }
  });

  // 구매 요청 검색
  mockPurchaseRequests.forEach(request => {
    if (request.title.toLowerCase().includes(lowerQuery) ||
        request.description.toLowerCase().includes(lowerQuery) ||
        request.status.toLowerCase().includes(lowerQuery)) {
      results.push({
        id: request.id,
        type: 'purchase',
        title: request.title,
        description: `${request.description} - ${request.status} (${new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(request.amount)})`,
        url: `/purchase-requests/${request.id}`,
        data: request
      });
    }
  });

  return results;
};

// API 응답을 mock으로 대체하는 헬퍼 함수들
export const getMockApiResponse = (endpoint, data = null) => {
  console.log(`🎭 Mock API 호출: ${endpoint}`);
  
  // 동적 엔드포인트 처리 (campaign posts, financial summary 등)
  if (endpoint.includes('/api/campaigns/') && endpoint.includes('/posts/')) {
    const campaignId = parseInt(endpoint.match(/\/api\/campaigns\/(\d+)\/posts\//)?.[1]);
    const campaign = mockCampaigns.find(c => c.id === campaignId);
    return { data: campaign?.posts || [], status: 200 };
  }
  
  if (endpoint.includes('/api/campaigns/') && endpoint.includes('/financial_summary/')) {
    return { 
      data: { 
        total_revenue: Math.floor(Math.random() * 5000000) + 1000000, 
        total_cost: Math.floor(Math.random() * 2000000) + 500000,
        completed_tasks: Math.floor(Math.random() * 10) + 1,
        total_tasks: Math.floor(Math.random() * 15) + 5
      }, 
      status: 200 
    };
  }
  
  switch (endpoint) {
    case '/api/users/':
    case '/api/users':
      return { data: mockUsers, status: 200 };
    
    case '/api/campaigns/':
    case '/api/campaigns':
      return { data: mockCampaigns, status: 200 };
    
    case '/api/purchase-requests/':
    case '/api/purchase-requests':
      return { data: { requests: mockPurchaseRequests }, status: 200 };
    
    case '/api/notifications/':
    case '/api/notifications':
      return { data: mockNotifications, status: 200 };
    
    case '/api/notifications/unread-count':
      const unreadCount = mockNotifications.filter(n => !n.isRead).length;
      return { data: { unread_count: unreadCount }, status: 200 };
    
    case '/api/dashboard/':
    case '/api/dashboard':
      return { data: mockDashboardData, status: 200 };
    
    case '/api/search/':
    case '/api/search':
      // 검색 쿼리 파라미터가 있는지 확인
      const searchQuery = endpoint.includes('?') ? 
        new URLSearchParams(endpoint.split('?')[1]).get('q') : '';
      return { data: performMockSearch(searchQuery), status: 200 };
    
    default:
      // 기본적으로 빈 배열이나 기본 응답 반환
      if (endpoint.includes('/api/')) {
        return { data: [], status: 200 };
      }
      return null; // mock이 없는 경우 실제 API 호출
  }
};

// POST 요청을 위한 mock 응답
export const getMockPostResponse = (endpoint, data) => {
  console.log(`🎭 Mock POST API 호출: ${endpoint}`, data);
  
  switch (endpoint) {
    case '/api/users/':
    case '/api/users':
      const newUser = {
        id: Math.max(...mockUsers.map(u => u.id)) + 1,
        ...data,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockUsers.push(newUser);
      return { data: newUser, status: 201 };
    
    case '/api/campaigns/':
    case '/api/campaigns':
      const newCampaign = {
        id: Math.max(...mockCampaigns.map(c => c.id)) + 1,
        ...data,
        status: "진행중",
        createdAt: new Date().toISOString(),
        posts: []
      };
      mockCampaigns.push(newCampaign);
      return { data: newCampaign, status: 201 };
    
    default:
      return { data: { message: "Created successfully" }, status: 201 };
  }
};