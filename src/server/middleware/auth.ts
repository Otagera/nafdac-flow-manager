import type { Elysia } from 'elysia';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super_secret_nafdac_key_123',
);

export const auth = (app: Elysia) =>
  app
    .derive(async ({ cookie: { auth_token } }) => {
      if (!auth_token.value) {
        return { user: null, role: 'GUEST' };
      }

      try {
        const { payload } = await jwtVerify(auth_token.value, JWT_SECRET);
        return {
          user: payload as { id: number; username: string; role: string },
          role: payload.role as string,
        };
      } catch (_e) {
        return { user: null, role: 'GUEST' };
      }
    })
    .macro(({ onBeforeHandle }) => ({
      ensureRole(allowedRoles: string[]) {
        onBeforeHandle(({ role, error }) => {
          if (!allowedRoles.includes(role as string)) {
            return error(403, 'Forbidden: Insufficient Permissions');
          }
        });
      },
    }));
