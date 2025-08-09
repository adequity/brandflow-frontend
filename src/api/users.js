import express from 'express';
import { User, Campaign, Post } from '../models/index.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

const router = express.Router();

// GET /api/users - 역할에 따라 다른 사용자 목록 조회
router.get('/', async (req, res) => {
    const { adminId, adminRole } = req.query;

    try {
        let whereCondition = {};
        if (adminRole === '대행사 어드민') {
            whereCondition = {
                [Op.or]: [
                    { creatorId: adminId },
                    { id: adminId }
                ]
            };
        }
        
        const users = await User.findAll({ 
            where: whereCondition,
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// POST /api/users - 새 사용자 생성
router.post('/', async (req, res) => {
    const { name, email, password, role, company, contact, creatorId } = req.body;
    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ name, email, password: hashedPassword, role, company, contact, creatorId });
        
        const userResponse = { ...newUser.toJSON() };
        delete userResponse.password;

        res.status(201).json(userResponse);
    } catch (error) {
        res.status(500).json({ message: '사용자 생성에 실패했습니다.' });
    }
});

// PUT /api/users/:id - 특정 사용자 정보 수정 (권한 검사 수정)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, role, company, contact, adminId, adminRole } = req.body;
    try {
        const userToEdit = await User.findByPk(id);
        if (!userToEdit) {
            return res.status(404).json({ message: '수정할 사용자를 찾을 수 없습니다.' });
        }

        // ⭐️ [권한 검사 수정]
        if (adminRole === '대행사 어드민') {
            // 1. 슈퍼 어드민은 수정 불가
            if (userToEdit.role === '슈퍼 어드민') {
                return res.status(403).json({ message: '권한이 없습니다.' });
            }
            // 2. 자기 자신이 아니고, 자기가 생성한 사용자도 아니면 수정 불가
            if (userToEdit.id !== parseInt(adminId) && userToEdit.creatorId !== parseInt(adminId)) {
                 return res.status(403).json({ message: '권한이 없습니다.' });
            }
        }

        await userToEdit.update({ name, email, role, company, contact });
        const userResponse = { ...userToEdit.toJSON() };
        delete userResponse.password;
        res.status(200).json(userResponse);
    } catch (error) {
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// DELETE /api/users/:id - 특정 사용자 삭제 (권한 검사 수정)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { adminId, adminRole } = req.body;
    try {
        const userToDelete = await User.findByPk(id);
        if (!userToDelete) {
            return res.status(404).json({ message: '삭제할 사용자를 찾을 수 없습니다.' });
        }

        // ⭐️ [권한 검사 수정]
        if (adminRole === '대행사 어드민') {
            // 1. 슈퍼 어드민은 삭제 불가
            if (userToDelete.role === '슈퍼 어드민') {
                return res.status(403).json({ message: '권한이 없습니다.' });
            }
            // 2. 자기 자신이 아니고, 자기가 생성한 사용자도 아니면 삭제 불가
            if (userToDelete.id !== parseInt(adminId) && userToDelete.creatorId !== parseInt(adminId)) {
                return res.status(403).json({ message: '권한이 없습니다.' });
            }
        }

        await userToDelete.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// GET /api/users/:id/campaigns - 특정 클라이언트의 캠페인 목록 조회
router.get('/:id/campaigns', async (req, res) => {
  const userId = Number(req.params.id);
  try {
    const campaigns = await Campaign.findAll({
      where: { userId },
      include: [
        { model: Post, separate: true, order: [['createdAt', 'DESC']] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(campaigns);
  } catch (e) {
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

export default router;
