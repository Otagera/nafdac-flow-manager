import { treaty } from '@elysiajs/eden';
import type { App } from '../server';

const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export const api = treaty<App>(baseUrl, {
    fetch: {
        credentials: 'include'
    }
}).api;
