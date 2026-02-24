import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// .env.localの DATABASE_URL を読み込んでNeonに接続
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });