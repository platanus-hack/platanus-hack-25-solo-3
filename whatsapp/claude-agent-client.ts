// Cliente usando Claude Agent SDK oficial
import {
  query,
  tool,
  createSdkMcpServer,
} from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { ANTHROPIC_API_KEY } from "./secrets";
import { sendTextMessage, sendInteractiveMessage } from "./whatsapp-client";
import { db } from "./db";

// Asegurar que el PATH incluya node para que el Agent SDK funcione
if (!process.env.PATH?.includes("/usr/local/bin")) {
  process.env.PATH = `${process.env.PATH}:/usr/local/bin:/usr/bin:/bin`;
}

// Tool: Enviar mensaje de WhatsApp
const sendWhatsAppMessageTool = tool(
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

// Tool: Obtener contexto del usuario
const getUserContextTool = tool(
  "get_user_context",
  "Obtiene el contexto completo de un usuario (perfil + household + miembros)",
  {
    phone_number: z.string().describe("Número de WhatsApp del usuario"),
  },
  async ({ phone_number }) => {
    console.log("🔧 TOOL CALLED: get_user_context");
    console.log(`   Phone: ${phone_number}`);

    const user = await db.queryRow`
      SELECT phone_number, display_name, created_at
      FROM users WHERE phone_number = ${phone_number}
    `;

    if (!user) {
      console.log("   Result: User does not exist");
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ exists: false }),
          },
        ],
      };
    }

    console.log("   User found:", user.phone_number);

    const household = await db.queryRow`
      SELECT h.*, hm.role
      FROM households h
      JOIN household_members hm ON h.id = hm.household_id
      WHERE hm.phone_number = ${phone_number}
    `;

    // Obtener todos los miembros del hogar si existe
    let members = [];
    if (household) {
      const membersQuery = await db.query`
        SELECT name, phone_number, age, relationship, role
        FROM household_members
        WHERE household_id = ${household.id}
        ORDER BY 
          CASE role 
            WHEN 'admin' THEN 1 
            ELSE 2 
          END,
          created_at
      `;

      for await (const member of membersQuery) {
        members.push(member);
      }
    }

    const result = {
      exists: true,
      user,
      household: household || null,
      members,
    };

    console.log("   Result:", JSON.stringify(result, null, 2));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result),
        },
      ],
    };
  }
);

// Tool: Crear hogar
const createHouseholdTool = tool(
  "create_household",
  "Crea un nuevo hogar y registra al usuario como admin",
  {
    admin_phone: z.string().describe("Número de WhatsApp del administrador"),
    display_name: z.string().describe("Nombre del administrador"),
    household_size: z.number().describe("Tamaño del hogar"),
    dietary_restrictions: z
      .string()
      .optional()
      .describe("Restricciones dietéticas"),
    preferences: z.string().optional().describe("Preferencias alimentarias"),
    goals: z.string().optional().describe("Objetivos del hogar"),
  },
  async (params) => {
    console.log("🔧 TOOL CALLED: create_household");
    console.log(`   Admin: ${params.admin_phone}`);
    console.log(`   Name: ${params.display_name}`);
    console.log(`   Size: ${params.household_size}`);
    console.log(`   Preferences: ${params.preferences || "none"}`);

    await db.exec`
      INSERT INTO users (phone_number, display_name)
      VALUES (${params.admin_phone}, ${params.display_name || null})
      ON CONFLICT (phone_number) DO NOTHING
    `;

    const household = await db.queryRow`
      INSERT INTO households (
        admin_phone, household_size, dietary_restrictions, preferences, goals
      ) VALUES (
        ${params.admin_phone},
        ${params.household_size || 1},
        ${params.dietary_restrictions || null},
        ${params.preferences || null},
        ${params.goals || null}
      )
      RETURNING id, admin_phone, household_size
    `;

    if (!household) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: "Failed to create household",
            }),
          },
        ],
      };
    }

    await db.exec`
      INSERT INTO household_members (household_id, phone_number, name, role)
      VALUES (${household.id}, ${params.admin_phone}, ${
      params.display_name || null
    }, 'admin')
    `;

    console.log(`✅ Household created successfully! ID: ${household.id}`);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, household }),
        },
      ],
    };
  }
);

// Tool: Agregar miembros al hogar
const addHouseholdMembersTool = tool(
  "add_household_members",
  "Agrega miembros al hogar. Pueden tener o no número de WhatsApp. Los niños pequeños NO tienen WhatsApp.",
  {
    household_id: z.number().describe("ID del hogar"),
    members: z
      .array(
        z.object({
          name: z.string().describe("Nombre del miembro"),
          phone_number: z
            .string()
            .optional()
            .describe("Número de WhatsApp (opcional)"),
          age: z.number().optional().describe("Edad del miembro"),
          relationship: z.string().optional().describe("Relación con el admin"),
          role: z.string().optional().describe("Rol en el hogar"),
        })
      )
      .describe("Lista de miembros a agregar"),
  },
  async (params) => {
    console.log("🔧 TOOL CALLED: add_household_members");
    console.log(`   Household ID: ${params.household_id}`);
    console.log(`   Members count: ${params.members.length}`);

    const { household_id, members } = params;

    for (const member of members) {
      // Si el miembro tiene phone_number, crear usuario primero
      if (member.phone_number) {
        await db.exec`
          INSERT INTO users (phone_number, display_name)
          VALUES (${member.phone_number}, ${member.name})
          ON CONFLICT (phone_number) DO UPDATE SET display_name = ${member.name}
        `;
      }

      // Agregar miembro al hogar
      await db.exec`
        INSERT INTO household_members (
          household_id, 
          phone_number, 
          name, 
          age, 
          relationship, 
          role
        )
        VALUES (
          ${household_id},
          ${member.phone_number || null},
          ${member.name},
          ${member.age || null},
          ${member.relationship || null},
          ${member.role || "member"}
        )
      `;
    }

    console.log(
      `✅ Added ${members.length} members to household ${household_id}`
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            message: `Se agregaron ${members.length} miembros al hogar`,
          }),
        },
      ],
    };
  }
);

// Tool: Guardar estado de conversación
const saveConversationStateTool = tool(
  "save_conversation_state",
  "Guarda el estado actual de la conversación con el usuario",
  {
    phone_number: z.string().describe("Número de WhatsApp del usuario"),
    current_intent: z
      .string()
      .optional()
      .describe("Intención actual de la conversación"),
    conversation_state: z
      .record(z.string(), z.any())
      .optional()
      .describe("Estado de la conversación"),
  },
  async (params) => {
    const { phone_number, current_intent, conversation_state } = params;

    await db.exec`
      INSERT INTO conversations (phone_number, current_intent, conversation_state, last_message_at)
      VALUES (
        ${phone_number},
        ${current_intent || null},
        ${JSON.stringify(conversation_state || {})},
        NOW()
      )
      ON CONFLICT (phone_number) DO UPDATE SET
        current_intent = ${current_intent || null},
        conversation_state = ${JSON.stringify(conversation_state || {})},
        last_message_at = NOW()
    `;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            message: "Estado de conversación guardado",
          }),
        },
      ],
    };
  }
);

// System prompt
const SYSTEM_PROMPT = `Eres PlanEat, asistente de planificación de comidas por WhatsApp.

HERRAMIENTAS DISPONIBLES:
- get_user_context: Ver si usuario existe y su info
- create_household: Crear hogar con info básica
- add_household_members: Agregar miembros del hogar
- send_whatsapp_message: Responder al usuario
- save_conversation_state: Guardar progreso

FLUJO:
1. Usa get_user_context con el número del usuario
2. Si NO existe y da su nombre + info familiar → USA create_household y add_household_members INMEDIATAMENTE
3. Responde con send_whatsapp_message al número exacto

CREAR HOGAR:
Cuando el usuario diga su nombre Y mencione a su familia, DEBES:
1. Llamar create_household(admin_phone, display_name, household_size, preferences)
2. Llamar add_household_members para cada familiar (esposa, hijos, etc.)
3. Confirmar por WhatsApp que se creó su perfil

EJEMPLO:
Usuario: "Soy Camilo, vivo con mi esposa Catalina y mis hijos Benjamín (14) y Emilia (7)"
→ create_household(phone="56...", name="Camilo", size=4)
→ add_household_members([{name:"Catalina", relationship:"esposa"}, {name:"Benjamín", age:14}, {name:"Emilia", age:7}])
→ send_whatsapp_message confirmando

IMPORTANTE: CREA el hogar en cuanto tengas nombre + familia. No pidas más info si ya tienes lo básico.`;

// Crear el servidor MCP con las tools
const planeatServer = createSdkMcpServer({
  name: "planeat",
  version: "1.0.0",
  tools: [
    sendWhatsAppMessageTool,
    getUserContextTool,
    createHouseholdTool,
    addHouseholdMembersTool,
    saveConversationStateTool,
  ],
});

// Obtener o crear sesión para el usuario
async function getOrCreateSession(
  phoneNumber: string
): Promise<{ sessionId: string | undefined; isNew: boolean }> {
  try {
    // Buscar conversación activa reciente (últimas 2 horas)
    const conversation = await db.queryRow`
      SELECT session_id, last_message_at
      FROM conversations
      WHERE phone_number = ${phoneNumber}
        AND last_message_at > NOW() - INTERVAL '2 hours'
      ORDER BY last_message_at DESC
      LIMIT 1
    `;

    if (conversation?.session_id) {
      console.log(`📝 Resuming existing session: ${conversation.session_id}`);
      return { sessionId: conversation.session_id, isNew: false };
    }

    console.log("🆕 Starting new session");
    return { sessionId: undefined, isNew: true };
  } catch (error) {
    console.error("❌ Error getting session:", error);
    console.log("🆕 Falling back to new session");
    return { sessionId: undefined, isNew: true };
  }
}

// Guardar session_id en la base de datos
async function saveSession(
  phoneNumber: string,
  sessionId: string
): Promise<void> {
  try {
    // Asegurar que el usuario existe primero
    await db.exec`
      INSERT INTO users (phone_number)
      VALUES (${phoneNumber})
      ON CONFLICT (phone_number) DO NOTHING
    `;

    // Guardar la sesión
    await db.exec`
      INSERT INTO conversations (phone_number, session_id, last_message_at)
      VALUES (${phoneNumber}, ${sessionId}, NOW())
      ON CONFLICT (phone_number) DO UPDATE SET
        session_id = ${sessionId},
        last_message_at = NOW()
    `;
    console.log(`💾 Session saved: ${sessionId}`);
  } catch (error) {
    console.error("❌ Error saving session:", error);
  }
}

// Procesar mensaje con Claude Agent SDK
export async function processWithAgentSDK(
  userMessage: string,
  phoneNumber: string
): Promise<void> {
  console.log("🤖 Using Claude Agent SDK");

  // Obtener sesión previa si existe
  const { sessionId: existingSessionId, isNew } = await getOrCreateSession(
    phoneNumber
  );

  const prompt = `Usuario: ${phoneNumber}
Mensaje: "${userMessage}"

Instrucciones:
1. Usa get_user_context("${phoneNumber}")
2. Si NO existe Y el mensaje tiene nombre + familia → CREA household + members AHORA
3. Si NO existe y falta info → pregunta lo mínimo necesario
4. Si existe → responde según su contexto
5. SIEMPRE responde con send_whatsapp_message("${phoneNumber}", "...")`;

  try {
    // Configurar API key en el entorno antes de llamar al SDK
    process.env.ANTHROPIC_API_KEY = ANTHROPIC_API_KEY();

    console.log("🎯 Starting Agent SDK query with config:");
    console.log(`   Model: claude-sonnet-4-5-20250929`);
    console.log(`   Permission Mode: bypassPermissions`);
    console.log(`   Max Turns: 15`);
    console.log(`   Phone: ${phoneNumber}`);
    console.log(
      `   Session: ${existingSessionId ? `Resume ${existingSessionId}` : "New"}`
    );

    // Configuración del SDK
    const queryOptions: any = {
      systemPrompt: SYSTEM_PROMPT,
      model: "claude-sonnet-4-5-20250929",
      permissionMode: "bypassPermissions",
      maxTurns: 15,
      // SOLO permitir nuestras herramientas custom (no las de Claude Code)
      allowedTools: [
        "get_user_context",
        "send_whatsapp_message",
        "create_household",
        "add_household_members",
        "save_conversation_state",
      ],
      mcpServers: {
        planeat: planeatServer,
      },
    };

    // Si existe sesión previa, reanudar en lugar de crear nueva
    if (existingSessionId) {
      queryOptions.resume = existingSessionId;
    }

    let currentSessionId: string | undefined = existingSessionId;

    // Usar Agent SDK con configuración
    for await (const message of query({
      prompt,
      options: queryOptions,
    })) {
      // Log detallado de TODOS los mensajes para debugging
      console.log("📨 SDK Message:", {
        type: message.type,
        timestamp: new Date().toISOString(),
      });

      // Capturar session_id de los mensajes
      if ("session_id" in message && message.session_id) {
        currentSessionId = message.session_id;
      }

      if (message.type === "assistant") {
        console.log("🤖 Agent response:", JSON.stringify(message, null, 2));
      } else if (message.type === "tool_progress") {
        console.log("🔧 Tool in progress:", message.tool_name);
        console.log("   Full message:", JSON.stringify(message, null, 2));
      } else if (message.type === "result") {
        console.log("✅ Query completed successfully");
        console.log(
          `   Duration: ${message.duration_ms}ms | Turns: ${message.num_turns} | Cost: $${message.total_cost_usd}`
        );
        console.log("   Full result:", JSON.stringify(message, null, 2));
      } else if (message.type === "user") {
        console.log("👤 User message processed");
      } else if (message.type === "stream_event") {
        console.log("📡 Stream event:", JSON.stringify(message, null, 2));
      } else if (message.type === "system") {
        console.log("⚙️ System message:", JSON.stringify(message, null, 2));
      } else if (message.type === "auth_status") {
        console.log("🔐 Auth status:", JSON.stringify(message, null, 2));
      } else {
        console.log(
          "❓ Unknown message type:",
          JSON.stringify(message, null, 2)
        );
      }
    }

    // Guardar session_id al final
    if (currentSessionId && currentSessionId !== existingSessionId) {
      await saveSession(phoneNumber, currentSessionId);
    }

    console.log("✅ Agent SDK processing complete");
  } catch (error: any) {
    console.error("❌ Agent SDK error:", error);
    throw error;
  }
}
