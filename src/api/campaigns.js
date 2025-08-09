// routes/campaigns.js
import express from 'express';
import { Campaign, User, Post } from '../models/index.js';

const router = express.Router();

// 공통 include: 프론트가 쓰는 alias와 필드에 맞춤
const postsInclude = {
  model: Post,
  as: 'posts',
  attributes: [
    'id',
    'title',
    'outline',
    'topicStatus',
    'outlineStatus',
    'publishedUrl',
    'createdAt',
    'updatedAt',
  ],
  // hasMany 정렬은 separate 써야 안전하게 정렬됨
  separate: true,
  order: [['createdAt', 'DESC']],
};

const commonInclude = [
  { model: User, as: 'User',   attributes: ['id', 'name', 'email'] }, // 담당자
  { model: User, as: 'Client', attributes: ['id', 'name', 'email'] }, // (옵션) 클라이언트
  postsInclude,
];

// GET /api/campaigns  - 역할/담당자에 따라 필터
router.get('/', async (req, res) => {
  const adminId  = Number.parseInt(req.query.adminId, 10);
  const adminRole = req.query.adminRole;

  try {
    const where =
      adminRole === '대행사 어드민' && Number.isFinite(adminId)
        ? { managerId: adminId }
        : {};

    const campaigns = await Campaign.findAll({
      where,
      include: commonInclude,
      order: [['updatedAt', 'DESC']], // 상단 레벨 정렬
    });

    res.json(campaigns);
  } catch (error) {
    console.error('캠페인 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// GET /api/campaigns/:id  - 상세
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id, {
      include: commonInclude,
    });

    if (!campaign) {
      return res.status(404).json({ message: '캠페인을 찾을 수 없습니다.' });
    }
    res.json(campaign);
  } catch (error) {
    console.error('캠페인 상세 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// POST /api/campaigns  - 새 캠페인 생성(담당자/빈 posts까지 포함해 반환)
router.post('/', async (req, res) => {
  const { name, client, userId, managerId } = req.body;

  try {
    const created = await Campaign.create({ name, client, userId, managerId });

    // 프론트가 바로 쓸 수 있도록 include해서 다시 조회
    const full = await Campaign.findByPk(created.id, { include: commonInclude });

    res.status(201).json(full);
  } catch (error) {
    console.error('캠페인 생성 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// POST /api/campaigns/:campaignId/posts  - 주제 등록
router.post('/:campaignId/posts', async (req, res) => {
  const { campaignId } = req.params;
  const { title } = req.body;

  try {
    const newPost = await Post.create({ title, campaignId });
    res.status(201).json(newPost);
  } catch (error) {
    console.error('포스트 생성 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

export default router;
