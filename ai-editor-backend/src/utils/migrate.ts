import * as fs from 'fs';
import * as path from 'path';
import { pool } from '../config/database';

async function runMigrations() {
  try {
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log('🔄 Running migrations...');

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      console.log(`📄 Running migration: ${file}`);
      
      await pool.query(sql);
      
      console.log(`✅ Migration completed: ${file}`);
    }

    console.log('✨ All migrations completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
