import { unlink } from 'node:fs/promises';
import { eq, desc } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { applications, invoices, invoice_items, documents } from '../../db/schema';
import { auth } from '../middleware/auth';

export const applicationsController = new Elysia({ prefix: '/applications' })
  .use(auth)
  .get(
    '/',
    async ({ role }) => {
      if (role === 'FINANCE') {
        return db.query.applications.findMany({
          where: eq(applications.status, 'FINANCE_PENDING'),
          with: { client: true, invoices: { with: { items: true } } },
        });
      }

      if (role === 'VETTING') {
        return db.query.applications.findMany({
          where: eq(applications.status, 'VETTING_PROGRESS'),
          with: { client: true, documents: true },
        });
      }

      return db.query.applications.findMany({
        with: { client: true, invoices: { with: { items: true } } },
      });
    },
    {
      ensureRole: ['DIRECTOR', 'FINANCE', 'VETTING', 'DOCUMENTATION'],
    },
  )
  .delete(
    '/:id',
    async ({ params: { id } }) => {
        const appId = parseInt(id, 10);
        
        // 1. Find associated documents to delete files
        const docs = await db.select().from(documents).where(eq(documents.application_id, appId));
        
        // 2. Delete files from disk
        for (const doc of docs) {
            try {
                await unlink(doc.file_path);
            } catch (e) {
                console.error(`Failed to delete file: ${doc.file_path}`, e);
            }
        }

        // 3. Delete application (DB cascade handles invoices/documents rows)
        await db.delete(applications).where(eq(applications.id, appId));
        
        return { success: true };
    },
    {
        params: t.Object({ id: t.String() }),
        ensureRole: ['DIRECTOR']
    }
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

      // Auto-mark invoice as PAID if moved to VETTING_PROGRESS
      if (status === 'VETTING_PROGRESS') {
          await db.update(invoices)
            .set({ status: 'PAID' })
            .where(eq(invoices.application_id, appId));
      }

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
      // 1. Create Application
      const [application] = await db
        .insert(applications)
        .values({
          product_name: body.product_name,
          client_id: body.client_id,
          status: (body.status as any) || 'PENDING_DOCS',
        })
        .returning();

      // 2. Create Invoice if items provided
      if (body.items && body.items.length > 0) {
        const total = body.items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
        const invoiceNumber = `INV-${Date.now()}`;

        const [invoice] = await db
          .insert(invoices)
          .values({
            invoice_number: invoiceNumber,
            client_id: body.client_id,
            application_id: application.id,
            total_amount: total,
            status: 'PENDING',
          })
          .returning();

        await db.insert(invoice_items).values(
          body.items.map((item) => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.unit_price * item.quantity,
          })),
        );
      }

      return { success: true, application };
    },
    {
      body: t.Object({
        product_name: t.String(),
        client_id: t.Number(),
        status: t.Optional(t.String()),
        items: t.Optional(
          t.Array(
            t.Object({
              description: t.String(),
              quantity: t.Number(),
              unit_price: t.Number(),
            }),
          ),
        ),
      }),
      ensureRole: ['DIRECTOR', 'DOCUMENTATION'],
    },
  );
