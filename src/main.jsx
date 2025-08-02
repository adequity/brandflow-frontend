// 📄 /frontend/src/main.jsx
// 이 파일은 /frontend/src/ 폴더 안에 위치합니다.
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // 아래에 만들 index.css 파일을 임포트합니다.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)