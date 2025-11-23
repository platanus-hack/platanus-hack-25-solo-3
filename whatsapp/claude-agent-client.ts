// Cliente usando Claude Agent SDK oficial con arquitectura Multi-Agente
import { query, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { ANTHROPIC_API_KEY } from "./secrets";
import { db } from "./db";
import {
  sendWhatsAppMessageTool,
  getUserContextTool,
  createHouseholdTool,
  addHouseholdMembersTool,
  saveConversationStateTool,
  sendReactionTool,
  generateRecipeImageTool,
  frestBuscarUsuarioTool,
  frestRegistrarUsuarioTool,
  frestCrearDireccionTool,
  frestConsultarProductosTool,
  frestCrearPedidoTool,
  frestConsultarEstadoPedidoTool,
} from "./tools";
import { PLANEAT_AGENTS, routerPrompt } from "./agents";

// Asegurar que el PATH incluya node para que el Agent SDK funcione
if (!process.env.PATH?.includes("/usr/local/bin")) {
  process.env.PATH = `${process.env.PATH}:/usr/local/bin:/usr/bin:/bin`;
}

// Crear el servidor MCP con todas las tools (incluidas las de Frest)
const planeatServer = createSdkMcpServer({
  name: "planeat",
  version: "1.0.0",
  tools: [
    // Herramientas básicas de PlanEat
    sendWhatsAppMessageTool,
    getUserContextTool,
    createHouseholdTool,
    addHouseholdMembersTool,
    saveConversationStateTool,
    sendReactionTool,
    generateRecipeImageTool,
    // Herramientas de Frest E-commerce
    frestBuscarUsuarioTool,
    frestRegistrarUsuarioTool,
    frestCrearDireccionTool,
    frestConsultarProductosTool,
    frestCrearPedidoTool,
    frestConsultarEstadoPedidoTool,
  ],
});

// Obtener o crear sesión para el usuario
async function getOrCreateSession(
  phoneNumber: string
): Promise<{ sessionId: string | undefined; isNew: boolean }> {
  try {
    // PRIMERO: Verificar si el usuario existe en la base de datos
    const userExists = await db.queryRow`
      SELECT phone_number FROM users WHERE phone_number = ${phoneNumber}
    `;

    // Si el usuario NO existe, SIEMPRE iniciar nueva sesión (no reanudar cache anterior)
    if (!userExists) {
      console.log("🆕 New user - Starting fresh session");
      return { sessionId: undefined, isNew: true };
    }

    // Si el usuario existe, buscar sesión activa reciente (últimas 2 horas)
    const conversation = await db.queryRow`
      SELECT session_id, last_message_at
      FROM conversations
      WHERE phone_number = ${phoneNumber}
        AND last_message_at > NOW() - INTERVAL '2 hours'
      ORDER BY last_message_at DESC
      LIMIT 1
    `;

    if (conversation?.session_id) {
      console.log(`📝 Resuming session: ${conversation.session_id}`);
      return { sessionId: conversation.session_id, isNew: false };
    }

    console.log("🆕 Starting new session for existing user");
    return { sessionId: undefined, isNew: true };
  } catch (error) {
    console.error("❌ Error getting session:", error);
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

// Procesar mensaje con Claude Agent SDK (Arquitectura Multi-Agente)
export async function processWithAgentSDK(
  userMessage: string,
  phoneNumber: string,
  messageId?: string
): Promise<void> {
  console.log("🤖 Using Multi-Agent SDK");

  // Obtener sesión previa si existe
  const { sessionId: existingSessionId } = await getOrCreateSession(phoneNumber);

  // Prompt simple y directo para el router
  const prompt = `Usuario ${phoneNumber} dice: "${userMessage}"`;

  try {
    // Configurar API key
    process.env.ANTHROPIC_API_KEY = ANTHROPIC_API_KEY();

    // Configuración Multi-Agente optimizada
    const maxTurns = 10; // Reducido de 15 a 10 para mejor rendimiento
    const timeoutMs = 60000; // Aumentado a 60 segundos
    
    console.log("🎯 Multi-Agent Configuration:");
    console.log(`   Router Model: claude-haiku-4-5-20251001 (fast routing)`);
    console.log(`   Subagents: ${Object.keys(PLANEAT_AGENTS).join(", ")}`);
    console.log(`   Max Turns: ${maxTurns}`);
    console.log(`   Timeout: ${timeoutMs/1000}s`);
    console.log(`   Session: ${existingSessionId || "New"}`);

    const queryOptions: any = {
      systemPrompt: routerPrompt,
      model: "claude-haiku-4-5-20251001", // Haiku para routing rápido y económico
      maxTurns,
      agents: PLANEAT_AGENTS, // Multi-agent architecture
      mcpServers: { planeat: planeatServer },
      permissionMode: "bypassPermissions",
      // Optimizaciones de rendimiento
      includePartialMessages: false, // No incluir mensajes parciales
      settingSources: [], // No cargar settings del filesystem para mayor velocidad
    };

    // Reanudar sesión si existe
    if (existingSessionId) {
      queryOptions.resume = existingSessionId;
    }

    let currentSessionId: string | undefined = existingSessionId;

    // Timeout
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout (${timeoutMs/1000}s)`)), timeoutMs);
    });

    // Ejecutar query multi-agente
    const queryPromise = (async () => {
      for await (const message of query({ prompt, options: queryOptions })) {
        // Capturar session_id
        if ("session_id" in message && message.session_id) {
          currentSessionId = message.session_id;
        }

        // Logging simplificado
        if (message.type === "system") {
          console.log("⚙️  System initialized");
        } else if (message.type === "assistant") {
          const content = message.message?.content || [];
          const hasTask = content.some((c: any) => 
            c.type === 'tool_use' && c.name === 'Task'
          );
          const toolUses = content.filter((c: any) => c.type === 'tool_use');
          
          if (hasTask) {
            const taskTool = content.find((c: any) => c.name === 'Task');
            const subagent = (taskTool as any)?.input?.subagent_type || 'unknown';
            console.log(`🔀 Delegating to: ${subagent}`);
          } else if (toolUses.length > 0) {
            const toolNames = toolUses.map((c: any) => 
              c.name.replace('mcp__planeat__', '')
            );
            console.log(`🔧 Tools: ${toolNames.join(", ")}`);
          }
        } else if (message.type === "result") {
          console.log("✅ Completed");
          console.log(`   ${message.duration_ms}ms | ${message.num_turns} turns | $${message.total_cost_usd.toFixed(4)}`);
          break;
        }
      }
    })();

    await Promise.race([queryPromise, timeout]);

    // Guardar session_id
    if (currentSessionId && currentSessionId !== existingSessionId) {
      await saveSession(phoneNumber, currentSessionId);
    }

    console.log("✅ Multi-agent processing complete");
  } catch (error: any) {
    console.error("❌ Multi-agent error:", error.message);
    throw error;
  }
}
