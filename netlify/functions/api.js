const handler = async (event, context) => {
  const { httpMethod, path, queryStringParameters, headers, body } = event;
  
  // Railway 백엔드 URL
  const backendUrl = 'https://brandflow-backend-production-99ae.up.railway.app';
  
  // API 경로 추출 (프록시할 경로)
  const apiPath = path.replace('/.netlify/functions/api', '');
  const targetUrl = `${backendUrl}${apiPath}`;
  
  // 쿼리 파라미터 추가
  const queryString = new URLSearchParams(queryStringParameters || {}).toString();
  const finalUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;
  
  console.log(`Proxying ${httpMethod} ${finalUrl}`);
  
  try {
    // 요청 옵션 설정
    const options = {
      method: httpMethod,
      headers: {
        ...headers,
        // Host 헤더 제거 (CORS 문제 방지)
        host: undefined,
        // Authorization 헤더 명시적으로 전달
        'Authorization': headers.authorization || headers.Authorization,
        'Content-Type': headers['content-type'] || headers['Content-Type'] || 'application/json'
      }
    };
    
    // body가 있는 경우 추가
    if (body) {
      options.body = body;
    }
    
    // 백엔드에 요청 전송
    const response = await fetch(finalUrl, options);
    const responseText = await response.text();
    
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
    console.error('Proxy error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Proxy error', 
        message: error.message 
      })
    };
  }
};

module.exports = { handler };