import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

config({
  path: '.env.local',
});

const clearDatabase = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log('⏳ Clearing database...');

  const start = Date.now();
  
  try {
    // Clear tables in order due to foreign key constraints
    await db.execute(sql`DELETE FROM "Vote"`);
    await db.execute(sql`DELETE FROM "Message"`);
    await db.execute(sql`DELETE FROM "Suggestion"`);
    await db.execute(sql`DELETE FROM "Document"`);
    await db.execute(sql`DELETE FROM "Chat"`);
    
    const end = Date.now();
    console.log('✅ Database cleared in', end - start, 'ms');
  } catch (error) {
    console.error('❌ Failed to clear database:', error);
  } finally {
    await connection.end();
  }
  
  process.exit(0);
};

clearDatabase().catch((err) => {
  console.error('❌ Failed to clear database');
  console.error(err);
  process.exit(1);
}); 