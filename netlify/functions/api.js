const handler = async (event, context) => {
  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      },
      body: ''
    };
  }
  
  const { httpMethod, path, queryStringParameters, headers, body } = event;
  
  try {
    // Railway 백엔드 URL
    const backendUrl = 'https://brandflow-backend-production-99ae.up.railway.app';
    
    // API 경로 추출 및 정리
    let apiPath = path.replace('/.netlify/functions/api', '');
    
    // 빈 경로나 단순 '/' 경로인 경우 처리
    if (!apiPath || apiPath === '/') {
      apiPath = '/api';
    } else {
      // '/api'로 시작하지 않는 경우 추가
      if (!apiPath.startsWith('/api')) {
        apiPath = '/api' + apiPath;
      }
    }
    
    // trailing slash 정리 (쿼리 파라미터가 있는 경우 제외)
    if (apiPath.endsWith('/') && apiPath !== '/api') {
      apiPath = apiPath.slice(0, -1);
    }
    
    const targetUrl = `${backendUrl}${apiPath}`;
    
    console.log(`[Netlify Function] Path processing: original="${path}" -> extracted="${apiPath}" -> target="${targetUrl}"`);
    
    // 쿼리 파라미터 추가
    const queryString = new URLSearchParams(queryStringParameters || {}).toString();
    const finalUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;
    
    console.log(`[Netlify Function] Proxying ${httpMethod} ${finalUrl}`);
    console.log(`[Netlify Function] Headers:`, JSON.stringify(headers, null, 2));
    
    // 헤더 정리 - Netlify 특정 헤더 제거
    const cleanHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      
      // 제외할 헤더들
      if (!lowerKey.startsWith('x-') && 
          !lowerKey.includes('netlify') && 
          lowerKey !== 'host' &&
          lowerKey !== 'connection' &&
          lowerKey !== 'upgrade-insecure-requests') {
        cleanHeaders[key] = value;
      }
    }
    
    // Authorization 헤더 확실히 포함
    if (headers.authorization || headers.Authorization) {
      cleanHeaders.Authorization = headers.authorization || headers.Authorization;
    }
    
    // Content-Type 설정
    if (!cleanHeaders['Content-Type'] && !cleanHeaders['content-type']) {
      cleanHeaders['Content-Type'] = 'application/json';
    }
    
    // 요청 옵션 설정
    const options = {
      method: httpMethod,
      headers: cleanHeaders
    };
    
    // body가 있는 경우 추가
    if (body && body.length > 0) {
      options.body = body;
    }
    
    console.log(`[Netlify Function] Request options:`, JSON.stringify(options, null, 2));
    
    // 백엔드에 요청 전송
    const response = await fetch(finalUrl, options);
    const responseText = await response.text();
    
    console.log(`[Netlify Function] Response status: ${response.status}`);
    console.log(`[Netlify Function] Response body:`, responseText);
    
    // 응답 반환
    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Content-Type': response.headers.get('content-type') || 'application/json'
      },
      body: responseText
    };
    
  } catch (error) {
    console.error('[Netlify Function] Proxy error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Netlify Function proxy error', 
        message: error.message,
        stack: error.stack
      })
    };
  }
};

module.exports = { handler };