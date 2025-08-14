// netlify/functions/api.js
import serverless from 'serverless-http'
import express from 'express'
import cors from 'cors'

// Express 앱과 라우터들 import
import '../../../src/models/index.js' // 모델 초기화
import authRoutes from '../../../src/api/auth.js'
import userRoutes from '../../../src/api/users.js'
import campaignRoutes from '../../../src/api/campaigns.js'
import postRoutes from '../../../src/api/posts.js'

const app = express()

// CORS 설정
const corsOptions = {
  origin: true, // 모든 origin 허용 (프로덕션에서는 특정 도메인으로 제한)
  credentials: true,
}
app.use(cors(corsOptions))
app.use(express.json())

// API 라우트 연결
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/posts', postRoutes)

// 기본 라우트
app.get('/api', (req, res) => {
  res.json({ message: 'BrandFlow API on Netlify Functions' })
})

// Netlify Functions용 핸들러
export const handler = serverless(app)