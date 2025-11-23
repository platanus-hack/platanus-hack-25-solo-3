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

// Helper para enviar imagen por WhatsApp
export async function sendImageMessage(
  to: string,
  imageBuffer: Buffer,
  caption?: string
) {
  console.log(`📸 Sending image to ${to} (${imageBuffer.length} bytes)`);
  
  const client = getWhatsAppClient();
  try {
    // Paso 1: Subir la imagen a WhatsApp Media API
    console.log("📤 Uploading image to WhatsApp Media API...");
    
    // Crear un FormData con el buffer de imagen
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: 'recipe-image.png',
      contentType: 'image/png',
    });
    form.append('type', 'image/png');
    form.append('messaging_product', 'whatsapp');
    
    // Subir usando fetch directamente a la API de WhatsApp
    const uploadResponse = await fetch(
      `https://app.kapso.ai/api/meta/${KAPSO_PHONE_NUMBER_ID()}/media`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KAPSO_API_KEY()}`,
          ...form.getHeaders(),
        },
        body: form,
      }
    );
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Media upload failed: ${uploadResponse.status} - ${errorText}`);
    }
    
    const uploadResult = await uploadResponse.json() as { id: string };
    const mediaId = uploadResult.id;
    
    console.log(`✅ Image uploaded successfully. Media ID: ${mediaId}`);
    
    // Paso 2: Enviar mensaje con el media ID
    console.log("📨 Sending WhatsApp message with media ID...");
    
    const response = await client.messages.sendImage({
      phoneNumberId: KAPSO_PHONE_NUMBER_ID(),
      to,
      image: {
        id: mediaId,
        caption,
      },
    });
    
    console.log(`✅ Image sent successfully to ${to}`);
    return response;
    
  } catch (error: any) {
    console.error(`❌ Failed to send image to ${to}:`, error.message);
    throw new Error(`Failed to send image: ${error.message}`);
  }
}
