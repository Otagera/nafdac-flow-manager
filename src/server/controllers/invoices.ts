import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { invoices, invoice_items } from '../../db/schema';
import { auth } from '../middleware/auth';

export const invoicesController = new Elysia({ prefix: '/invoices' })
  .use(auth)
  .put(
    '/:id',
    async ({ params: { id }, body, role, error }) => {
      const invoiceId = parseInt(id, 10);
      const { items } = body;

      // 1. Fetch Invoice to check status/permissions
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, invoiceId),
        with: { application: true },
      });

      if (!invoice) return error(404, 'Invoice not found');

      // 2. Check Permissions & Status
      if (invoice.status === 'PAID') {
        return error(400, 'Cannot edit a PAID invoice');
      }

      // 3. Delete existing items
      await db.delete(invoice_items).where(eq(invoice_items.invoice_id, invoiceId));

      // 4. Insert new items
      if (items && items.length > 0) {
        await db.insert(invoice_items).values(
          items.map((item) => ({
            invoice_id: invoiceId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.unit_price * item.quantity,
          })),
        );
      }

      // 5. Update Total
      const total = items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
      await db
        .update(invoices)
        .set({ total_amount: total })
        .where(eq(invoices.id, invoiceId));

      return { success: true, total };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        items: t.Array(
          t.Object({
            description: t.String(),
            quantity: t.Number(),
            unit_price: t.Number(),
          }),
        ),
      }),
      ensureRole: ['DIRECTOR', 'FINANCE', 'DOCUMENTATION'],
    },
  );
