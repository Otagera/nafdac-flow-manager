import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq } from 'drizzle-orm';
import { users, clients, applications } from './schema';

const sqlite = new Database('nafdac.db');
const db = drizzle(sqlite);

async function seed() {
  console.log('Seeding database...');
  
  try {
    // 1. Seed Admin User
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).get();
    
    if (!existingAdmin) {
        const password = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await Bun.password.hash(password);
        
        await db.insert(users).values([
            { username: 'admin', password_hash: hashedPassword, role: 'DIRECTOR' },
        ]);
        console.log('Admin user created.');
    } else {
        console.log('Admin user already exists. Skipping.');
    }

    // 2. Seed Clients (Idempotent check)
    const existingClient = await db.select().from(clients).where(eq(clients.company_name, 'PharmaCore Ltd')).get();
    let clientForApp = existingClient;

    if (!existingClient) {
        const insertedClients = await db.insert(clients).values([
            { company_name: 'PharmaCore Ltd', cac_number: 'RC123456' },
            { company_name: 'AgroAllied Inc', cac_number: 'RC654321' },
        ]).returning();
        clientForApp = insertedClients[0];
        console.log('Sample clients created.');
    } else {
        console.log('Sample clients already exist. Skipping.');
    }

    // 3. Seed Application (Idempotent check)
    if (clientForApp) {
        const existingApp = await db.select().from(applications).where(eq(applications.product_name, 'Panadol Extra')).get();
        if (!existingApp) {
             await db.insert(applications).values([
                { product_name: 'Panadol Extra', client_id: clientForApp.id, status: 'PENDING_DOCS' }
            ]);
            console.log('Sample application created.');
        }
    }

    console.log('Seeding complete.');
  } catch (e) {
    console.error('Error seeding:', e);
  }
}

seed();
