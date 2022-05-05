import { defineConfig } from 'vite-email';

export default defineConfig({
  email: {
    host: 'smtp.yeah.net',
    secure: true,
    auth: {
      user: 'yan_jl@yeah.net'
    },
    frontmatter: {
      today: new Date().toLocaleDateString(),
      author: 'XLor',
      upperName({ name }) {
        return name.toLocaleUpperCase();
      }
    }
  }
});
