import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super_secret_nafdac_key_123');

export const authController = new Elysia({ prefix: '/auth' })
  .post('/login', async ({ body, set, cookie: { auth_token } }) => {
    const { username, password } = body;
    const user = await db.select().from(users).where(eq(users.username, username)).get();

    if (!user || !user.password_hash) {
      set.status = 401;
      return { success: false, message: 'Invalid credentials' };
    }

    const isMatch = await Bun.password.verify(password, user.password_hash);
    if (!isMatch) {
      set.status = 401;
      return { success: false, message: 'Invalid credentials' };
    }

    const token = await new SignJWT({ 
        id: user.id, 
        username: user.username, 
        role: user.role 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    auth_token.value = token;
    auth_token.httpOnly = true;
    auth_token.secure = process.env.NODE_ENV === 'production';
    auth_token.path = '/';
    // auth_token.maxAge = 86400; // 24 hours

    return { success: true, user: { username: user.username, role: user.role } };
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String()
    })
  })

  .post('/register', async ({ body, set, cookie: { auth_token } }) => {
    const { invite_code, username, password } = body;

    // Find user by invite code
    const user = await db.select().from(users).where(eq(users.invite_code, invite_code)).get();

    if (!user) {
      set.status = 400;
      return { success: false, message: 'Invalid invite code' };
    }

    // Check if username is taken (by someone else, though invite code is unique to a user row)
    // Actually, the invite creates a row. The user might want to change the pre-set username or we enforce it?
    // The previous plan said "Admin enters Username". So the row already has a username.
    // If we want to allow them to pick a username, we'd update it. 
    // Let's assume they must stick to the username given, OR allow update if unique.
    // Simpler: Validate invite code matches the row, then update password. 
    // Wait, if the admin sets the username, the user just needs to set the password.
    // Let's allow them to confirm/change username.

    if (user.password_hash) {
        set.status = 400;
        return { success: false, message: 'Invite code already used' };
    }

    const hashedPassword = await Bun.password.hash(password);

    await db.update(users)
      .set({ 
        password_hash: hashedPassword, 
        invite_code: null, // Clear invite code
        username: username // Allow updating username
      })
      .where(eq(users.id, user.id))
      .run();

    // Auto login
    const token = await new SignJWT({ 
        id: user.id, 
        username: username, 
        role: user.role 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    auth_token.value = token;
    auth_token.httpOnly = true;
    auth_token.secure = process.env.NODE_ENV === 'production';
    auth_token.path = '/';

    return { success: true, user: { username: username, role: user.role } };
  }, {
    body: t.Object({
      invite_code: t.String(),
      username: t.String(),
      password: t.String()
    })
  })

  .post('/logout', ({ cookie: { auth_token } }) => {
    auth_token.remove();
    return { success: true };
  })

  .get('/me', async ({ cookie: { auth_token }, set }) => {
    if (!auth_token.value) {
      set.status = 401;
      return { authenticated: false };
    }
    
    try {
        // We need to import jwtVerify from jose in the next file edit or assume it works
        // Importing here for completeness in this file content
        const { jwtVerify } = await import('jose');
        const { payload } = await jwtVerify(auth_token.value, JWT_SECRET);
        return { authenticated: true, user: payload };
    } catch (err) {
        set.status = 401;
        return { authenticated: false };
    }
  });
