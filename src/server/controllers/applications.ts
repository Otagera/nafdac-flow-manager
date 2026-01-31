import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { applications } from '../../db/schema';
import { auth } from '../middleware/auth';

export const applicationsController = new Elysia({ prefix: '/applications' })
  .use(auth)
  .get(
    '/',
    async ({ role }) => {
      if (role === 'FINANCE') {
        return db.query.applications.findMany({
          where: eq(applications.status, 'FINANCE_PENDING'),
          with: { client: true },
        });
      }

      if (role === 'VETTING') {
        return db.query.applications.findMany({
          where: eq(applications.status, 'VETTING_PROGRESS'),
          with: { client: true, documents: true },
        });
      }

      return db.query.applications.findMany({
        with: { client: true },
      });
    },
    {
      ensureRole: ['DIRECTOR', 'FINANCE', 'VETTING', 'DOCUMENTATION'],
    },
  )
  .patch(
    '/:id/status',
    async ({ params: { id }, body, role, error }) => {
      const { status } = body;
      const appId = parseInt(id, 10);

      const app = await db.query.applications.findFirst({
        where: eq(applications.id, appId),
      });

      if (!app) return error(404, 'Application not found');

      if (role === 'FINANCE') {
        if (app.status !== 'FINANCE_PENDING' || status !== 'VETTING_PROGRESS') {
          return error(400, 'Finance can only move FINANCE_PENDING to VETTING_PROGRESS');
        }
      }

      await db
        .update(applications)
        .set({ status: status as any })
        .where(eq(applications.id, appId));

      return { success: true, id: appId, status };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ status: t.String() }),
      ensureRole: ['DIRECTOR', 'FINANCE'],
    },
  )
  .post(
    '/',
    async ({ body }) => {
      const result = await db
        .insert(applications)
        .values({
          product_name: body.product_name,
          client_id: body.client_id,
          status: (body.status as any) || 'PENDING_DOCS',
        })
        .returning();
      return { success: true, application: result[0] };
    },
    {
      body: t.Object({
        product_name: t.String(),
        client_id: t.Number(),
        status: t.Optional(t.String()),
      }),
      ensureRole: ['DIRECTOR', 'DOCUMENTATION'],
    },
  );
