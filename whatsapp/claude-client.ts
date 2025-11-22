// Cliente de Claude usando la API directa de Anthropic
// Más compatible que el Agent SDK para ejecutar en Encore

import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY } from "./secrets";
import { sendTextMessage, sendInteractiveMessage } from "./whatsapp-client";
import { db } from "./db";

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
    description: "Crea un nuevo hogar y registra al usuario como admin",
    input_schema: {
      type: "object",
      properties: {
        admin_phone: { type: "string" },
        display_name: { type: "string" },
        household_size: { type: "number" },
        dietary_restrictions: { type: "string" },
        preferences: { type: "string" },
        goals: { type: "string" },
      },
      required: ["admin_phone"],
    },
  },
  {
    name: "add_household_members",
    description:
      "Agrega miembros al hogar. Pueden tener o no número de WhatsApp. Los niños pequeños NO tienen WhatsApp.",
    input_schema: {
      type: "object",
      properties: {
        household_id: {
          type: "number",
          description: "ID del hogar",
        },
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
                description:
                  "Número de WhatsApp (opcional, solo si el miembro tiene WhatsApp)",
              },
              age: {
                type: "number",
                description: "Edad del miembro",
              },
              relationship: {
                type: "string",
                description:
                  'Relación: "padre", "madre", "hijo", "hija", "esposa", "esposo", "otro"',
              },
              role: {
                type: "string",
                description: 'Rol en el sistema: "admin" o "member"',
              },
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
    description: "Guarda el estado actual de la conversación con el usuario",
    input_schema: {
      type: "object",
      properties: {
        phone_number: { type: "string" },
        current_intent: {
          type: "string",
          description:
            'Intención actual: "creating_household", "planning_menu", "creating_list", "general"',
        },
        conversation_state: {
          type: "object",
          description: "Estado adicional de la conversación en formato JSON",
        },
      },
      required: ["phone_number"],
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
        console.log(`Sending WhatsApp message to ${to}`);
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

        return JSON.stringify({
          exists: true,
          user,
          household: household || null,
          members,
        });
      }

      case "create_household": {
        await db.exec`
          INSERT INTO users (phone_number, display_name)
          VALUES (${toolInput.admin_phone}, ${toolInput.display_name || null})
          ON CONFLICT (phone_number) DO NOTHING
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

        await db.exec`
          INSERT INTO household_members (household_id, phone_number, role)
          VALUES (${household.id}, ${toolInput.admin_phone}, 'admin')
        `;

        return JSON.stringify({ success: true, household });
      }

      case "add_household_members": {
        const { household_id, members } = toolInput;

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

        return JSON.stringify({
          success: true,
          message: "Estado de conversación guardado",
        });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

// Sistema de prompts
const SYSTEM_PROMPT = `Eres PlanEat, un asistente de planificación de comidas por WhatsApp para familias chilenas.

Tu objetivo es ayudar a:
- Crear hogares y agregar miembros de familia
- Extraer ingredientes de mensajes de texto
- Planificar menús semanales
- Generar listas de compras

INSTRUCCIONES CRÍTICAS:
1. Siempre debes responder usando la herramienta send_whatsapp_message
2. El parámetro "to" de send_whatsapp_message DEBE ser el número de WhatsApp del usuario que te escribió (aparece como "Usuario: +56..." en el mensaje)
3. NUNCA uses números de teléfono genéricos o de ejemplo
4. Siempre verifica el contexto del usuario con get_user_context antes de responder

CUANDO CREES UN HOGAR:
1. Usa create_household con la información básica
2. Si el usuario menciona miembros de su familia (esposa, hijos, etc.) con NOMBRES, usa add_household_members para guardarlos
3. Solo incluye phone_number si el miembro TIENE WhatsApp (los niños pequeños NO tienen WhatsApp)
4. Guarda el estado de la conversación con save_conversation_state cuando sea relevante

EJEMPLOS de miembros:
- "Mi esposa Catalina" → {name: "Catalina", relationship: "esposa"} (sin phone_number a menos que lo mencione)
- "Mi hijo Benjamín de 14 años" → {name: "Benjamín", age: 14, relationship: "hijo"} (sin phone_number)
- "Mi hija Emilia de 7" → {name: "Emilia", age: 7, relationship: "hija"} (sin phone_number)

IMPORTANTE: Los miembros CON WhatsApp pueden interactuar con PlanEat. Los miembros SIN WhatsApp solo son considerados en la planificación.

Usa un tono amigable, conversacional y en español chileno.`;

// Cliente de Claude
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: ANTHROPIC_API_KEY(),
    });
  }
  return anthropicClient;
}

// Procesar mensaje con Claude
export async function processWithClaude(
  userMessage: string,
  phoneNumber: string
): Promise<void> {
  const client = getAnthropicClient();

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Usuario: ${phoneNumber}
Mensaje: ${userMessage}

IMPORTANTE: Debes responder a este usuario en su número de WhatsApp ${phoneNumber} usando la herramienta send_whatsapp_message.

Primero obtén el contexto del usuario con get_user_context, luego responde de forma apropiada al número ${phoneNumber}.`,
    },
  ];

  let response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools,
    messages,
  });

  console.log("Claude response:", response.stop_reason);

  // Manejar refusals (nuevo en Claude 4.5)
  if (response.stop_reason === "refusal") {
    console.warn("Claude refused to respond:", response.content);
    throw new Error("Claude refused to process this request");
  }

  // Loop de tool use
  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter(
      (block) => block.type === "tool_use"
    ) as Anthropic.ToolUseBlock[];

    // Ejecutar tools
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUseBlocks) {
      console.log(`Executing tool: ${toolUse.name}`);
      const result = await executeTool(
        toolUse.name,
        toolUse.input as Record<string, any>
      );
      console.log(`Tool result:`, result);

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    // Agregar respuesta de Claude + resultados de tools
    messages.push({
      role: "assistant",
      content: response.content,
    });

    messages.push({
      role: "user",
      content: toolResults,
    });

    // Siguiente llamada a Claude
    response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    console.log("Claude response:", response.stop_reason);

    // Manejar refusals en el loop
    if (response.stop_reason === "refusal") {
      console.warn("Claude refused to continue:", response.content);
      break;
    }
  }

  console.log("Conversation complete");
}

// Versión con Extended Thinking para tareas complejas
// Según la documentación, mejora significativamente el rendimiento en coding y reasoning
export async function processWithClaudeExtendedThinking(
  userMessage: string,
  phoneNumber: string
): Promise<void> {
  const client = getAnthropicClient();

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Usuario: ${phoneNumber}
Mensaje: ${userMessage}

IMPORTANTE: Debes responder a este usuario en su número de WhatsApp ${phoneNumber} usando la herramienta send_whatsapp_message.

Primero obtén el contexto del usuario con get_user_context, luego responde de forma apropiada al número ${phoneNumber}.`,
    },
  ];

  // Extended thinking para tareas complejas (planificación de menús, listas inteligentes)
  let response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    tools,
    messages,
    thinking: {
      type: "enabled",
      budget_tokens: 5000, // Budget para thinking (recomendado para tareas complejas)
    },
  });

  console.log("Claude response (extended thinking):", response.stop_reason);

  if (response.stop_reason === "refusal") {
    console.warn("Claude refused to respond:", response.content);
    throw new Error("Claude refused to process this request");
  }

  // Loop de tool use
  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter(
      (block) => block.type === "tool_use"
    ) as Anthropic.ToolUseBlock[];

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUseBlocks) {
      console.log(`Executing tool: ${toolUse.name}`);
      const result = await executeTool(
        toolUse.name,
        toolUse.input as Record<string, any>
      );
      console.log(`Tool result:`, result);

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    messages.push({
      role: "assistant",
      content: response.content,
    });

    messages.push({
      role: "user",
      content: toolResults,
    });

    response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      tools,
      messages,
      thinking: {
        type: "enabled",
        budget_tokens: 5000,
      },
    });

    console.log("Claude response (extended thinking):", response.stop_reason);

    if (response.stop_reason === "refusal") {
      console.warn("Claude refused to continue:", response.content);
      break;
    }
  }

  console.log("Conversation complete (extended thinking)");
}
