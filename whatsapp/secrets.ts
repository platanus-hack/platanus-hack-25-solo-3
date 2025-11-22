// Configuración de secrets usando Encore
import { secret } from "encore.dev/config";

export const ANTHROPIC_API_KEY = secret("ANTHROPIC_API_KEY");
export const KAPSO_API_KEY = secret("KAPSO_API_KEY");
export const KAPSO_PHONE_NUMBER_ID = secret("KAPSO_PHONE_NUMBER_ID");
export const WHATSAPP_BUSINESS_NUMBER = secret("WHATSAPP_BUSINESS_NUMBER");

