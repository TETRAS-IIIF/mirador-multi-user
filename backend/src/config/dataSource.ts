import { DataSource } from 'typeorm';
import { MARIA_DB_PORT } from '../utils/constants';

export default new DataSource({
  type: 'mariadb',
  host: process.env.DB_HOST,
  port: MARIA_DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  entities: ['src/**/*.entity.{ts,js}'],
  migrations: ['dist/migrations/*.{ts,js}'],
});
