// Token utility functions for debugging JWT issues
import api from '../api/client.js';

export const checkAuthToken = () => {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  
  console.log('Auth Token Status:');
  console.log('- Token exists:', !!token);
  console.log('- Token length:', token ? token.length : 'N/A');
  console.log('- User data exists:', !!user);
  
  if (token) {
    try {
      // JWT는 base64로 인코딩된 3개 부분으로 구성됨 (header.payload.signature)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        const exp = payload.exp;
        
        console.log('- Token expiry:', new Date(exp * 1000).toLocaleString());
        console.log('- Current time:', new Date().toLocaleString());
        console.log('- Token expired:', now > exp);
        console.log('- Time until expiry:', exp - now, 'seconds');
        
        return {
          valid: now < exp,
          expired: now > exp,
          expiresAt: new Date(exp * 1000),
          payload
        };
      } else {
        console.log('- Invalid token format');
        return { valid: false, expired: true };
      }
    } catch (error) {
      console.log('- Token parsing error:', error.message);
      return { valid: false, expired: true };
    }
  }
  
  return { valid: false, expired: true };
};

export const testAuthenticatedRequest = async () => {
  try {
    console.log('Testing authenticated request to /api/users/me/...');
    const response = await api.get('/api/users/me/');
    console.log('✅ Authentication successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.status, error.response?.data);
    return { success: false, error: error.response?.data || error.message };
  }
};

export const clearAuthAndReload = () => {
  console.log('Clearing authentication data and reloading...');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Debug function to check localStorage and make test request
export const debugAuth = async () => {
  console.log('=== Authentication Debug ===');
  
  // Check token
  const tokenStatus = checkAuthToken();
  
  if (!tokenStatus.valid) {
    console.log('❌ Token is invalid or expired. Need to re-login.');
    return { needsLogin: true };
  }
  
  // Test authenticated request
  const testResult = await testAuthenticatedRequest();
  
  if (!testResult.success) {
    console.log('❌ Token exists but authentication failed. Clearing data...');
    clearAuthAndReload();
    return { needsLogin: true };
  }
  
  console.log('✅ Authentication is working properly');
  return { needsLogin: false, user: testResult.data };
};

// Helper to add to window for easy console access
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuth;
  window.checkAuthToken = checkAuthToken;
  window.testAuthenticatedRequest = testAuthenticatedRequest;
  window.clearAuthAndReload = clearAuthAndReload;
}