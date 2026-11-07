import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the built files run from any sub-path (e.g. GitHub Pages /element-gems/).
export default defineConfig({
  plugins: [react()],
  base: './',
});
