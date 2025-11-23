// Cargar variables de entorno
import dotenv from 'dotenv';
dotenv.config();

// Validar variables requeridas
const requiredEnvVars = [
  'DATABASE_URL',
  'KAPSO_API_KEY',
  'KAPSO_PHONE_NUMBER_ID',
  'ANTHROPIC_API_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error('Please check your .env file');
    process.exit(1);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '4000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL!,
  },
  kapso: {
    apiKey: process.env.KAPSO_API_KEY!,
    phoneNumberId: process.env.KAPSO_PHONE_NUMBER_ID!,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
  },
};

console.log('✅ Environment variables loaded');
console.log(`🌍 Environment: ${config.nodeEnv}`);
console.log(`🚪 Port: ${config.port}`);

