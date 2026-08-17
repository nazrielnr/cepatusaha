import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import viteCompression from 'vite-plugin-compression'

const devApiTarget = process.env.VITE_API_URL || process.env.VITE_API_BASE_URL || 'http://localhost:8787'

export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Optimize React runtime
      jsxRuntime: 'automatic',
    }),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files > 10KB
      deleteOriginFile: false,
    }),
    // Brotli compression for better compression ratio
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ],
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
    // Include commonly used dependencies for faster cold start
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    port: 5173,
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
        target: devApiTarget,
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path,
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
    port: 5173,
  },
  build: {
    outDir: 'dist',
    // Disable sourcemaps in production for smaller bundle size
    sourcemap: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1200,
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false, // Remove comments
      },
    },
    rollupOptions: {
      output: {
        // Optimize chunk splitting
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React core - keep together for better caching
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Clerk authentication - separate chunk
            if (id.includes('@clerk')) {
              return 'clerk';
            }
            // Radix UI components - group by type
            if (id.includes('@radix-ui/react-dialog') || id.includes('@radix-ui/react-alert-dialog')) {
              return 'ui-dialogs';
            }
            if (id.includes('@radix-ui/react-dropdown') || id.includes('@radix-ui/react-select')) {
              return 'ui-menus';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Lucide icons - separate chunk
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // Markdown rendering
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) {
              return 'markdown';
            }
            // Syntax highlighting
            if (id.includes('react-syntax-highlighter') || id.includes('shiki')) {
              return 'syntax-highlighter';
            }
            // Other node_modules
            return 'vendor';
          }
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize asset inlining
    assetsInlineLimit: 4096, // 4KB
  },
})
