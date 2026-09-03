import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site under /<repository-name>/, so the base path must
// match the repository name. Override with VITE_BASE when deploying elsewhere.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/hn_plots_validation/',
});
