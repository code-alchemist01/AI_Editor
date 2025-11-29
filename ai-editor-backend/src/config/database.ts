import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection string'i parse et
const parseConnectionString = (connectionString: string) => {
  const parts = connectionString.split(';').reduce((acc, part) => {
    const [key, value] = part.split('=').map(s => s.trim());
    if (key && value) {
      acc[key.toLowerCase()] = value;
    }
    return acc;
  }, {} as Record<string, string>);

  return {
    host: parts.host || 'localhost',
    port: parseInt(parts.port || '5432', 10),
    database: parts.database || 'ai_editor_new',
    user: parts.username || 'postgres',
    password: parts.password || '',
  };
};

const connectionString = process.env.DATABASE_URL || 
  'Host=localhost;Port=5432;Database=ai_editor_new;Username=postgres;Password=123456;';

const config = parseConnectionString(connectionString);

export const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
