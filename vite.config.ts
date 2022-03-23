import { defineConfig } from 'vite-plugin-email';

export default defineConfig({
  email: {
    host: '<host>',
    secure: true,
    auth: {
      user: process.env.user
    }
  }
});