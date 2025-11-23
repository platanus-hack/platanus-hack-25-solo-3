/**
 * Tool: frest_consultar_productos
 * Consulta productos en Frest con precios, stock y alternativas
 */

import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { frestClient } from "../clients/frest-client";
import { FrestApiException } from "../clients/frest-types";

// Execute function for backward compatibility with direct API client
export async function executeFrestConsultarProductos(input: {
  productos: string[];
  bodega_id?: number;
}): Promise<string> {
  const result = await frestConsultarProductosHandler(input);
  return result.content[0].text;
}

// Handler function used by both SDK and direct API
async function frestConsultarProductosHandler({ productos, bodega_id }: {
  productos: string[];
  bodega_id?: number;
}) {
  {
    try {
      console.log(`🛒 [Frest] Consultando ${productos.length} productos`);

      const result = await frestClient.consultarProductos(
        productos,
        bodega_id || 1
      );

      console.log(
        `✅ [Frest] Encontrados: ${result.resumen.total_encontrados}/${result.resumen.total_buscados} productos`
      );

      // Formatear productos encontrados
      const productosDisponibles = result.productos
        .filter((p) => p.disponible)
        .map((p) => ({
          producto_id: p.producto_id,
          nombre: p.nombre,
          unidad: p.unidad,
          precio: p.precio,
          stock: p.stock_disponible,
          imagen: p.imagen,
        }));

      const productosSinStock = result.productos
        .filter((p) => !p.disponible)
        .map((p) => ({
          producto_id: p.producto_id,
          nombre: p.nombre,
          unidad: p.unidad,
          precio: p.precio,
          stock: 0,
        }));

      // Formatear productos no encontrados con alternativas
      const noEncontrados = result.no_encontrados.map((ne) => ({
        buscado: ne.buscado,
        alternativas: ne.alternativas.map((alt) => ({
          producto_id: alt.producto_id,
          nombre: alt.nombre,
          precio: alt.precio,
          stock: alt.stock_disponible,
        })),
      }));

      const resultData = {
        success: true,
        productos_disponibles: productosDisponibles,
        productos_sin_stock: productosSinStock,
        no_encontrados: noEncontrados,
        resumen: {
          total_buscados: result.resumen.total_buscados,
          total_encontrados: result.resumen.total_encontrados,
          total_disponibles: result.resumen.total_disponibles,
        },
        mensaje: `Se encontraron ${result.resumen.total_disponibles} productos disponibles de ${result.resumen.total_buscados} buscados.`,
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
        console.error(`❌ [Frest] Error al consultar productos:`, error.errores);
        errorData = {
          success: false,
          error: error.errores.join(", "),
        };
      } else {
        console.error(`❌ [Frest] Error inesperado:`, error);
        errorData = {
          success: false,
          error: "Error inesperado al consultar productos en Frest",
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
export const frestConsultarProductosTool = tool(
  "frest_consultar_productos",
  "Busca productos en el catálogo de Frest por nombre. " +
  "Retorna precios en tiempo real (ya con ofertas incluidas), stock disponible y sugiere alternativas si no están disponibles. " +
  "Usa este tool cuando el usuario tiene una lista de compras lista.",
  {
    productos: z.array(z.string()).describe(
      "Array de nombres de productos a buscar (ej: ['Tomate', 'Lechuga', 'Palta Hass'])"
    ),
    bodega_id: z.number().optional().describe(
      "ID de la bodega/tienda (opcional, default: 1 para Centro de Distribución)"
    ),
  },
  frestConsultarProductosHandler
);

