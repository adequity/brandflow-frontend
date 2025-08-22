// src/utils/permissions.js
export const ROLES = {
  SUPER_ADMIN: '슈퍼 어드민',
  AGENCY_ADMIN: '대행사 어드민', 
  EMPLOYEE: '직원',
  CLIENT: '클라이언트'
};

// Django에서 오는 영문 role을 한글로 매핑
export const ROLE_MAPPING = {
  'super_admin': ROLES.SUPER_ADMIN,
  'agency_admin': ROLES.AGENCY_ADMIN,
  'staff': ROLES.EMPLOYEE,
  'client': ROLES.CLIENT
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
  
  // 구매요청 관리
  CREATE_PURCHASE_REQUEST: 'create_purchase_request',
  EDIT_PURCHASE_REQUEST: 'edit_purchase_request',
  DELETE_PURCHASE_REQUEST: 'delete_purchase_request',
  APPROVE_PURCHASE_REQUEST: 'approve_purchase_request',
  VIEW_ALL_PURCHASE_REQUESTS: 'view_all_purchase_requests',
  
  // 인센티브 관리
  CALCULATE_INCENTIVES: 'calculate_incentives',
  APPROVE_INCENTIVES: 'approve_incentives',
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
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.VIEW_COMPANY_USERS,
    
    PERMISSIONS.CREATE_CAMPAIGN,
    PERMISSIONS.EDIT_CAMPAIGN,
    PERMISSIONS.DELETE_CAMPAIGN,
    PERMISSIONS.VIEW_COMPANY_CAMPAIGNS,
    
    PERMISSIONS.CREATE_PURCHASE_REQUEST,
    PERMISSIONS.EDIT_PURCHASE_REQUEST,
    PERMISSIONS.DELETE_PURCHASE_REQUEST,
    PERMISSIONS.APPROVE_PURCHASE_REQUEST,
    PERMISSIONS.VIEW_ALL_PURCHASE_REQUESTS,
    
    PERMISSIONS.CALCULATE_INCENTIVES,
    PERMISSIONS.APPROVE_INCENTIVES,
    PERMISSIONS.VIEW_ALL_INCENTIVES,
    
    PERMISSIONS.VIEW_FINANCIAL_OVERVIEW,
    PERMISSIONS.VIEW_COMPANY_FINANCIAL
  ],
  
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.CREATE_CLIENT,
    PERMISSIONS.VIEW_COMPANY_USERS,
    
    PERMISSIONS.CREATE_CAMPAIGN,
    PERMISSIONS.EDIT_CAMPAIGN,
    PERMISSIONS.VIEW_COMPANY_CAMPAIGNS,
    
    PERMISSIONS.CREATE_PURCHASE_REQUEST,
    PERMISSIONS.EDIT_PURCHASE_REQUEST,
    
    PERMISSIONS.VIEW_OWN_INCENTIVES,
    PERMISSIONS.VIEW_OWN_FINANCIAL
  ],
  
  [ROLES.CLIENT]: [
    PERMISSIONS.VIEW_OWN_CAMPAIGNS,
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
 * 같은 회사인지 확인
 */
export const isSameCompany = (user1, user2) => {
  return user1?.company && user2?.company && user1.company === user2.company;
};

/**
 * 사용자가 다른 사용자를 관리할 수 있는지 확인
 */
export const canManageUser = (manager, targetUser) => {
  if (!manager || !targetUser) return false;
  
  // 슈퍼 어드민은 모든 사용자 관리 가능
  if (manager.role === ROLES.SUPER_ADMIN) return true;
  
  // 본인은 언제나 수정 가능
  if (manager.id === targetUser.id) return true;
  
  // 대행사 어드민은 같은 회사의 직원/클라이언트만 관리 가능 (슈퍼 어드민 제외)
  if (manager.role === ROLES.AGENCY_ADMIN) {
    return isSameCompany(manager, targetUser) && 
           targetUser.role !== ROLES.SUPER_ADMIN;
  }
  
  // 직원은 다른 사용자 관리 불가
  return false;
};

/**
 * 사용자가 클라이언트를 선택할 수 있는지 확인 (캠페인 생성 시)
 */
export const canSelectClient = (user, client) => {
  if (!user || !client) return false;
  
  // 슈퍼 어드민은 모든 클라이언트 선택 가능
  if (user.role === ROLES.SUPER_ADMIN) return true;
  
  // 대행사 어드민과 직원은 같은 회사 클라이언트만 선택 가능
  if (user.role === ROLES.AGENCY_ADMIN || user.role === ROLES.EMPLOYEE) {
    return isSameCompany(user, client) && client.role === ROLES.CLIENT;
  }
  
  return false;
};

/**
 * 사용자가 직원을 선택할 수 있는지 확인 (캠페인 담당자 지정 시)
 */
export const canSelectEmployee = (user, employee) => {
  if (!user || !employee) return false;
  
  // 슈퍼 어드민은 모든 직원 선택 가능
  if (user.role === ROLES.SUPER_ADMIN) return true;
  
  // 대행사 어드민은 같은 회사 직원만 선택 가능
  if (user.role === ROLES.AGENCY_ADMIN) {
    return isSameCompany(user, employee) && 
           (employee.role === ROLES.EMPLOYEE || employee.role === ROLES.AGENCY_ADMIN);
  }
  
  // 직원은 본인만 선택 가능
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
  
  // 슈퍼 어드민은 모든 역할 생성 가능
  if (creator.role === ROLES.SUPER_ADMIN) return true;
  
  // 대행사 어드민은 직원, 클라이언트만 생성 가능
  if (creator.role === ROLES.AGENCY_ADMIN) {
    return [ROLES.EMPLOYEE, ROLES.CLIENT].includes(targetRole);
  }
  
  // 직원은 클라이언트만 생성 가능
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
      // 직원은 구매요청 삭제 불가
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
  canDelete
};