// Procesador principal de mensajes de WhatsApp
import { KapsoWebhookPayload } from "./types";
import { processWithAgentSDK } from "./claude-agent-client";
import { processWithClaude } from "./claude-client";

// Flag para cambiar entre Agent SDK y API directa
const USE_AGENT_SDK = true;

export async function processMessage(webhookData: KapsoWebhookPayload) {
  console.log("🔄 MESSAGE PROCESSOR STARTED");
  
  const { message, conversation } = webhookData;

  // Extraer datos del mensaje
  const from = conversation.phone_number;
  const messageText = message.text?.body || "";
  const messageType = message.type;

  console.log(`📱 Processing message from ${from}`);
  console.log(`📝 Message text: ${messageText}`);
  console.log(`📋 Message type: ${messageType}`);

  // Solo procesar mensajes de texto por ahora
  if (messageType !== "text") {
    console.log(`⏭️  Skipping non-text message of type: ${messageType}`);
    return;
  }

  try {
    if (USE_AGENT_SDK) {
      console.log("🤖 Using Claude Agent SDK...");
      await processWithAgentSDK(messageText, from);
    } else {
      console.log("🤖 Using Claude API directly...");
      await processWithClaude(messageText, from);
    }
    console.log(`✅ Message processed successfully for ${from}`);
  } catch (error) {
    console.error("❌ Error processing message:", error);
    
    // Fallback: Si Agent SDK falla, intentar con API directa
    if (USE_AGENT_SDK) {
      console.log("⚠️  Agent SDK failed, falling back to direct API...");
      try {
        await processWithClaude(messageText, from);
        console.log(`✅ Fallback processing successful for ${from}`);
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
      }
    }
  }
}
