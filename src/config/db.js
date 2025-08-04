import { Sequelize } from 'sequelize';
import 'dotenv/config';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: false,
  }
);

// ⭐️ [추가] DB 연결을 재시도하는 함수
export const testDbConnection = async () => {
  let retries = 5;
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log('✅ 데이터베이스 연결에 성공했습니다.');
      break;
    } catch (error) {
      console.error('❌ 데이터베이스에 연결할 수 없습니다:', error.name);
      retries -= 1;
      console.log(`${retries}번의 재시도 기회가 남았습니다. 5초 후에 다시 시도합니다...`);
      if (retries === 0) {
        throw new Error('여러 번의 시도 후에도 데이터베이스 연결에 실패했습니다.');
      }
      await new Promise(res => setTimeout(res, 5000)); // 5초 대기
    }
  }
};

export default sequelize;