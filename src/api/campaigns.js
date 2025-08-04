import express from 'express';
import { Campaign, User, Post } from '../models/index.js';

const router = express.Router();

// GET /api/campaigns - 역할에 따라 다른 캠페인 목록 조회
router.get('/', async (req, res) => {
    // ⭐️ [수정] 요청을 보낸 관리자의 ID와 역할을 쿼리 파라미터로 받습니다.
    const { adminId, adminRole } = req.query;

    try {
        let whereCondition = {};
        // 대행사 어드민일 경우, 자신이 담당자인(managerId) 캠페인만 조회하도록 필터링합니다.
        if (adminRole === '대행사 어드민') {
            whereCondition = { managerId: adminId };
        }
        // 슈퍼 어드민은 whereCondition이 비어있으므로 모든 캠페인을 조회합니다.

        const campaigns = await Campaign.findAll({
            where: whereCondition,
            include: [
                { model: User, as: 'Manager', attributes: ['name', 'email'] },
                { model: User, as: 'Client', attributes: ['name', 'email'] },
                { model: Post }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(campaigns);
    } catch (error) {
        console.error('캠페인 조회 실패:', error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// GET /api/campaigns/:id - 특정 캠페인 상세 조회
router.get('/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.id, {
            include: [
                { model: User, as: 'Manager', attributes: ['name', 'email'] },
                { model: User, as: 'Client', attributes: ['name', 'email'] },
                { model: Post, order: [['createdAt', 'DESC']] }
            ]
        });
        if (!campaign) {
            return res.status(404).json({ message: '캠페인을 찾을 수 없습니다.' });
        }
        res.json(campaign);
    } catch (error) {
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// POST /api/campaigns - 새 캠페인 생성
router.post('/', async (req, res) => {
    const { name, client, userId, managerId } = req.body;
    try {
        const newCampaign = await Campaign.create({ name, client, userId, managerId });
        res.status(201).json(newCampaign);
    } catch (error) {
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// POST /api/campaigns/:campaignId/posts - 특정 캠페인에 새 포스트(주제) 추가
router.post('/:campaignId/posts', async (req, res) => {
    const { campaignId } = req.params;
    const { title } = req.body;
    try {
        const newPost = await Post.create({ title, campaignId });
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

export default router;
