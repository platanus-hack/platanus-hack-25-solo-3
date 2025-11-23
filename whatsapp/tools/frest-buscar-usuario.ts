/**
 * Tool: frest_buscar_usuario
 * Busca un usuario en Frest por su número de teléfono
 */

import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { frestClient } from "../clients/frest-client";
import { FrestApiException } from "../clients/frest-types";

// Execute function for backward compatibility with direct API client
export async function executeFrestBuscarUsuario(input: {
  telefono: string;
}): Promise<string> {
  const result = await frestBuscarUsuarioHandler(input);
  return result.content[0].text;
}

// Handler function used by both SDK and direct API
async function frestBuscarUsuarioHandler({ telefono }: { telefono: string }) {
  {
    try {
      console.log(`🔍 [Frest] Buscando usuario por teléfono: ${telefono}`);

      const result = await frestClient.buscarUsuarioPorTelefono(telefono);

      let resultData;
      if (result.encontrado && result.data) {
        const usuario = result.data;
        console.log(`✅ [Frest] Usuario encontrado: ${usuario.nombre_completo}`);

        resultData = {
          success: true,
          encontrado: true,
          usuario: {
            user_id: usuario.user_id,
            nombre_completo: usuario.nombre_completo,
            email: usuario.email,
            celular: usuario.celular,
            email_verificado: usuario.email_verificado,
            cantidad_pedidos: usuario.cantidad_pedidos,
            saldo: usuario.saldo,
          },
          direcciones: usuario.direcciones.map((dir) => ({
            direccion_id: dir.id,
            direccion_completa: dir.direccion_completa,
            comuna: dir.comuna,
            region: dir.region,
            zona_id: dir.zona_id,
            observaciones: dir.observaciones,
          })),
          mensaje: `Usuario encontrado: ${usuario.nombre_completo}. Tiene ${usuario.direcciones.length} dirección(es) guardada(s).`,
        };
      } else {
        console.log(`ℹ️  [Frest] Usuario NO encontrado: ${telefono}`);

        resultData = {
          success: true,
          encontrado: false,
          mensaje: "No hay un cliente registrado con ese número de teléfono en Frest.",
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(resultData),
          },
        ],
      };
    } catch (error) {
      let errorData;
      if (error instanceof FrestApiException) {
        console.error(`❌ [Frest] Error al buscar usuario:`, error.errores);
        errorData = {
          success: false,
          error: error.errores.join(", "),
        };
      } else {
        console.error(`❌ [Frest] Error inesperado:`, error);
        errorData = {
          success: false,
          error: "Error inesperado al buscar usuario en Frest",
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(errorData),
          },
        ],
      };
    }
  }
}

// SDK tool definition using the handler
export const frestBuscarUsuarioTool = tool(
  "frest_buscar_usuario",
  "Busca si existe un usuario registrado en Frest por su número de teléfono. " +
  "Retorna información completa del usuario incluyendo todas sus direcciones guardadas. " +
  "Este tool debe ser el PRIMERO en llamarse antes de intentar registrar un usuario.",
  {
    telefono: z.string().describe(
      "Número de teléfono en formato internacional SIN el símbolo +. Ejemplo: 56995545216"
    ),
  },
  frestBuscarUsuarioHandler
);

