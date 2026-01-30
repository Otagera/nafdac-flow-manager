import { Elysia, t } from 'elysia';
import { auth } from '../middleware/auth';
import { db } from '../../db';
import { documents, applications } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { mkdir } from 'fs/promises';

// Ensure uploads dir exists
await mkdir('uploads', { recursive: true });

export const uploadController = new Elysia({ prefix: '/upload' })
  .use(auth)
  .post('/', async ({ body, error }) => {
    const { file, application_id, file_type } = body;
    const appId = parseInt(application_id);
    
    if (!file) return error(400, 'File required');
    
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `uploads/${fileName}`;
    
    await Bun.write(filePath, file);
    
    const result = await db.insert(documents).values({
        application_id: appId,
        file_type,
        file_path: filePath
    }).returning();

    // Auto-advance status
    await db.update(applications)
        .set({ status: 'FINANCE_PENDING' })
        .where(eq(applications.id, appId));
    
    return { success: true, document: result[0] };
  }, {
    body: t.Object({
        file: t.File(),
        application_id: t.String(),
        file_type: t.String()
    }),
    ensureRole: ['DIRECTOR', 'DOCUMENTATION']
  });
