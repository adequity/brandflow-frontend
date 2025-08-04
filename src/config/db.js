import { Sequelize } from 'sequelize';
import 'dotenv/config';

let sequelize;

// Render와 같은 배포 환경에서는 DATABASE_URL 환경 변수를 사용합니다.
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Render의 SSL 연결에 필요
      }
    },
    logging: false,
  });
} else {
  // 로컬 개발 환경에서는 기존의 .env 파일 설정을 사용합니다.
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: false,
    }
  );
}

export default sequelize;