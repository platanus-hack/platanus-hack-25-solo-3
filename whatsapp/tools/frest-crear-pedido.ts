/**
 * Tool: frest_crear_pedido
 * Crea un pedido completo en Frest y genera link de pago
 */

import { z } from "zod";
import { frestClient } from "../clients/frest-client.js";
import {
  FrestApiException,
  TipoPedido,
  FormaPago,
} from "../clients/frest-types.js";

export const frestCrearPedidoTool = {
  name: "frest_crear_pedido",
  description: `Crea un pedido completo en Frest y genera el link de pago.
Los precios se calculan automáticamente según las ofertas vigentes.
IMPORTANTE: Solo envía producto_id y cantidad en los items, NO incluyas el precio.`,
  input_schema: {
    type: "object" as const,
    properties: {
      user_id: {
        type: "number",
        description: "ID del usuario en Frest",
      },
      direccion_id: {
        type: "number",
        description: "ID de la dirección de despacho",
      },
      ventana_id: {
        type: "number",
        description:
          "ID de la ventana de despacho (pregunta al usuario cuándo quiere recibir)",
      },
      bodega_id: {
        type: "number",
        description: "ID de la bodega (default: 1 para Centro de Distribución)",
      },
      tipo_pedido_id: {
        type: "number",
        description: "1=Despacho a domicilio, 2=Retiro en tienda, 3=Retiro express",
      },
      forma_pago: {
        type: "string",
        enum: ["webpay", "fpay", "oneclick", "efectivo"],
        description: "Método de pago: webpay, fpay, oneclick, efectivo",
      },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            producto_id: {
              type: "number",
              description: "ID del producto",
            },
            cantidad: {
              type: "number",
              description: "Cantidad a ordenar",
            },
          },
          required: ["producto_id", "cantidad"],
        },
        description:
          "Array de productos (solo producto_id y cantidad, NO incluir precio)",
      },
      observaciones: {
        type: "string",
        description: "Instrucciones adicionales para el pedido (opcional)",
      },
      codigo_descuento: {
        type: "string",
        description: "Código de descuento (opcional)",
      },
    },
    required: [
      "user_id",
      "direccion_id",
      "ventana_id",
      "bodega_id",
      "tipo_pedido_id",
      "forma_pago",
      "items",
    ],
  },
};

export async function executeFrestCrearPedido(input: {
  user_id: number;
  direccion_id: number;
  ventana_id: number;
  bodega_id: number;
  tipo_pedido_id: number;
  forma_pago: string;
  items: Array<{ producto_id: number; cantidad: number }>;
  observaciones?: string;
  codigo_descuento?: string;
}): Promise<string> {
  try {
    console.log(
      `🛍️  [Frest] Creando pedido para usuario ${input.user_id} con ${input.items.length} productos`
    );

    const result = await frestClient.crearPedido({
      user_id: input.user_id,
      direccion_id: input.direccion_id,
      ventana_id: input.ventana_id,
      bodega_id: input.bodega_id,
      tipo_pedido_id: input.tipo_pedido_id as TipoPedido,
      forma_pago: input.forma_pago as FormaPago,
      items: input.items,
      observaciones: input.observaciones,
      codigo_descuento: input.codigo_descuento,
    });

    console.log(`✅ [Frest] Pedido creado: ${result.codigo_pedido}`);

    return JSON.stringify({
      success: true,
      pedido_id: result.pedido_id,
      codigo_pedido: result.codigo_pedido,
      total: result.total,
      subtotal: result.subtotal,
      despacho: result.despacho,
      descuento: result.descuento,
      forma_pago: result.forma_pago,
      payment_link: result.payment_link,
      estado: result.estado,
      estado_pago: result.estado_pago,
      expires_at: result.expires_at,
      mensaje: `Pedido ${result.codigo_pedido} creado exitosamente. Total: $${result.total}. Link de pago generado.`,
    });
  } catch (error) {
    if (error instanceof FrestApiException) {
      console.error(`❌ [Frest] Error al crear pedido:`, error.errores);
      return JSON.stringify({
        success: false,
        error: error.errores.join(", "),
      });
    }

    console.error(`❌ [Frest] Error inesperado:`, error);
    return JSON.stringify({
      success: false,
      error: "Error inesperado al crear pedido en Frest",
    });
  }
}

