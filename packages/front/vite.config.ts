import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'profile' ? [{
      name: 'react-devtools-profile',
      transform: (code: string, id: string) => {
        if (!id.endsWith('/src/index.tsx')) return
        return { code: `import 'react-devtools-cdt-mcp/register'\n${code}`, map: null }
      }
    }] : [])
  ],
  build: { outDir: mode === 'profile' ? 'dist-profile' : 'dist', sourcemap: mode === 'profile', minify: mode !== 'profile' },
  publicDir: "public",
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      ...(mode === 'profile' ? [{ find: 'react-dom/client', replacement: 'react-dom/profiling' }] : [])
    ],
  },
}))
