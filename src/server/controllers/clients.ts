import { Elysia } from 'elysia';
import { auth } from '../middleware/auth';
import { db } from '../../db';

export const clientsController = new Elysia({ prefix: '/clients' })
  .use(auth)
  .get('/', async () => {
    return db.query.clients.findMany();
  }, {
    ensureRole: ['DIRECTOR', 'DOCUMENTATION'] // Only these roles likely need to select clients for new apps
  });
