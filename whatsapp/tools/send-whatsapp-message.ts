import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { sendTextMessage } from "../whatsapp-client";

export const sendWhatsAppMessageTool = tool(
  "send_whatsapp_message",
  "Envía un mensaje de WhatsApp al usuario. DEBES usar esta herramienta para responder.",
  {
    to: z.string().describe("Número de WhatsApp del destinatario"),
    message: z.string().describe("Contenido del mensaje a enviar"),
  },
  async ({ to, message }) => {
    console.log("🔧 TOOL CALLED: send_whatsapp_message");
    console.log(`   To: ${to}`);
    console.log(`   Message: ${message}`);

    try {
      await sendTextMessage(to, message);
      console.log("✅ WhatsApp message sent successfully");
    console.log("   🎯 USER RESPONSE COMPLETED");

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              message: `Mensaje enviado a ${to}`,
            }),
          },
        ],
      };
    } catch (error: any) {
      console.error("❌ Error sending WhatsApp message:", error);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ success: false, error: error.message }),
          },
        ],
      };
    }
  }
);

