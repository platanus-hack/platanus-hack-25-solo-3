/**
 * Tool: frest_consultar_estado_pedido
 * Consulta el estado actual de un pedido en Frest
 */

import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { frestClient } from "../clients/frest-client";
import { FrestApiException } from "../clients/frest-types";

// Execute function for backward compatibility with direct API client
export async function executeFrestConsultarEstadoPedido(input: {
  pedido_id: number;
}): Promise<string> {
  const result = await frestConsultarEstadoPedidoHandler(input);
  return result.content[0].text;
}

// Handler function used by both SDK and direct API
async function frestConsultarEstadoPedidoHandler({ pedido_id }: {
  pedido_id: number;
}) {
  {
    try {
      console.log(`📦 [Frest] Consultando estado del pedido ${pedido_id}`);

      const result = await frestClient.consultarEstadoPedido(pedido_id);

      console.log(`✅ [Frest] Estado del pedido ${result.codigo}: ${result.estado}`);

      const resultData = {
        success: true,
        pedido_id: result.pedido_id,
        codigo: result.codigo,
        estado: result.estado,
        estado_pago: result.estado_pago,
        total: result.total,
        fecha_creacion: result.fecha_creacion,
        fecha_ventana: result.fecha_ventana,
        tracking: result.tracking_info
          ? {
              repartidor: result.tracking_info.repartidor,
              ruta_id: result.tracking_info.ruta_id,
              estado_ruta: result.tracking_info.estado_ruta,
            }
          : null,
        mensaje: `Pedido ${result.codigo}: Estado=${result.estado}, Pago=${result.estado_pago}`,
      };

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
        console.error(`❌ [Frest] Error al consultar estado:`, error.errores);
        errorData = {
          success: false,
          error: error.errores.join(", "),
        };
      } else {
        console.error(`❌ [Frest] Error inesperado:`, error);
        errorData = {
          success: false,
          error: "Error inesperado al consultar estado del pedido en Frest",
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
export const frestConsultarEstadoPedidoTool = tool(
  "frest_consultar_estado_pedido",
  "Consulta el estado actual de un pedido en Frest. " +
  "Retorna información sobre el estado del pedido, pago y tracking del repartidor si está disponible.",
  {
    pedido_id: z.number().describe("ID del pedido en Frest"),
  },
  frestConsultarEstadoPedidoHandler
);

