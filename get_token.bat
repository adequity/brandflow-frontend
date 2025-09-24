@echo off
echo BrandFlow 토큰 생성기
echo ========================
set /p email="이메일을 입력하세요: "
set /p password="비밀번호를 입력하세요: "

echo.
echo 로그인 중...
curl -X POST "http://localhost:8081/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%email%\",\"password\":\"%password%\"}" ^
  --silent --show-error

echo.
echo.
echo 위의 결과에서 "access_token" 값을 복사해서 사용하세요.
pause