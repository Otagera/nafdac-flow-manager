import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { clients } from '../../db/schema';
import { auth } from '../middleware/auth';

export const clientsController = new Elysia({ prefix: '/clients' })
  .use(auth)
  .get(
    '/',
    async () => {
      return db.query.clients.findMany({
        with: {
          applications: true,
        },
      });
    },
    {
      ensureRole: ['DIRECTOR', 'DOCUMENTATION', 'FINANCE', 'VETTING'], // Everyone needs to see client names
    },
  )
  .post(
    '/',
    async ({ body }) => {
      const result = await db.insert(clients).values(body).returning();
      return result[0];
    },
    {
      ensureRole: ['DIRECTOR', 'DOCUMENTATION'],
      body: t.Object({
        company_name: t.String(),
        cac_number: t.String(),
      }),
    },
  )
  .delete(
    '/:id',
    async ({ params: { id } }) => {
      await db.delete(clients).where(eq(clients.id, parseInt(id, 10)));
      return { success: true };
    },
    {
      ensureRole: ['DIRECTOR'],
    },
  );
