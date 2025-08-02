import sequelize from '../config/db.js';
import User from './user.js';
import Campaign from './campaign.js';
import Post from './post.js';

const db = {};

db.sequelize = sequelize;
db.User = User;
db.Campaign = Campaign;
db.Post = Post;

// 📄 모델 관계 설정 (Associations)
// 이 부분이 가장 중요합니다.

// 1. User와 Campaign의 관계 설정
// Campaign은 두 개의 User를 가집니다: 담당자(Manager)와 클라이언트(Client)
Campaign.belongsTo(User, { foreignKey: 'managerId', as: 'Manager' });
Campaign.belongsTo(User, { foreignKey: 'userId', as: 'Client' });

// User는 여러 Campaign을 가질 수 있습니다.
User.hasMany(Campaign, { foreignKey: 'managerId', as: 'ManagedCampaigns' });
User.hasMany(Campaign, { foreignKey: 'userId', as: 'ClientCampaigns' });


// 2. Campaign과 Post의 관계 설정
Campaign.hasMany(Post, { foreignKey: 'campaignId' });
Post.belongsTo(Campaign, { foreignKey: 'campaignId' });


export { User, Campaign, Post };
export default db;
