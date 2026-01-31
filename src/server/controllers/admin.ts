import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { users } from '../../db/schema';
import { auth } from '../middleware/auth';

export const adminController = new Elysia({ prefix: '/admin' })
  .use(auth)
  .guard({ ensureRole: ['DIRECTOR'] }, (app) =>
    app
      .get('/users', async () => {
        return await db
          .select({
            id: users.id,
            username: users.username,
            role: users.role,
            invite_code: users.invite_code,
            created_at: users.created_at,
          })
          .from(users);
      })

      .post(
        '/users/invite',
        async ({ body, set }) => {
          const { username, role } = body;

          // Generate short unique code
          const inviteCode = `${role.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

          try {
            await db.insert(users).values({
              username,
              role: role as any,
              invite_code: inviteCode,
              // password_hash is null
            });
            return { success: true, invite_code: inviteCode };
          } catch (_e) {
            set.status = 400;
            return { success: false, message: 'User already exists' };
          }
        },
        {
          body: t.Object({
            username: t.String(),
            role: t.String(),
          }),
        },
      )

      .patch(
        '/users/:id/role',
        async ({ params: { id }, body }) => {
          const { role } = body;
          await db
            .update(users)
            .set({ role: role as any })
            .where(eq(users.id, parseInt(id, 10)));
          return { success: true };
        },
        {
          body: t.Object({ role: t.String() }),
        },
      )

      .delete('/users/:id', async ({ params: { id } }) => {
        await db.delete(users).where(eq(users.id, parseInt(id, 10)));
        return { success: true };
      }),
  );
