import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import sequelize from './config/db.js';
import './models/index.js';
import 'dotenv/config'; // dotenv를 import 합니다.

// API 라우터 임포트
import authRoutes from './api/auth.js';
import userRoutes from './api/users.js';
import campaignRoutes from './api/campaigns.js';
import postRoutes from './api/posts.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ⭐️ [수정] CORS 옵션을 환경 변수에서 읽어오도록 변경
const corsOptions = {
  // FRONTEND_URL 환경 변수가 있으면 그 값을 사용하고, 없으면 로컬 주소를 기본값으로 사용
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// API 라우트 연결
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/posts', postRoutes);

app.get('/', (req, res) => {
  res.send('BrandFlow 백엔드 서버가 정상적으로 동작하고 있습니다.');
});

async function startServer() {
  try {
    // ⭐️ [수정] 배포 환경에서는 sync()만 호출하여 DB 구조를 변경하지 않습니다.
    await sequelize.sync(); 
    console.log('✅ 데이터베이스 연결 완료.');

    const { User } = sequelize.models;
    const userCount = await User.count();
    if (userCount === 0) {
        console.log('데이터베이스에 사용자가 없어 초기 슈퍼 어드민 계정을 생성합니다...');
        const hashedPassword = await bcrypt.hash('tjdgus66!', 10);
        await User.create({ 
            name: '슈퍼 어드민',
            email: 'sjim@sh-system.co.kr', 
            password: hashedPassword, 
            role: '슈퍼 어드민' 
        });
        console.log('✅ 초기 슈퍼 어드민 계정 생성 완료.');
    }

    app.listen(PORT, () => {
      console.log(`✅ 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error('❌ 데이터베이스 연결 또는 서버 시작 실패:', error);
  }
}

startServer();
