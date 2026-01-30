import { Elysia } from 'elysia';

export const auth = (app: Elysia) =>
  app
    .derive(({ request }) => {
      const role = request.headers.get('x-user-role');
      // In a real app, verify token/session here.
      // For this mock, we trust the header.
      const user = { username: 'mock_user', role: role || 'GUEST' };
      return { user, role: user.role };
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
