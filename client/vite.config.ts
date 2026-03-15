import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

const shouldOpenBrowser = process.env.VITE_OPEN_BROWSER !== 'false' && process.env.CI !== 'true';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    open: shouldOpenBrowser ? 'http://localhost:5173' : false,
    port: 5173,
  },
});
