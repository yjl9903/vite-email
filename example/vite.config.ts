import { defineConfig } from 'vite-email';

export default defineConfig({
  email: {
    host: 'smtp.yeah.net',
    secure: true,
    auth: {
      user: 'yan_jl@yeah.net'
    }
  }
});
