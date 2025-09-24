// src/utils/permissions.js
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  AGENCY_ADMIN: 'AGENCY_ADMIN',
  EMPLOYEE: 'STAFF',
  CLIENT: 'CLIENT'
};

// 백엔드 API에서 오는 영문 role과 프론트엔드 enum 매핑 (이미 영문이므로 직접 매핑)
export const ROLE_MAPPING = {
  'SUPER_ADMIN': ROLES.SUPER_ADMIN,
  'AGENCY_ADMIN': ROLES.AGENCY_ADMIN,
  'STAFF': ROLES.EMPLOYEE,
  'CLIENT': ROLES.CLIENT
};

export const PERMISSIONS = {
  // 사용자 관리
  CREATE_SUPER_ADMIN: 'create_super_admin',
  CREATE_AGENCY_ADMIN: 'create_agency_admin', 
  CREATE_EMPLOYEE: 'create_employee',
  CREATE_CLIENT: 'create_client',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  VIEW_ALL_USERS: 'view_all_users',
  VIEW_COMPANY_USERS: 'view_company_users',
  
  // 캠페인 관리
  CREATE_CAMPAIGN: 'create_campaign',
  EDIT_CAMPAIGN: 'edit_campaign',
  DELETE_CAMPAIGN: 'delete_campaign',
  VIEW_ALL_CAMPAIGNS: 'view_all_campaigns',
  VIEW_COMPANY_CAMPAIGNS: 'view_company_campaigns',
  VIEW_OWN_CAMPAIGNS: 'view_own_campaigns',
  
  // 업무(Posts) 관리
  CREATE_POST: 'create_post',
  EDIT_POST: 'edit_post',
  DELETE_POST: 'delete_post',
  APPROVE_POST: 'approve_post', // CLIENT만 자신의 캠페인 업무 승인
  VIEW_ALL_POSTS: 'view_all_posts',
  VIEW_COMPANY_POSTS: 'view_company_posts',
  VIEW_OWN_POSTS: 'view_own_posts',
  
  // 구매요청 관리
  CREATE_PURCHASE_REQUEST: 'create_purchase_request',
  EDIT_PURCHASE_REQUEST: 'edit_purchase_request',
  DELETE_PURCHASE_REQUEST: 'delete_purchase_request',
  APPROVE_PURCHASE_REQUEST: 'approve_purchase_request', // AGENCY_ADMIN만
  VIEW_ALL_PURCHASE_REQUESTS: 'view_all_purchase_requests',
  
  // 인센티브 관리
  CALCULATE_INCENTIVES: 'calculate_incentives',
  APPROVE_INCENTIVES: 'approve_incentives', // AGENCY_ADMIN만
  VIEW_ALL_INCENTIVES: 'view_all_incentives',
  VIEW_OWN_INCENTIVES: 'view_own_incentives',
  
  // 재무 데이터
  VIEW_FINANCIAL_OVERVIEW: 'view_financial_overview',
  VIEW_COMPANY_FINANCIAL: 'view_company_financial',
  VIEW_OWN_FINANCIAL: 'view_own_financial'
};

// 역할별 권한 매핑
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // 모든 권한
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.AGENCY_ADMIN]: [
    PERMISSIONS.CREATE_EMPLOYEE,
    PERMISSIONS.CREATE_CLIENT,
    // CREATE_AGENCY_ADMIN 제거 - SUPER_ADMIN만 생성 가능
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.VIEW_COMPANY_USERS,
    
    PERMISSIONS.CREATE_CAMPAIGN,
    PERMISSIONS.EDIT_CAMPAIGN,
    PERMISSIONS.DELETE_CAMPAIGN,
    PERMISSIONS.VIEW_COMPANY_CAMPAIGNS,
    
    PERMISSIONS.CREATE_POST,
    PERMISSIONS.EDIT_POST,
    PERMISSIONS.DELETE_POST,
    PERMISSIONS.VIEW_COMPANY_POSTS,
    
    PERMISSIONS.CREATE_PURCHASE_REQUEST,
    PERMISSIONS.EDIT_PURCHASE_REQUEST,
    PERMISSIONS.DELETE_PURCHASE_REQUEST,
    PERMISSIONS.APPROVE_PURCHASE_REQUEST, // 핵심 권한
    PERMISSIONS.VIEW_ALL_PURCHASE_REQUESTS,
    
    PERMISSIONS.CALCULATE_INCENTIVES,
    PERMISSIONS.APPROVE_INCENTIVES, // 핵심 권한
    PERMISSIONS.VIEW_ALL_INCENTIVES,
    
    PERMISSIONS.VIEW_FINANCIAL_OVERVIEW,
    PERMISSIONS.VIEW_COMPANY_FINANCIAL
  ],
  
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.CREATE_CLIENT,
    
    PERMISSIONS.CREATE_CAMPAIGN,
    PERMISSIONS.EDIT_CAMPAIGN,
    PERMISSIONS.VIEW_OWN_CAMPAIGNS,
    
    PERMISSIONS.CREATE_POST,
    PERMISSIONS.EDIT_POST,
    PERMISSIONS.VIEW_OWN_POSTS,
    
    PERMISSIONS.CREATE_PURCHASE_REQUEST,
    PERMISSIONS.EDIT_PURCHASE_REQUEST,
    
    PERMISSIONS.VIEW_OWN_INCENTIVES,
    PERMISSIONS.VIEW_OWN_FINANCIAL
  ],
  
  [ROLES.CLIENT]: [
    PERMISSIONS.VIEW_OWN_CAMPAIGNS,
    PERMISSIONS.VIEW_OWN_POSTS,
    PERMISSIONS.APPROVE_POST, // 핵심 권한: 자신의 캠페인 업무만 승인 가능
    PERMISSIONS.VIEW_OWN_FINANCIAL
  ]
};

/**
 * 사용자가 특정 권한을 가지고 있는지 확인
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

/**
 * 사용자가 특정 리소스에 접근할 수 있는지 확인
 */
export const canAccessResource = (user, resource, action = 'view') => {
  if (!user || !user.role) return false;
  
  const permission = `${action}_${resource}`;
  return hasPermission(user, permission);
};

/**
 * 같은 회사인지 확인 (띄어쓰기, 대소문자, 특수문자 무시)
 */
export const isSameCompany = (user1, user2) => {
  if (!user1?.company || !user2?.company) return false;
  
  // 회사명 정규화: 띄어쓰기를 _로 대체, 소문자 변환, 특수문자 제거
  const normalizeCompany = (company) => {
    return company
      .toLowerCase()                    // 소문자 변환
      .replace(/\s+/g, '_')            // 띄어쓰기를 _로 대체
      .replace(/[^\w가-힣_]/g, '')      // 영문, 숫자, 한글, _ 제외 모든 문자 제거
      .trim();
  };
  
  const company1 = normalizeCompany(user1.company);
  const company2 = normalizeCompany(user2.company);
  
  console.log('🏢 회사명 매칭:', {
    user1: { original: user1.company, normalized: company1 },
    user2: { original: user2.company, normalized: company2 },
    match: company1 === company2
  });
  
  return company1 === company2;
};

/**
 * 사용자가 다른 사용자를 관리할 수 있는지 확인
 */
export const canManageUser = (manager, targetUser) => {
  if (!manager || !targetUser) return false;
  
  // SUPER_ADMIN은 모든 사용자 관리 가능
  if (manager.role === ROLES.SUPER_ADMIN) return true;
  
  // 본인은 언제나 수정 가능
  if (manager.id === targetUser.id) return true;
  
  // AGENCY_ADMIN은 같은 회사의 STAFF/CLIENT만 관리 가능 (SUPER_ADMIN 제외)
  if (manager.role === ROLES.AGENCY_ADMIN) {
    return isSameCompany(manager, targetUser) && 
           targetUser.role !== ROLES.SUPER_ADMIN;
  }
  
  // STAFF는 다른 사용자 관리 불가
  return false;
};

/**
 * 사용자가 CLIENT를 선택할 수 있는지 확인 (캠페인 생성 시)
 */
export const canSelectClient = (user, client) => {
  if (!user || !client) return false;
  
  // SUPER_ADMIN은 모든 CLIENT 선택 가능
  if (user.role === ROLES.SUPER_ADMIN) return true;
  
  // AGENCY_ADMIN과 STAFF는 같은 회사 CLIENT만 선택 가능
  if (user.role === ROLES.AGENCY_ADMIN || user.role === ROLES.EMPLOYEE) {
    return isSameCompany(user, client) && client.role === ROLES.CLIENT;
  }
  
  return false;
};

/**
 * 사용자가 STAFF를 선택할 수 있는지 확인 (캠페인 담당자 지정 시)
 */
export const canSelectEmployee = (user, employee) => {
  if (!user || !employee) return false;
  
  // SUPER_ADMIN은 모든 STAFF 선택 가능
  if (user.role === ROLES.SUPER_ADMIN) return true;
  
  // AGENCY_ADMIN은 같은 회사 STAFF만 선택 가능
  if (user.role === ROLES.AGENCY_ADMIN) {
    return isSameCompany(user, employee) && 
           (employee.role === ROLES.EMPLOYEE || employee.role === ROLES.AGENCY_ADMIN);
  }
  
  // STAFF는 본인만 선택 가능
  if (user.role === ROLES.EMPLOYEE) {
    return user.id === employee.id;
  }
  
  return false;
};

/**
 * 역할 생성 권한 확인
 */
export const canCreateRole = (creator, targetRole) => {
  if (!creator || !targetRole) return false;
  
  // SUPER_ADMIN은 모든 역할 생성 가능
  if (creator.role === ROLES.SUPER_ADMIN) return true;
  
  // AGENCY_ADMIN은 STAFF, CLIENT만 생성 가능 (AGENCY_ADMIN 생성 불가)
  if (creator.role === ROLES.AGENCY_ADMIN) {
    return [ROLES.EMPLOYEE, ROLES.CLIENT].includes(targetRole);
  }
  
  // STAFF는 CLIENT만 생성 가능
  if (creator.role === ROLES.EMPLOYEE) {
    return targetRole === ROLES.CLIENT;
  }
  
  return false;
};

/**
 * 삭제 권한 확인
 */
export const canDelete = (user, resourceType, resource = null) => {
  if (!user) return false;
  
  switch (resourceType) {
    case 'purchase_request':
      // STAFF는 구매요청 삭제 불가
      if (user.role === ROLES.EMPLOYEE) return false;
      return hasPermission(user, PERMISSIONS.DELETE_PURCHASE_REQUEST);
      
    case 'campaign':
      return hasPermission(user, PERMISSIONS.DELETE_CAMPAIGN);
      
    case 'user':
      if (resource) {
        return canManageUser(user, resource);
      }
      return hasPermission(user, PERMISSIONS.DELETE_USER);
      
    default:
      return false;
  }
};

/**
 * 현재 로그인한 사용자 가져오기
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('사용자 정보 파싱 실패:', error);
    return null;
  }
};

/**
 * 업무(Post) 승인 권한 확인 - CLIENT만 자신의 캠페인 업무 승인 가능
 */
export const canApprovePost = (user, post) => {
  if (!user || !post || !post.Campaign) return false;
  
  // CLIENT만 자신의 캠페인 업무를 승인할 수 있음
  if (user.role === ROLES.CLIENT) {
    return post.Campaign.userId === user.id;
  }
  
  return false;
};

/**
 * 발주요청 승인 권한 확인 - AGENCY_ADMIN만 같은 회사 요청 승인 가능
 */
export const canApprovePurchaseRequest = (user, purchaseRequest) => {
  if (!user || !purchaseRequest) return false;
  
  // SUPER_ADMIN은 모든 요청 승인 가능
  if (user.role === ROLES.SUPER_ADMIN) return true;
  
  // AGENCY_ADMIN은 같은 회사의 요청만 승인 가능
  if (user.role === ROLES.AGENCY_ADMIN) {
    if (!user.company) return false;
    return purchaseRequest.requester?.company === user.company;
  }
  
  return false;
};

/**
 * 인센티브 승인 권한 확인 - AGENCY_ADMIN만 같은 회사 STAFF 인센티브 승인 가능
 */
export const canApproveIncentive = (user, incentive) => {
  if (!user || !incentive) return false;
  
  // SUPER_ADMIN은 모든 인센티브 승인 가능
  if (user.role === ROLES.SUPER_ADMIN) return true;
  
  // AGENCY_ADMIN은 같은 회사 STAFF의 인센티브만 승인 가능
  if (user.role === ROLES.AGENCY_ADMIN) {
    if (!user.company) return false;
    return incentive.employee?.company === user.company;
  }
  
  return false;
};

/**
 * 캠페인 접근 권한 확인
 */
export const canAccessCampaign = (user, campaign) => {
  if (!user || !campaign) return false;
  
  // SUPER_ADMIN은 모든 캠페인 접근 가능
  if (user.role === ROLES.SUPER_ADMIN) return true;
  
  // AGENCY_ADMIN은 같은 회사 캠페인 접근 가능
  if (user.role === ROLES.AGENCY_ADMIN) {
    if (!user.company) return false;
    return campaign.User?.company === user.company || 
           campaign.Client?.company === user.company ||
           campaign.managerId === user.id;
  }
  
  // STAFF는 본인이 담당자인 캠페인만 접근 가능
  if (user.role === ROLES.EMPLOYEE) {
    return campaign.managerId === user.id;
  }
  
  // CLIENT는 자신의 캠페인만 접근 가능
  if (user.role === ROLES.CLIENT) {
    return campaign.userId === user.id;
  }
  
  return false;
};

/**
 * 캠페인 수정 권한 확인 - 모든 계정은 자신의 권한 안에 있는 캠페인을 수정할 수 있음
 */
export const canEditCampaign = (user, campaign) => {
  if (!user || !campaign) return false;
  
  // SUPER_ADMIN: 모든 캠페인 수정 가능
  if (user.role === ROLES.SUPER_ADMIN) return true;
  
  // AGENCY_ADMIN: 자신이 관리하는 캠페인 수정 가능
  if (user.role === ROLES.AGENCY_ADMIN) {
    if (!user.company) return false;
    // 같은 회사의 캠페인이거나, 본인이 매니저인 캠페인
    return campaign.User?.company === user.company || 
           campaign.Client?.company === user.company ||
           campaign.managerId === user.id ||
           campaign.creator_id === user.id;
  }
  
  // STAFF: 배정받은 캠페인 수정 가능 (담당자이거나 생성자인 경우)
  if (user.role === ROLES.EMPLOYEE) {
    return campaign.managerId === user.id || campaign.creator_id === user.id;
  }
  
  // CLIENT: 자신의 회사 캠페인 수정 가능
  if (user.role === ROLES.CLIENT) {
    return campaign.userId === user.id || 
           (campaign.Client?.company === user.company);
  }
  
  return false;
};

/**
 * 승인/반려 버튼 표시 여부 확인
 */
export const shouldShowApprovalButtons = (user, resourceType, resource) => {
  if (!user || !resource) return false;
  
  switch (resourceType) {
    case 'post':
      return canApprovePost(user, resource);
    case 'purchase_request':
      return canApprovePurchaseRequest(user, resource);
    case 'incentive':
      return canApproveIncentive(user, resource);
    default:
      return false;
  }
};

export default {
  ROLES,
  PERMISSIONS,
  hasPermission,
  canAccessResource,
  isSameCompany,
  canManageUser,
  canSelectClient,
  canSelectEmployee,
  canCreateRole,
  canDelete,
  getCurrentUser,
  canApprovePost,
  canApprovePurchaseRequest,
  canApproveIncentive,
  canAccessCampaign,
  canEditCampaign,
  shouldShowApprovalButtons
};