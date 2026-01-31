import { createFileRoute } from '@tanstack/react-router';
import { app } from '../../server';

export const Route = createFileRoute('/api/$')({
  // @ts-expect-error - 'server' property might require specific setup or types augmentation not yet visible
  server: {
    handlers: {
      GET: ({ request }) => app.handle(request),
      POST: ({ request }) => app.handle(request),
      PATCH: ({ request }) => app.handle(request),
      PUT: ({ request }) => app.handle(request),
      DELETE: ({ request }) => app.handle(request),
    },
  },
});
