import express from 'express';
import { User, Campaign, Post } from '../models/index.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// GET /api/users - 모든 사용자 조회 (관리자용)
router.get('/', async (req, res) => {
    try {
        const users = await User.findAll({ 
            attributes: { exclude: ['password'] } // 비밀번호 제외
        });
        res.json(users);
    } catch (error) {
        console.error('사용자 전체 조회 실패:', error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// POST /api/users - 새 사용자 생성 (관리자용)
router.post('/', async (req, res) => {
    const { name, email, password, role, company, contact } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ name, email, password: hashedPassword, role, company, contact });
        
        // 응답에서 비밀번호 필드 제거
        const userResponse = { ...newUser.toJSON() };
        delete userResponse.password;

        res.status(201).json(userResponse);
    } catch (error) {
        console.error('사용자 생성 실패:', error);
        res.status(500).json({ message: '사용자 생성에 실패했습니다.' });
    }
});

// PUT /api/users/:id - 특정 사용자 정보 수정 (관리자용)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, role, company, contact } = req.body;
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 전달받은 정보로 사용자 정보를 업데이트합니다.
        await user.update({ name, email, role, company, contact });

        // 응답에서 비밀번호 필드 제거
        const userResponse = { ...user.toJSON() };
        delete userResponse.password;

        res.status(200).json(userResponse);
    } catch (error) {
        console.error('사용자 정보 수정 실패:', error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// DELETE /api/users/:id - 특정 사용자 삭제 (관리자용)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        await user.destroy();
        res.status(204).send(); // 성공적으로 삭제되었음을 알림 (내용 없음)
    } catch (error) {
        console.error('사용자 삭제 실패:', error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});


// GET /api/users/:id/campaigns - 특정 클라이언트의 캠페인 목록과 상세 내용 조회
router.get('/:id/campaigns', async (req, res) => {
    const { id } = req.params;
    try {
        const campaigns = await Campaign.findAll({
            where: { userId: id }, // 이 사용자 ID(클라이언트)와 연결된 캠페인만 찾습니다.
            include: [
                {
                    model: User,
                    as: 'Manager', // 담당자(어드민) 정보
                    attributes: ['name']
                },
                {
                    model: Post, // 캠페인에 속한 모든 게시글(Post) 정보
                    attributes: ['id', 'title', 'topicStatus', 'outlineStatus', 'publishedUrl', 'outline', 'rejectReason']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(campaigns);
    } catch (error) {
        console.error(`ID ${id} 사용자의 캠페인 조회 실패:`, error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

export default router;
