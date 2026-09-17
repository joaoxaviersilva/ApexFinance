import { createAuthClient } from 'better-auth/react';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
});
