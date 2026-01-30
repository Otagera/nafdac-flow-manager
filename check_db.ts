import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { clients } from './src/db/schema';

const sqlite = new Database('nafdac.db');
const db = drizzle(sqlite);

async function check() {
    const allClients = await db.select().from(clients);
    console.log(allClients);
}

check();
