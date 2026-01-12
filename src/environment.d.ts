declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URI: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      GOOGLE_CLIENT_ID: string
      GOOGLE_CLIENT_SECRET: string
      APPLE_CLIENT_ID: string
      APPLE_CLIENT_SECRET: string
      S3_BUCKET: string
      S3_REGION: string
      S3_ACCESS_KEY: string
      S3_SECRET_KEY: string
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string
      STRIPE_SECRET_KEY: string
      STRIPE_WEBHOOK_SECRET: string
      SHOPPER_APPROVED_SITE_ID: string
      SHOPPER_APPROVED_TOKEN: string
      NEXT_PUBLIC_TERMLY_WEBSITE_UUID: string
      ENCRYPTION_KEY: string
      ENCRYPTION_SALT: string
      BREVO_API_BASE_URL: string
      BREVO_API_KEY: string
    }
  }

  // Browser globals
  interface Window {
    dataLayer: any[]
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
