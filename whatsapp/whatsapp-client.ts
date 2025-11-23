// Cliente de WhatsApp usando SDK oficial de Kapso
// https://docs.kapso.ai/docs/whatsapp/typescript-sdk/introduction

import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";
import { KAPSO_API_KEY, KAPSO_PHONE_NUMBER_ID } from "./secrets";
import fetch from "node-fetch";

let whatsappClient: WhatsAppClient | null = null;

export function getWhatsAppClient(): WhatsAppClient {
  if (!whatsappClient) {
    whatsappClient = new WhatsAppClient({
      baseUrl: "https://app.kapso.ai/api/meta/",
      kapsoApiKey: KAPSO_API_KEY(),
    });
  }
  return whatsappClient;
}

// Helper para enviar mensajes de texto
export async function sendTextMessage(to: string, body: string) {
  const client = getWhatsAppClient();
  return await client.messages.sendText({
    phoneNumberId: KAPSO_PHONE_NUMBER_ID(),
    to,
    body,
  });
}

// Helper para mensajes interactivos con botones
export async function sendInteractiveMessage(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
) {
  const client = getWhatsAppClient();

  // Construir payload como any para evitar problemas de tipos con la SDK
  const payload: any = {
    phoneNumberId: KAPSO_PHONE_NUMBER_ID(),
    to,
    type: "button",
    body: { text: bodyText },
    action: {
      buttons: buttons.map((btn) => ({
        type: "reply",
        reply: { id: btn.id, title: btn.title },
      })),
    },
  };

  return await client.messages.sendInteractiveRaw(payload);
}

// Helper para marcar mensaje como leído con indicador de typing
export async function markMessageAsRead(
  messageId: string,
  showTyping: boolean = true
) {
  // No intentar marcar como leído si es un mensaje simulado (de testing o landing)
  if (messageId.startsWith("landing-") || messageId.startsWith("test-")) {
    console.log("⏭️  Skipping markRead for simulated message");
    return;
  }

  const client = getWhatsAppClient();
  try {
    return await client.messages.markRead({
      phoneNumberId: KAPSO_PHONE_NUMBER_ID(),
      messageId,
      ...(showTyping && { typingIndicator: { type: "text" as const } }),
    });
  } catch (error: any) {
    // Si falla marcar como leído, log pero no bloquear el flujo
    console.error(
      "⚠️  Failed to mark message as read (non-blocking):",
      error.message
    );
  }
}

// Helper para enviar reacción a un mensaje
export async function sendReaction(
  to: string,
  messageId: string,
  emoji: string
) {
  // No intentar reaccionar si es un mensaje simulado (de testing o landing)
  if (messageId.startsWith("landing-") || messageId.startsWith("test-")) {
    console.log(`⏭️  Skipping reaction ${emoji} for simulated message`);
    return;
  }

  const client = getWhatsAppClient();
  try {
    return await client.messages.sendReaction({
      phoneNumberId: KAPSO_PHONE_NUMBER_ID(),
      to,
      reaction: {
        messageId: messageId,
        emoji,
      },
    });
  } catch (error: any) {
    // Si falla enviar reacción, log pero no bloquear el flujo
    console.error(
      `⚠️  Failed to send reaction ${emoji} (non-blocking):`,
      error.message
    );
  }
}

// Helper para enviar imagen por WhatsApp usando URL pública
export async function sendImageMessage(
  to: string,
  imageUrl: string,
  caption?: string
) {
  console.log(`📸 Sending image to ${to} from URL: ${imageUrl}`);
  
  const client = getWhatsAppClient();
  
  try {
    console.log("📤 Sending image via Kapso SDK...");
    
    const response = await client.messages.sendImage({
      phoneNumberId: KAPSO_PHONE_NUMBER_ID(),
      to,
      image: {
        link: imageUrl,
        caption,
      },
    });
    
    console.log(`✅ Image sent successfully to ${to}`);
    return response;
    
  } catch (error: any) {
    console.error(`❌ Failed to send image to ${to}:`, error.message);
    
    // Fallback: Intentar enviar solo el texto de la receta
    if (caption) {
      console.log("⚠️  Falling back to text-only message...");
      try {
        await sendTextMessage(to, `📷 [Imagen no disponible]\n\n${caption}`);
        console.log("✅ Fallback text message sent");
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
      }
    }
    
    throw new Error(`Failed to send image: ${error.message}`);
  }
}
