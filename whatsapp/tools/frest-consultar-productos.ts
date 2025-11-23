/**
 * Tool: frest_consultar_productos
 * Consulta productos en Frest con precios, stock y alternativas
 */

import { z } from "zod";
import { frestClient } from "../clients/frest-client.js";
import { FrestApiException } from "../clients/frest-types.js";

export const frestConsultarProductosTool = {
  name: "frest_consultar_productos",
  description: `Busca productos en el catálogo de Frest por nombre.
Retorna precios en tiempo real (ya con ofertas incluidas), stock disponible y sugiere alternativas si no están disponibles.
Usa este tool cuando el usuario tiene una lista de compras lista.`,
  input_schema: {
    type: "object" as const,
    properties: {
      productos: {
        type: "array",
        items: {
          type: "string",
        },
        description:
          "Array de nombres de productos a buscar (ej: ['Tomate', 'Lechuga', 'Palta Hass'])",
      },
      bodega_id: {
        type: "number",
        description:
          "ID de la bodega/tienda (opcional, default: 1 para Centro de Distribución)",
      },
    },
    required: ["productos"],
  },
};

export async function executeFrestConsultarProductos(input: {
  productos: string[];
  bodega_id?: number;
}): Promise<string> {
  try {
    console.log(`🛒 [Frest] Consultando ${input.productos.length} productos`);

    const result = await frestClient.consultarProductos(
      input.productos,
      input.bodega_id || 1
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

    return JSON.stringify({
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
    });
  } catch (error) {
    if (error instanceof FrestApiException) {
      console.error(`❌ [Frest] Error al consultar productos:`, error.errores);
      return JSON.stringify({
        success: false,
        error: error.errores.join(", "),
      });
    }

    console.error(`❌ [Frest] Error inesperado:`, error);
    return JSON.stringify({
      success: false,
      error: "Error inesperado al consultar productos en Frest",
    });
  }
}

