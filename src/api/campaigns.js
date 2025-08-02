import express from 'express';
import { Campaign, User, Post } from '../models/index.js';

const router = express.Router();

// GET /api/campaigns - 모든 캠페인 조회
router.get('/', async (req, res) => {
    try {
        const campaigns = await Campaign.findAll({
            include: [
                { model: User, as: 'Manager', attributes: ['name', 'email'] },
                { model: User, as: 'Client', attributes: ['name', 'email'] },
                { model: Post, attributes: ['id', 'title', 'topicStatus', 'outlineStatus', 'publishedUrl'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(campaigns);
    } catch (error) {
        console.error('캠페인 조회 실패:', error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// POST /api/campaigns - 새 캠페인 생성
router.post('/', async (req, res) => {
    const { name, client, userId, managerId } = req.body;
    if (!name || !client || !userId || !managerId) {
        return res.status(400).json({ message: '필수 정보가 누락되었습니다.' });
    }
    try {
        const newCampaign = await Campaign.create({ name, client, userId, managerId });
        res.status(201).json(newCampaign);
    } catch (error) {
        console.error('캠페인 생성 실패:', error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// ⭐️ [새로 추가된 API] ⭐️
// POST /api/campaigns/:campaignId/posts - 특정 캠페인에 새 포스트(주제) 추가
router.post('/:campaignId/posts', async (req, res) => {
    const { campaignId } = req.params;
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ message: '주제(title)는 필수입니다.' });
    }

    try {
        const campaign = await Campaign.findByPk(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: '캠페인을 찾을 수 없습니다.' });
        }

        const newPost = await Post.create({
            title,
            campaignId: campaign.id,
        });

        res.status(201).json(newPost);
    } catch (error) {
        console.error('포스트 생성 실패:', error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

export default router;
