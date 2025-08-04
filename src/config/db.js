import { Sequelize } from 'sequelize';
import 'dotenv/config';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, // ⭐️ 포트 번호 추가
    dialect: 'postgres',
    // ⭐️ 배포 환경(Render)에서만 SSL 옵션을 적용
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: false,
  }
);

export default sequelize;