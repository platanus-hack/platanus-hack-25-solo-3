/**
 * Tool: frest_crear_pedido
 * Crea un pedido completo en Frest y genera link de pago
 */

import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { frestClient } from "../clients/frest-client";
import {
  FrestApiException,
  TipoPedido,
  FormaPago,
} from "../clients/frest-types";

// Execute function for backward compatibility with direct API client
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
  const result = await frestCrearPedidoHandler(input);
  return result.content[0].text;
}

// Handler function used by both SDK and direct API
async function frestCrearPedidoHandler({ user_id, direccion_id, ventana_id, bodega_id, tipo_pedido_id, forma_pago, items, observaciones, codigo_descuento }: {
  user_id: number;
  direccion_id: number;
  ventana_id: number;
  bodega_id: number;
  tipo_pedido_id: number;
  forma_pago: string;
  items: Array<{ producto_id: number; cantidad: number }>;
  observaciones?: string;
  codigo_descuento?: string;
}) {
  {
    try {
      console.log(
        `🛍️  [Frest] Creando pedido para usuario ${user_id} con ${items.length} productos`
      );

      const result = await frestClient.crearPedido({
        user_id,
        direccion_id,
        ventana_id,
        bodega_id,
        tipo_pedido_id: tipo_pedido_id as TipoPedido,
        forma_pago: forma_pago as FormaPago,
        items,
        observaciones,
        codigo_descuento,
      });

      console.log(`✅ [Frest] Pedido creado: ${result.codigo_pedido}`);

      const resultData = {
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
        console.error(`❌ [Frest] Error al crear pedido:`, error.errores);
        errorData = {
          success: false,
          error: error.errores.join(", "),
        };
      } else {
        console.error(`❌ [Frest] Error inesperado:`, error);
        errorData = {
          success: false,
          error: "Error inesperado al crear pedido en Frest",
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
export const frestCrearPedidoTool = tool(
  "frest_crear_pedido",
  "Crea un pedido completo en Frest y genera el link de pago. " +
  "Los precios se calculan automáticamente según las ofertas vigentes. " +
  "IMPORTANTE: Solo envía producto_id y cantidad en los items, NO incluyas el precio.",
  {
    user_id: z.number().describe("ID del usuario en Frest"),
    direccion_id: z.number().describe("ID de la dirección de despacho"),
    ventana_id: z.number().describe(
      "ID de la ventana de despacho (pregunta al usuario cuándo quiere recibir)"
    ),
    bodega_id: z.number().describe("ID de la bodega (default: 1 para Centro de Distribución)"),
    tipo_pedido_id: z.number().describe("1=Despacho a domicilio, 2=Retiro en tienda, 3=Retiro express"),
    forma_pago: z.enum(["webpay", "fpay", "oneclick", "efectivo"]).describe(
      "Método de pago: webpay, fpay, oneclick, efectivo"
    ),
    items: z.array(
      z.object({
        producto_id: z.number().describe("ID del producto"),
        cantidad: z.number().describe("Cantidad a ordenar"),
      })
    ).describe("Array de productos (solo producto_id y cantidad, NO incluir precio)"),
    observaciones: z.string().optional().describe("Instrucciones adicionales para el pedido (opcional)"),
    codigo_descuento: z.string().optional().describe("Código de descuento (opcional)"),
  },
  frestCrearPedidoHandler
);

