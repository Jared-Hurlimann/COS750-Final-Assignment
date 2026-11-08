import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `base: './'` makes the build work from any sub-path, including
// https://<user>.github.io/COS750-Final-Assignment/ on GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
