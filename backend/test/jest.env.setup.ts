import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
  path: path.resolve(process.cwd(), '.env.test'),
});

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
