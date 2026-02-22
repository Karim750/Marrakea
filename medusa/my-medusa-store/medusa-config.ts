import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: {
      ssl: false,
      sslmode: "disable",
    },
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              // Capture payment automatically (set to false for manual capture)
              capture: true,
            },
          },
        ],
      },
    },
  ],
  admin: {
    vite: (config) => {
      config.server = {
        ...config.server,
        host: "0.0.0.0",
        // Allow all hosts when running in Docker (development mode)
        allowedHosts: true,
        hmr: {
          // HMR websocket port inside container
          port: 5173,
          // Port browser connects to (exposed in docker-compose.yml)
          clientPort: 5173,
        },
      }
      return config
    },
  },
})
