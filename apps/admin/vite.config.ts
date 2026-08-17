import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Exclude workspace packages from pre-bundling to enable HMR
    exclude: [
      '@cepatusaha/shared-types',
      '@cepatusaha/ui-components',
      '@cepatusaha/utils',
    ],
  },
  server: {
    port: 5174,
    open: true,
    hmr: {
      overlay: true,
    },
    watch: {
      // Watch shared packages for changes
      ignored: ['!**/node_modules/@cepatusaha/**'],
    },
    fs: {
      // Allow serving files from workspace packages
      allow: ['..'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  preview: {
    port: 5174,
  },
  build: {
    outDir: 'dist',
    // Disable source maps in production for security
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'clerk': ['@clerk/clerk-react'],
          'charts': ['recharts'],
        },
      },
    },
  },
})
