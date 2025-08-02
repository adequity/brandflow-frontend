import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Post = sequelize.define('Post', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  topicStatus: {
    type: DataTypes.STRING,
    defaultValue: '주제 승인 대기',
  },
  outline: {
    type: DataTypes.TEXT,
  },
  outlineStatus: {
    type: DataTypes.STRING,
  },
  publishedUrl: {
    type: DataTypes.STRING,
  },
  // ⭐️ [새로 추가된 필드] ⭐️
  // 클라이언트가 콘텐츠를 반려할 때 사유를 저장하기 위한 필드입니다.
  rejectReason: {
    type: DataTypes.TEXT, // 반려 사유는 길 수 있으므로 TEXT 타입으로 설정
    allowNull: true,      // 반려되지 않은 경우 값은 비어있을 수 있음 (NULL)
  },
  creationTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
});

export default Post;
