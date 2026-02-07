import { eq, sql } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db } from '../../db';
import { applications, invoices } from '../../db/schema';
import { auth } from '../middleware/auth';

export const reportsController = new Elysia({ prefix: '/reports' })
  .use(auth)
  .get('/stats', async () => {
    // 1. Total Revenue
    const [revenueResult] = await db
      .select({ 
        total: sql<number>`sum(${invoices.total_amount})` 
      })
      .from(invoices)
      .where(eq(invoices.status, 'PAID'));

    // 2. Status Distribution
    const statusCounts = await db
      .select({
        status: applications.status,
        count: sql<number>`count(*)`
      })
      .from(applications)
      .groupBy(applications.status);

    // 3. Recent Activity (Last 5 apps)
    const recentApps = await db.query.applications.findMany({
      limit: 5,
      orderBy: (apps, { desc }) => [desc(apps.id)],
      with: { client: true }
    });

    return {
      revenue: Number(revenueResult?.total || 0),
      statusDistribution: statusCounts.map(s => ({ name: s.status, value: Number(s.count) })),
      recentActivity: recentApps
    };
  });
