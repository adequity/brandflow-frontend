// 📄 /backend/src/models/campaign.js
// 이 파일은 /backend/src/models/ 폴더 안에 생성합니다.
// Campaign 테이블의 구조를 정의합니다.

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Campaign = sequelize.define('Campaign', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  client: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default Campaign;
