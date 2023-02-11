import { defineConfig } from 'vite-email';

export default defineConfig({
  email: {
    host: 'smtp.yeah.net',
    secure: true,
    auth: {
      user: 'yan_jl@yeah.net'
    },
    frontmatter: {
      receiver({ name }) {
        return `${name}@users.noreply.github.com`
      },
      today: new Date().toLocaleDateString(),
      author: 'XLor'
    }
  }
});
