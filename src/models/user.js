// 📄 /backend/src/models/user.js
// 이 파일은 /backend/src/models/ 폴더 안에 생성합니다.
// User 테이블의 구조를 정의합니다.

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contact: {
    type: DataTypes.STRING,
  },
  company: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.ENUM('슈퍼 어드민', '대행사 어드민', '클라이언트'),
    allowNull: false,
  },
});

export default User;
