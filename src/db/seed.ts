import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { users, clients } from './schema';

const sqlite = new Database('nafdac.db');
const db = drizzle(sqlite);

async function seed() {
  console.log('Seeding database...');
  
  try {
    await db.insert(users).values([
      { username: 'director', password_hash: 'hashed_secret', role: 'DIRECTOR' },
      { username: 'finance', password_hash: 'hashed_secret', role: 'FINANCE' },
      { username: 'vetting', password_hash: 'hashed_secret', role: 'VETTING' },
      { username: 'docs', password_hash: 'hashed_secret', role: 'DOCUMENTATION' },
    ]);

    await db.insert(clients).values([
      { company_name: 'PharmaCore Ltd', cac_number: 'RC123456' },
      { company_name: 'AgroAllied Inc', cac_number: 'RC654321' },
    ]);

    console.log('Seeding complete.');
  } catch (e) {
    console.error('Error seeding (maybe already seeded):', e);
  }
}

seed();
