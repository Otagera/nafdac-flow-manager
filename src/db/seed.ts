import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { users, clients, applications } from './schema';

const sqlite = new Database('nafdac.db');
const db = drizzle(sqlite);

async function seed() {
  console.log('Seeding database...');
  
  try {
    const hashedPassword = await Bun.password.hash('admin123');

    // Users
    await db.insert(users).values([
      { username: 'admin', password_hash: hashedPassword, role: 'DIRECTOR' },
    ]);

    // Clients
    const insertedClients = await db.insert(clients).values([
      { company_name: 'PharmaCore Ltd', cac_number: 'RC123456' },
      { company_name: 'AgroAllied Inc', cac_number: 'RC654321' },
    ]).returning();

    // Applications
    if (insertedClients.length > 0) {
        await db.insert(applications).values([
            { product_name: 'Panadol Extra', client_id: insertedClients[0].id, status: 'PENDING_DOCS' }
        ]);
    }

    console.log('Seeding complete.');
  } catch (e) {
    console.error('Error seeding (maybe already seeded):', e);
  }
}

seed();
