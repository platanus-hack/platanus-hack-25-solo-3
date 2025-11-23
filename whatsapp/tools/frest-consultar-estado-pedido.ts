/**
 * Tool: frest_consultar_estado_pedido
 * Consulta el estado actual de un pedido en Frest
 */

import { z } from "zod";
import { frestClient } from "../clients/frest-client";
import { FrestApiException } from "../clients/frest-types";

export const frestConsultarEstadoPedidoTool = {
  name: "frest_consultar_estado_pedido",
  description: `Consulta el estado actual de un pedido en Frest.
Retorna información sobre el estado del pedido, pago y tracking del repartidor si está disponible.`,
  input_schema: {
    type: "object" as const,
    properties: {
      pedido_id: {
        type: "number",
        description: "ID del pedido en Frest",
      },
    },
    required: ["pedido_id"],
  },
};

export async function executeFrestConsultarEstadoPedido(input: {
  pedido_id: number;
}): Promise<string> {
  try {
    console.log(`📦 [Frest] Consultando estado del pedido ${input.pedido_id}`);

    const result = await frestClient.consultarEstadoPedido(input.pedido_id);

    console.log(`✅ [Frest] Estado del pedido ${result.codigo}: ${result.estado}`);

    return JSON.stringify({
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
    });
  } catch (error) {
    if (error instanceof FrestApiException) {
      console.error(`❌ [Frest] Error al consultar estado:`, error.errores);
      return JSON.stringify({
        success: false,
        error: error.errores.join(", "),
      });
    }

    console.error(`❌ [Frest] Error inesperado:`, error);
    return JSON.stringify({
      success: false,
      error: "Error inesperado al consultar estado del pedido en Frest",
    });
  }
}

