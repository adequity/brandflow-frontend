import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const router = express.Router();

// 로그인 API (POST /api/auth/login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. 이메일로 사용자 찾기
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: '존재하지 않는 사용자입니다.' });
    }

    // 2. 비밀번호 비교
    // 실제 앱에서는 회원가입 시 비밀번호를 암호화(bcrypt.hash)해서 저장하고,
    // 로그인 시에는 bcrypt.compare로 비교해야 합니다.
    // 지금은 프로토타이핑 단계이므로, 우선 텍스트 그대로 비교합니다.
    if (password !== user.password) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }
    
    // 3. 로그인 성공: JWT(JSON Web Token) 생성
    // JWT는 사용자를 식별하는 암호화된 토큰으로, 로그인 성공의 증표입니다.
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      'your_jwt_secret_key', // 실제 프로젝트에서는 .env 파일로 관리해야 하는 비밀 키입니다.
      { expiresIn: '1h' } // 토큰 유효기간 (1시간)
    );

    // 4. 토큰과 사용자 정보 응답
    res.status(200).json({
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;