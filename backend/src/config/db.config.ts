import { join } from 'path';
import { registerAs } from '@nestjs/config';
import { UserSubscriber } from '../utils/subscribers/user.subscriber';
import { MARIA_DB_PORT } from '../utils/constants';

export default registerAs('database', () => {
  const isTest = process.env.NODE_ENV === 'test';

  return {
    type: 'mariadb',
    host: process.env.DB_HOST,
    port: MARIA_DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    autoLoadEntities: true,
    cache: false,
    subscribers: [UserSubscriber],
    // Committed migrations (src/migrations), applied when the backend
    // starts. DB_MIGRATIONS_RUN=false turns that off.
    migrations: [join(__dirname, '..', 'migrations', '*.{js,ts}')],
    migrationsRun: isTest || process.env.DB_MIGRATIONS_RUN !== 'false',
    migrationsTransactionMode: 'each',
    synchronize: false,
  };
});
