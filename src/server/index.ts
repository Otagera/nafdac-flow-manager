import { Elysia } from 'elysia';
import { applicationsController } from './controllers/applications';
import { uploadController } from './controllers/upload';
import { clientsController } from './controllers/clients';
import { staticPlugin } from '@elysiajs/static';

export const app = new Elysia()
  .use(staticPlugin({
      assets: 'uploads',
      prefix: '/api/uploads'
  }))
  .group('/api', (app) => 
    app
      .use(applicationsController)
      .use(uploadController)
      .use(clientsController)
  );

export type App = typeof app;
