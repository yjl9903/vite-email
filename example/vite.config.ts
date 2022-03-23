import { defineConfig } from 'vite-plugin-email';

export default defineConfig({
  email: {
    host: 'smtp.yeah.net',
    auth: {
      user: '',
      pass: ''
    },
    secure: true
  }
});
