// Procesador principal de mensajes de WhatsApp
import { KapsoWebhookPayload } from "./types";
import { processWithAgentSDK } from "./claude-agent-client";
import { processWithClaude } from "./claude-client";
import { markMessageAsRead } from "./whatsapp-client";

// Flag para cambiar entre Agent SDK y API directa
// TEMPORALMENTE DESACTIVADO - SDK tarda 130s (demasiado lento)
const USE_AGENT_SDK = false;

// Cache para deduplicar mensajes (en memoria, 5 minutos TTL)
const processedMessages = new Map<string, number>();
const MESSAGE_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Limpiar cache periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [msgId, timestamp] of processedMessages.entries()) {
    if (now - timestamp > MESSAGE_CACHE_TTL) {
      processedMessages.delete(msgId);
    }
  }
}, 60000); // Cada 1 minuto

export async function processMessage(webhookData: KapsoWebhookPayload) {
  console.log("🔄 MESSAGE PROCESSOR STARTED");
  
  const { message, conversation } = webhookData;

  // Extraer datos del mensaje
  const messageId = message.id;
  const from = conversation.phone_number;
  const messageType = message.type;

  console.log(`📱 Processing message from ${from}`);
  console.log(`📋 Message type: ${messageType}`);
  console.log(`🔑 Message ID: ${messageId}`);

  // DEDUPLICACIÓN: Verificar si ya procesamos este mensaje
  if (processedMessages.has(messageId)) {
    console.log(`⏭️  SKIPPING duplicate message ${messageId} (already processed)`);
    return;
  }

  // Marcar mensaje como procesando INMEDIATAMENTE
  processedMessages.set(messageId, Date.now());

  // Extraer contenido según tipo de mensaje
  let messageText = "";
  let mediaUrl: string | undefined;

  if (messageType === "text") {
    messageText = message.text?.body || "";
    console.log(`📝 Text: ${messageText}`);
  } else if (messageType === "audio") {
    // Kapso transcribe el audio automáticamente
    // La transcripción está en conversation.kapso.last_message_text
    const transcript = conversation.kapso?.last_message_text || "";
    
    // Extraer solo la transcripción (después de "Transcript: ")
    const transcriptMatch = transcript.match(/Transcript:\s*(.+)$/);
    messageText = transcriptMatch ? transcriptMatch[1].trim() : transcript;
    
    console.log(`🎤 Audio transcript: ${messageText}`);
  } else if (messageType === "image") {
    // Para imágenes, obtener la URL y pasar a Claude Vision
    mediaUrl = message.kapso?.media_url || message.image?.link;
    messageText = message.caption?.body || "[Usuario envió una imagen de lista de compras]";
    
    console.log(`📷 Image URL: ${mediaUrl}`);
    console.log(`📝 Caption: ${messageText}`);
  } else {
    console.log(`⏭️  Skipping unsupported message type: ${messageType}`);
    return;
  }

  // Si no hay contenido, skip
  if (!messageText && !mediaUrl) {
    console.log(`⏭️  No content to process`);
    return;
  }

  try {
    // Marcar mensaje como leído y mostrar indicador de typing
    console.log(`👀 Marking message as read with typing indicator...`);
    await markMessageAsRead(messageId, true);
    
    if (USE_AGENT_SDK) {
      console.log("🤖 Using Claude Agent SDK...");
      await processWithAgentSDK(messageText, from, messageId);
    } else {
      console.log("🤖 Using Claude API directly...");
      // TODO: Si hay mediaUrl (imagen), pasar a Claude Vision
      // Por ahora, solo procesamos el texto/transcripción
      await processWithClaude(messageText, from, mediaUrl);
    }
    console.log(`✅ Message processed successfully for ${from}`);
  } catch (error) {
    console.error("❌ Error processing message:", error);
    
    // Fallback: Si Agent SDK falla, intentar con API directa
    if (USE_AGENT_SDK) {
      console.log("⚠️  Agent SDK failed, falling back to direct API...");
      try {
        await processWithClaude(messageText, from, mediaUrl);
        console.log(`✅ Fallback processing successful for ${from}`);
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
      }
    }
  }
}
