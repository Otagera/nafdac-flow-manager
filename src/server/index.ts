import { Elysia } from 'elysia';
import { applicationsController } from './controllers/applications';
import { uploadController } from './controllers/upload';
import { clientsController } from './controllers/clients';
import { authController } from './controllers/auth';
import { adminController } from './controllers/admin';
import { staticPlugin } from '@elysiajs/static';

export const app = new Elysia()
  .use(staticPlugin({
      assets: 'uploads',
      prefix: '/api/uploads'
  }))
  .group('/api', (app) => 
    app
      .use(authController)
      .use(adminController)
      .use(applicationsController)
      .use(uploadController)
      .use(clientsController)
  );

export type App = typeof app;
