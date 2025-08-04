import { Sequelize } from 'sequelize';
import 'dotenv/config'; // dotenv/config를 import 합니다.

// ⭐️ [수정] process.env.DATABASE_URL을 사용합니다.
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

export default sequelize;