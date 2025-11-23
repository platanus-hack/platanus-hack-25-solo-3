// Secrets using environment variables
import "../config/env.js";

export const ANTHROPIC_API_KEY = () => process.env.ANTHROPIC_API_KEY!;
export const KAPSO_API_KEY = () => process.env.KAPSO_API_KEY!;
export const KAPSO_PHONE_NUMBER_ID = () => process.env.KAPSO_PHONE_NUMBER_ID!;
export const WHATSAPP_BUSINESS_NUMBER = () =>
  process.env.WHATSAPP_BUSINESS_NUMBER || process.env.KAPSO_PHONE_NUMBER_ID!;
