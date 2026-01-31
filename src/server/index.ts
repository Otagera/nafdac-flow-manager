import { staticPlugin } from '@elysiajs/static';
import { Elysia } from 'elysia';
import { adminController } from './controllers/admin';
import { applicationsController } from './controllers/applications';
import { authController } from './controllers/auth';
import { clientsController } from './controllers/clients';
import { uploadController } from './controllers/upload';

export const app = new Elysia()
  .use(
    staticPlugin({
      assets: 'uploads',
      prefix: '/api/uploads',
    }),
  )
  .group('/api', (app) =>
    app
      .use(authController)
      .use(adminController)
      .use(applicationsController)
      .use(uploadController)
      .use(clientsController),
  );

export type App = typeof app;
