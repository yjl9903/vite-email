import { defineConfig } from 'vite-plugin-email';

export default defineConfig({
  email: {
    host: 'smtp.yeah.net',
    secure: true,
    auth: {
      user: 'yan_jl@yeah.net'
    }
  }
});
