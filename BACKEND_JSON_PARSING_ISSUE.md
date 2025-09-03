# 🚨 백엔드 JSON 파싱 이슈 및 해결방안

## 현재 상황

### 문제점
- **팀원 초대 기능 작동 불가**: POST `/api/users` 엔드포인트에서 "There was an error parsing the body" 오류 발생
- **JSON 파싱 실패**: 모든 페이로드 형식에 대해 동일한 오류 발생
- **한글 인코딩 이슈 의심**: 한글 role 값 처리 시 파싱 오류 가능성

### 테스트된 요청
```bash
# 실패하는 요청 예시
curl -X POST "https://brandflow-backend-production-99ae.up.railway.app/api/users" \
  -H "Content-Type: application/json" \
  -H "User-Agent: BrandFlow-Frontend/1.0" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "name": "테스트 사용자",
    "email": "test@example.com", 
    "role": "직원",
    "password": "password123"
  }'

# 응답: {"detail": "There was an error parsing the body"}
```

## 백엔드 요구사항 (확인됨)

### 필수 필드
- `name`: 사용자 이름 (문자열)
- `email`: 이메일 주소 (문자열, 유효한 이메일 형식)
- `role`: 역할 (한글, 정확한 값 필요)
- `password`: 비밀번호 (문자열)

### 유효한 Role 값
- `슈퍼 어드민`
- `대행사 어드민`
- `직원`
- `클라이언트`

### API 정보
- **엔드포인트**: POST `/api/users`
- **백엔드 버전**: BrandFlow API v2.2.2
- **URL**: https://brandflow-backend-production-99ae.up.railway.app

## 프론트엔드 개선사항

### 1. 에러 핸들링 강화
`UserManagement.jsx`에서 JSON 파싱 오류에 대한 명확한 안내 메시지 추가:

```javascript
if (err?.response?.data?.detail === "There was an error parsing the body") {
  showError(`⚠️ 백엔드 서버 JSON 파싱 오류
  
현재 백엔드에서 사용자 생성 API에 JSON 파싱 문제가 발생하고 있습니다.

🔧 임시 해결 방안:
1. 백엔드 개발팀에 JSON 파싱 이슈 수정 요청
2. 한글 인코딩 문제 해결 필요
3. 현재는 시스템 관리자만 사용자 관리 가능

💡 기술적 세부사항:
- 오류: "There was an error parsing the body"
- 엔드포인트: POST /api/users
- 테스트된 모든 페이로드 형식에서 동일한 오류 발생`);
}
```

### 2. 요청 로깅 추가
사용자 생성 요청의 상세 로그를 통해 디버깅 정보 제공

## 백엔드 수정 필요사항

### 1. JSON 파싱 로직 점검
- FastAPI의 Pydantic 모델 검증 로직 확인
- 한글 문자 인코딩 처리 개선
- 요청 바디 파싱 전 로그 추가

### 2. 에러 로깅 강화
```python
# 백엔드에서 추가 필요한 로깅 예시
import logging
logger = logging.getLogger(__name__)

@app.post("/api/users")
async def create_user(request: Request):
    try:
        body = await request.body()
        logger.info(f"Raw request body: {body}")
        # JSON 파싱 로직
    except Exception as e:
        logger.error(f"JSON parsing error: {e}")
        logger.error(f"Request headers: {request.headers}")
        raise HTTPException(status_code=400, detail=f"JSON parsing failed: {str(e)}")
```

### 3. 인코딩 확인
- UTF-8 인코딩 처리 확인
- 한글 role 값에 대한 유니코드 처리
- Content-Type 헤더 검증 로직

## 임시 해결방안

### 1. 수동 사용자 생성
현재 팀원 초대가 불가능하므로 데이터베이스에 직접 사용자 추가 필요

### 2. 백엔드 우회
- 다른 API 엔드포인트를 통한 사용자 생성 확인
- 관리자 패널을 통한 사용자 관리

### 3. 프론트엔드 폴백
- 사용자에게 명확한 오류 상황 안내
- 시스템 관리자에게 문의하도록 유도

## 다음 단계

1. **즉시**: 백엔드 개발팀에 JSON 파싱 이슈 보고
2. **단기**: 백엔드 로깅 강화 및 인코딩 문제 해결
3. **중기**: API 엔드포인트 안정화
4. **장기**: 전체적인 에러 핸들링 개선

## 연락처
- **프론트엔드 이슈**: 현재 세션에서 해결됨 (에러 메시지 개선)
- **백엔드 이슈**: 백엔드 개발팀 수정 필요
- **배포 상태**: 개선된 에러 핸들링이 프로덕션에 배포됨

---
*최종 업데이트: 2025-09-03*
*상태: 프론트엔드 에러 핸들링 완료, 백엔드 수정 대기중*