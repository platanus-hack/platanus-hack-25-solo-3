// Cliente de Claude usando API directa con arquitectura multi-agente manual
import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY } from "./secrets";
import { sendTextMessage } from "./whatsapp-client";
import { db } from "./db";

// Importar prompts de los agentes
import { onboardingAgent } from "./agents/onboarding";
import { menuPlannerAgent } from "./agents/menu-planner";
import { shoppingListAgent } from "./agents/shopping-list";
import { ecommerceAgent } from "./agents/ecommerce";

// Definición de tools para Claude
const tools: Anthropic.Tool[] = [
  {
    name: "send_whatsapp_message",
    description:
      "Envía un mensaje de WhatsApp al usuario. DEBES usar esta herramienta para responder.",
    input_schema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Número de WhatsApp del destinatario",
        },
        message: {
          type: "string",
          description: "Contenido del mensaje a enviar",
        },
      },
      required: ["to", "message"],
    },
  },
  {
    name: "get_user_context",
    description:
      "Obtiene el contexto completo de un usuario (perfil + household)",
    input_schema: {
      type: "object",
      properties: {
        phone_number: {
          type: "string",
          description: "Número de WhatsApp del usuario",
        },
      },
      required: ["phone_number"],
    },
  },
  {
    name: "create_household",
    description:
      "Crea un nuevo hogar y registra al usuario como admin. IMPORTANTE: Siempre incluye display_name con el nombre del usuario.",
    input_schema: {
      type: "object",
      properties: {
        admin_phone: {
          type: "string",
          description: "Número de WhatsApp del admin",
        },
        display_name: {
          type: "string",
          description: "Nombre del usuario (REQUERIDO para guardar en perfil)",
        },
        household_size: {
          type: "number",
          description: "Número total de personas en el hogar",
        },
        dietary_restrictions: {
          type: "string",
          description: "Restricciones dietéticas (ej: vegetariano, sin gluten)",
        },
        preferences: {
          type: "string",
          description: "Preferencias de comida (ej: italiana, mexicana)",
        },
        goals: {
          type: "string",
          description: "Objetivos (ej: comer saludable, ahorrar tiempo)",
        },
      },
      required: ["admin_phone", "display_name"],
    },
  },
  {
    name: "add_household_members",
    description:
      "Agrega miembros al hogar. Los niños pequeños NO tienen WhatsApp.",
    input_schema: {
      type: "object",
      properties: {
        household_id: { type: "number", description: "ID del hogar" },
        members: {
          type: "array",
          description: "Lista de miembros del hogar",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Nombre del miembro (requerido)",
              },
              phone_number: {
                type: "string",
                description: "WhatsApp (opcional)",
              },
              age: { type: "number", description: "Edad del miembro" },
              relationship: {
                type: "string",
                description: "Relación familiar",
              },
              role: { type: "string", description: 'Rol: "admin" o "member"' },
            },
            required: ["name"],
          },
        },
      },
      required: ["household_id", "members"],
    },
  },
  {
    name: "save_conversation_state",
    description: "Guarda el estado actual de la conversación",
    input_schema: {
      type: "object",
      properties: {
        phone_number: { type: "string" },
        current_intent: { type: "string" },
        conversation_state: { type: "object" },
      },
      required: ["phone_number"],
    },
  },
  {
    name: "send_reaction",
    description: "Envía una reacción emoji a un mensaje de WhatsApp",
    input_schema: {
      type: "object",
      properties: {
        message_id: {
          type: "string",
          description: "ID del mensaje a reaccionar",
        },
        emoji: {
          type: "string",
          description: "Emoji a enviar (ej: ❤️, 👍, 🎉)",
        },
      },
      required: ["message_id", "emoji"],
    },
  },
];

// Handlers de tools
async function executeTool(
  toolName: string,
  toolInput: Record<string, any>
): Promise<string> {
  try {
    switch (toolName) {
      case "send_whatsapp_message": {
        const { to, message } = toolInput;
        console.log(`📤 Sending WhatsApp to ${to}`);
        await sendTextMessage(to, message);
        return JSON.stringify({
          success: true,
          message: `Mensaje enviado a ${to}`,
        });
      }

      case "get_user_context": {
        const { phone_number } = toolInput;
        const user = await db.queryRow`
          SELECT phone_number, display_name, created_at
          FROM users WHERE phone_number = ${phone_number}
        `;

        if (!user) {
          return JSON.stringify({ exists: false });
        }

        const household = await db.queryRow`
          SELECT h.*, hm.role
          FROM households h
          JOIN household_members hm ON h.id = hm.household_id
          WHERE hm.phone_number = ${phone_number}
        `;

        let members = [];
        if (household) {
          const membersQuery = await db.query`
            SELECT name, phone_number, age, relationship, role
            FROM household_members
            WHERE household_id = ${household.id}
            ORDER BY 
              CASE role WHEN 'admin' THEN 1 ELSE 2 END,
              created_at
          `;

          for await (const member of membersQuery) {
            members.push(member);
          }
        }

        return JSON.stringify({
          exists: true,
          user,
          household: household || null,
          members,
        });
      }

      case "create_household": {
        // Actualizar usuario con display_name (importante!)
        await db.exec`
          INSERT INTO users (phone_number, display_name)
          VALUES (${toolInput.admin_phone}, ${toolInput.display_name || null})
          ON CONFLICT (phone_number) DO UPDATE SET
            display_name = ${toolInput.display_name || null}
        `;

        const household = await db.queryRow`
          INSERT INTO households (
            admin_phone, household_size, dietary_restrictions, preferences, goals
          ) VALUES (
            ${toolInput.admin_phone},
            ${toolInput.household_size || 1},
            ${toolInput.dietary_restrictions || null},
            ${toolInput.preferences || null},
            ${toolInput.goals || null}
          )
          RETURNING id, admin_phone, household_size
        `;

        if (!household) {
          return JSON.stringify({
            success: false,
            error: "Failed to create household",
          });
        }

        // Agregar admin como primer miembro con su nombre
        await db.exec`
          INSERT INTO household_members (household_id, phone_number, name, role)
          VALUES (
            ${household.id}, 
            ${toolInput.admin_phone}, 
            ${toolInput.display_name || null},
            'admin'
          )
        `;

        return JSON.stringify({ success: true, household });
      }

      case "add_household_members": {
        const { household_id, members } = toolInput;

        for (const member of members) {
          if (member.phone_number) {
            await db.exec`
              INSERT INTO users (phone_number, display_name)
              VALUES (${member.phone_number}, ${member.name})
              ON CONFLICT (phone_number) DO UPDATE SET display_name = ${member.name}
            `;
          }

          await db.exec`
            INSERT INTO household_members (
              household_id, phone_number, name, age, relationship, role
            ) VALUES (
              ${household_id},
              ${member.phone_number || null},
              ${member.name},
              ${member.age || null},
              ${member.relationship || null},
              ${member.role || "member"}
            )
          `;
        }

        return JSON.stringify({
          success: true,
          message: `Se agregaron ${members.length} miembros al hogar`,
        });
      }

      case "save_conversation_state": {
        const { phone_number, current_intent, conversation_state } = toolInput;

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

        return JSON.stringify({ success: true, message: "Estado guardado" });
      }

      case "send_reaction": {
        // TODO: Implementar cuando tengamos la función en whatsapp-client
        return JSON.stringify({ success: true, message: "Reacción enviada" });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error: any) {
    console.error(`❌ Tool error (${toolName}):`, error.message);
    return JSON.stringify({ error: error.message });
  }
}

// Cliente singleton
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: ANTHROPIC_API_KEY() });
  }
  return anthropicClient;
}

// Router: Detecta intención y devuelve el agente apropiado
async function routeToAgent(
  userMessage: string,
  phoneNumber: string
): Promise<{ agent: string; context: any }> {
  console.log("🔀 Routing message...");

  // Obtener contexto del usuario
  const userContextStr = await executeTool("get_user_context", {
    phone_number: phoneNumber,
  });
  const userContext = JSON.parse(userContextStr);

  console.log(`   User exists: ${userContext.exists}`);

  const msgLower = userMessage.toLowerCase();

  // 🎯 PRIORIDAD 1: Detectar lista de compras (INCLUSO PARA USUARIOS NUEVOS)
  // Patrones: "necesito X, Y, Z" o menciona varios ingredientes
  const hasShoppingKeywords = msgLower.match(/necesito|comprar|lista|ingrediente/);
  const hasIngredients = msgLower.match(/tomate|pollo|carne|pan|leche|arroz|verdura|fruta|queso|huevo|pescado|lechuga|zanahoria/i);
  const hasMultipleItems = msgLower.split(/,|y/).filter(s => s.trim().length > 3).length >= 3;

  if (hasShoppingKeywords && hasIngredients) {
    console.log("   → shopping-list (detected keywords + ingredients)");
    return { agent: "shopping-list", context: userContext };
  }

  if (hasIngredients && hasMultipleItems) {
    console.log("   → shopping-list (detected multiple food items)");
    return { agent: "shopping-list", context: userContext };
  }

  // PRIORIDAD 2: Detectar menú/recetas
  if (msgLower.match(/menú|menu|receta|cocinar|preparar|comida|plato/)) {
    console.log("   → menu-planner");
    return { agent: "menu-planner", context: userContext };
  }

  // PRIORIDAD 3: Detectar e-commerce
  if (msgLower.match(/pedido|online|jumbo|lider|unimarc|santa isabel|pedir/)) {
    console.log("   → ecommerce");
    return { agent: "ecommerce", context: userContext };
  }

  // PRIORIDAD 4: Actualizar perfil
  if (
    msgLower.match(
      /familia|perfil|actualizar|cambiar|agregar miembro|household/
    )
  ) {
    console.log("   → onboarding (update profile)");
    return { agent: "onboarding", context: userContext };
  }

  // PRIORIDAD 5: Usuario nuevo sin intención clara → onboarding
  if (!userContext.exists) {
    console.log("   → onboarding (new user, general greeting)");
    return { agent: "onboarding", context: userContext };
  }

  // Default: onboarding RÁPIDO (ofrece opciones)
  console.log("   → onboarding (default)");
  return { agent: "onboarding", context: userContext };
}

// Obtener prompt del agente
function getAgentPrompt(agentName: string): string {
  switch (agentName) {
    case "onboarding":
      return onboardingAgent.prompt;
    case "menu-planner":
      return menuPlannerAgent.prompt;
    case "shopping-list":
      return shoppingListAgent.prompt;
    case "ecommerce":
      return ecommerceAgent.prompt;
    default:
      return onboardingAgent.prompt;
  }
}

// Obtener historial de conversación de la base de datos
async function getConversationHistory(
  phoneNumber: string
): Promise<Anthropic.MessageParam[]> {
  try {
    const conversation = await db.queryRow`
      SELECT conversation_state
      FROM conversations
      WHERE phone_number = ${phoneNumber}
        AND last_message_at > NOW() - INTERVAL '2 hours'
    `;

    if (conversation?.conversation_state) {
      // JSONB ya es un objeto JavaScript, no necesita JSON.parse
      const state = conversation.conversation_state as {
        messages?: Anthropic.MessageParam[];
      };
      return state.messages || [];
    }
  } catch (error) {
    console.error("Error loading conversation history:", error);
  }
  return [];
}

// Guardar historial de conversación
async function saveConversationHistory(
  phoneNumber: string,
  messages: Anthropic.MessageParam[]
): Promise<void> {
  try {
    // Asegurar que el usuario existe ANTES de guardar conversación
    await db.exec`
      INSERT INTO users (phone_number)
      VALUES (${phoneNumber})
      ON CONFLICT (phone_number) DO NOTHING
    `;

    const state = { messages };
    await db.exec`
      INSERT INTO conversations (phone_number, conversation_state, last_message_at)
      VALUES (${phoneNumber}, ${JSON.stringify(state)}, NOW())
      ON CONFLICT (phone_number) DO UPDATE SET
        conversation_state = ${JSON.stringify(state)},
        last_message_at = NOW()
    `;
  } catch (error) {
    console.error("Error saving conversation history:", error);
  }
}

// Procesar mensaje con arquitectura multi-agente manual
export async function processWithClaude(
  userMessage: string,
  phoneNumber: string,
  mediaUrl?: string
): Promise<void> {
  const startTime = Date.now();

  try {
    // 1. Router: Detectar agente apropiado
    const { agent, context } = await routeToAgent(userMessage, phoneNumber);

    // 2. Obtener prompt especializado del agente
    const agentPrompt = getAgentPrompt(agent);

    // 3. Cargar historial de conversación (últimas 2 horas)
    const history = await getConversationHistory(phoneNumber);
    console.log(`📜 Loaded ${history.length} messages from history`);

    // 4. Construir mensaje con contexto
    const contextStr = JSON.stringify(context, null, 2);
    
    // Si hay imagen, usar Claude Vision
    const userContent: Anthropic.MessageParam["content"] = mediaUrl
      ? [
          {
            type: "image",
            source: {
              type: "url",
              url: mediaUrl,
            },
          },
          {
            type: "text",
            text: `Usuario ${phoneNumber} envió una imagen con el texto: "${userMessage}"

CONTEXTO DEL USUARIO:
${contextStr}

IMPORTANTE: 
- Analiza la imagen (puede ser una lista de compras escrita a mano)
- Extrae los items de la lista
- Responde usando send_whatsapp_message al número ${phoneNumber}.`,
          },
        ]
      : `Usuario ${phoneNumber} dice: "${userMessage}"

CONTEXTO DEL USUARIO:
${contextStr}

IMPORTANTE: Responde usando send_whatsapp_message al número ${phoneNumber}.`;

    const messages: Anthropic.MessageParam[] = [
      ...history, // Incluir historial
      {
        role: "user",
        content: userContent,
      },
    ];

    // 4. Llamar a Claude con prompt especializado
    const client = getAnthropicClient();
    let response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: agentPrompt, // Prompt especializado del agente
      tools,
      messages,
    });

    console.log(`🤖 ${agent} response:`, response.stop_reason);

    // 5. Loop de tool use
    let iterations = 0;
    const MAX_ITERATIONS = 10;

    while (response.stop_reason === "tool_use" && iterations < MAX_ITERATIONS) {
      iterations++;

      const toolUseBlocks = response.content.filter(
        (block) => block.type === "tool_use"
      ) as Anthropic.ToolUseBlock[];

      // Ejecutar tools
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        console.log(`   🔧 ${toolUse.name}`);
        const result = await executeTool(
          toolUse.name,
          toolUse.input as Record<string, any>
        );

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: result,
        });
      }

      // Agregar a la conversación
      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });

      // Siguiente llamada
      response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: agentPrompt,
        tools,
        messages,
      });

      console.log(`🤖 ${agent} response:`, response.stop_reason);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Multi-agent complete (${agent}) in ${duration}ms`);

    // 5. Guardar historial actualizado (mantener últimos 10 mensajes para no exceder límites)
    const recentMessages = messages.slice(-10);
    await saveConversationHistory(phoneNumber, recentMessages);
  } catch (error: any) {
    console.error("❌ Multi-agent error:", error.message);
    throw error;
  }
}
