// routes/campaigns.js
import express from 'express';
import { Campaign, User, Post } from '../models/index.js';
import { Op, col, where } from 'sequelize';
import { Op } from 'sequelize';

const router = express.Router();

// (임시) 호출자 정보: viewerId/viewerRole은 쿼리로 받고 company는 DB로 확정
async function getViewer(req) {
  const viewerId = Number(req.query.viewerId || req.query.adminId);
  const viewerRole = req.query.viewerRole || req.query.adminRole; // 백워드 호환
  let viewerCompany = null;

  if (viewerId) {
    const v = await User.findByPk(viewerId, { attributes: ['id', 'company', 'role'] });
    viewerCompany = v?.company || null;
  }
  return { viewerId, viewerRole, viewerCompany };
}

const postsInclude = {
  model: Post,
  as: 'posts',
  attributes: ['id', 'title', 'outline', 'topicStatus', 'outlineStatus', 'publishedUrl', 'createdAt', 'updatedAt'],
  separate: true,
  order: [['createdAt', 'DESC']],
};

const commonInclude = [
  { model: User, as: 'User',   attributes: ['id','name','email','company'], required: false },
  { model: User, as: 'Client', attributes: ['id','name','email','company'], required: false },
  postsInclude,
];

// GET /api/campaigns — 역할/테넌트별 목록
router.get('/', async (req, res) => {
  try {
    const { viewerId, viewerRole, viewerCompany } = await getViewer(req);

    let whereClause = undefined;
    if (viewerRole === '대행사 어드민') {
      if (!viewerCompany) {
        return res.status(400).json({ message: '대행사 정보가 없습니다.' });
      }
      whereClause = {
        [Op.or]: [
          { '$User.company$':   { [Op.eq]: viewerCompany } },
          { '$Client.company$': { [Op.eq]: viewerCompany } },
        ],
      };
    } else if (viewerRole === '클라이언트') {
      whereClause = { userId: viewerId };
    }
    // 슈퍼 어드민은 필터 없음

    const campaigns = await Campaign.findAll({
      where: whereClause,
      include: commonInclude,
      order: [['updatedAt', 'DESC']],
    });

    res.json(campaigns);
  } catch (error) {
    console.error('캠페인 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// POST /api/campaigns — 생성 후 include 붙여 반환
router.post('/', async (req, res) => {
  const { name, client, userId, managerId } = req.body;
  try {
   // 요청자/테넌트 검증(대행사 어드민이면 같은 회사 소속 캠페인만 생성)
   const { viewerRole, viewerCompany } = await getViewer(req);
   if (viewerRole === '대행사 어드민') {
     const manager = await User.findByPk(managerId, { attributes: ['company'] });
     const clientUser = await User.findByPk(userId, { attributes: ['company'] });
     if (!manager || !clientUser || manager.company !== viewerCompany || clientUser.company !== viewerCompany) {
       return res.status(403).json({ message: '권한이 없습니다.' });
     }
   }
    const created = await Campaign.create({ name, client, userId, managerId });
    const full = await Campaign.findByPk(created.id, { include: commonInclude });
    res.status(201).json(full);
  } catch (error) {
    console.error('캠페인 생성 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// POST /api/campaigns/:campaignId/posts — 주제 등록(권한/테넌트 체크)
router.post('/:campaignId/posts', async (req, res) => {
  const { title } = req.body;
  const { campaignId } = req.params;

  try {
    const { viewerId, viewerRole, viewerCompany } = await getViewer(req);

    const campaign = await Campaign.findByPk(campaignId, {
      include: [
        { model: User, as: 'User',    attributes: ['id','name','email','company'] },   // 담당자
        { model: User, as: 'Client', attributes: ['id', 'company'] }, // 클라이언트
      ],
    });
    if (!campaign) return res.status(404).json({ message: '캠페인을 찾을 수 없습니다.' });

    // 권한/테넌트 검증
    if (viewerRole === '대행사 어드민' && campaign.User?.company !== viewerCompany) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }
    if (viewerRole === '클라이언트' && campaign.userId !== viewerId) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    const newPost = await Post.create({
      title,
      campaignId,
      topicStatus: '주제 승인 대기', // 기본 상태 설정(선택)
    });
    res.status(201).json(newPost);
  } catch (error) {
    console.error('주제 등록 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

export default router;
