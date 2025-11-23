import { Router, Request, Response } from "express";
import { processMessage } from "./message-processor.js";
import { KapsoWebhookPayload } from "./types.js";
import { KAPSO_PHONE_NUMBER_ID } from "./secrets.js";

const router = Router();

// Webhook verification (GET request de Kapso)
router.get("/webhooks/whatsapp", (req: Request, res: Response) => {
  console.log("🔍 Webhook verification request received");
  console.log("Query params:", req.query);

  // Kapso puede enviar un challenge para verificar el webhook
  const challenge = req.query["hub.challenge"] || req.query.challenge;

  if (challenge) {
    console.log("✅ Responding with challenge:", challenge);
    res.status(200).send(challenge);
  } else {
    res.status(200).send("Webhook endpoint is active");
  }
});

// Webhook de Kapso para recibir mensajes
router.post("/webhooks/whatsapp", async (req: Request, res: Response) => {
  try {
    const body = req.body;

    console.log("=== WEBHOOK RECIBIDO ===");
    console.log("Raw body:", JSON.stringify(body, null, 2));
    console.log("Type:", body.type);
    console.log("Is batch?:", body.batch);
    console.log("Data length:", body.data?.length);

    // Kapso envía los webhooks en formato batch
    if (body.batch && body.data && Array.isArray(body.data)) {
      console.log(`📦 Processing ${body.data.length} messages in batch`);

      for (const item of body.data) {
        const webhookData = item as KapsoWebhookPayload;
        console.log("Message type:", webhookData.message?.type);
        console.log("Direction:", webhookData.message?.kapso?.direction);
        console.log("From:", webhookData.conversation?.phone_number);

        // Solo procesar mensajes entrantes (inbound)
        if (webhookData.message?.kapso?.direction === "inbound") {
          console.log("✅ Procesando mensaje inbound");
          processMessage(webhookData).catch((err) =>
            console.error("Error processing message:", err)
          );
        } else {
          const direction = webhookData.message?.kapso?.direction;
          const status = webhookData.message?.kapso?.status;
          console.log(
            `⏭️  Mensaje ${direction} (${status}) - ignorando (es respuesta del bot)`
          );
        }
      }
    } else {
      // Formato no-batch
      const webhookData = body as KapsoWebhookPayload;
      if (webhookData.message?.kapso?.direction === "inbound") {
        console.log("✅ Procesando mensaje inbound (no-batch)");
        processMessage(webhookData).catch((err) =>
          console.error("Error processing message:", err)
        );
      } else {
        const direction = webhookData.message?.kapso?.direction;
        const status = webhookData.message?.kapso?.status;
        console.log(
          `⏭️  Mensaje ${direction} (${status}) - ignorando (es respuesta del bot)`
        );
      }
    }

    console.log("========================");
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Test webhook
router.post("/test/webhook", async (req: Request, res: Response) => {
  try {
    const { message, from } = req.body;

    const mockWebhook: KapsoWebhookPayload = {
      message: {
        id: "test-" + Date.now(),
        timestamp: String(Math.floor(Date.now() / 1000)),
        type: "text",
        text: { body: message },
        kapso: {
          direction: "inbound",
          status: "received",
          processing_status: "pending",
          origin: "cloud_api",
          has_media: false,
        },
      },
      conversation: {
        id: "test-conv",
        phone_number: from,
        status: "active",
        phone_number_id: KAPSO_PHONE_NUMBER_ID(),
      },
      is_new_conversation: false,
      phone_number_id: KAPSO_PHONE_NUMBER_ID(),
    };

    await processMessage(mockWebhook);
    res.json({ success: true, message: "Webhook procesado" });
  } catch (error: any) {
    console.error("Test webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar conversación desde landing
router.post("/start", async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    console.log(`📱 Iniciando conversación con ${phoneNumber}`);

    const mockWebhook: KapsoWebhookPayload = {
      message: {
        id: "landing-" + Date.now(),
        timestamp: String(Math.floor(Date.now() / 1000)),
        type: "text",
        text: { body: "Hola" },
        kapso: {
          direction: "inbound",
          status: "received",
          processing_status: "pending",
          origin: "cloud_api",
          has_media: false,
        },
      },
      conversation: {
        id: "landing-conv-" + phoneNumber,
        phone_number: phoneNumber,
        status: "active",
        phone_number_id: KAPSO_PHONE_NUMBER_ID(),
      },
      is_new_conversation: true,
      phone_number_id: KAPSO_PHONE_NUMBER_ID(),
    };

    processMessage(mockWebhook).catch((err) =>
      console.error("Error processing landing message:", err)
    );

    console.log(`✅ Conversación iniciada para ${phoneNumber}`);

    res.json({
      success: true,
      message: "Conversación iniciada exitosamente",
    });
  } catch (error: any) {
    console.error("❌ Error al iniciar conversación:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error al iniciar conversación",
    });
  }
});

export default router;
