/**
 * Tool: frest_crear_direccion
 * Crea una dirección de despacho para un usuario en Frest
 */

import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { frestClient } from "../clients/frest-client";
import { FrestApiException } from "../clients/frest-types";

// Execute function for backward compatibility with direct API client
export async function executeFrestCrearDireccion(input: {
  user_id: number;
  calle: string;
  numero: string;
  depto?: string;
  comuna: string;
  region: string;
  coordenadas?: string;
  observaciones?: string;
}): Promise<string> {
  const result = await frestCrearDireccionHandler(input);
  return result.content[0].text;
}

// Handler function used by both SDK and direct API
async function frestCrearDireccionHandler({ user_id, calle, numero, depto, comuna, region, coordenadas, observaciones }: {
  user_id: number;
  calle: string;
  numero: string;
  depto?: string;
  comuna: string;
  region: string;
  coordenadas?: string;
  observaciones?: string;
}) {
  {
    try {
      console.log(
        `📍 [Frest] Creando dirección para usuario ${user_id}: ${calle} ${numero}, ${comuna}`
      );

      const result = await frestClient.crearDireccion(user_id, {
        calle,
        numero,
        depto,
        comuna,
        region,
        coordenadas,
        observaciones,
      });

      console.log(`✅ [Frest] Dirección creada: ${result.direccion_completa}`);

      const resultData = {
        success: true,
        direccion_id: result.direccion_id,
        zona_id: result.zona_id,
        direccion_completa: result.direccion_completa,
        es_valida: result.es_valida,
        mensaje: result.mensaje,
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
        console.error(`❌ [Frest] Error al crear dirección:`, error.errores);
        errorData = {
          success: false,
          error: error.errores.join(", "),
        };
      } else {
        console.error(`❌ [Frest] Error inesperado:`, error);
        errorData = {
          success: false,
          error: "Error inesperado al crear dirección en Frest",
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
export const frestCrearDireccionTool = tool(
  "frest_crear_direccion",
  "Crea una nueva dirección de despacho para un usuario existente en Frest. " +
  "Determina automáticamente la zona de despacho según la ubicación.",
  {
    user_id: z.number().describe("ID del usuario en Frest"),
    calle: z.string().describe("Nombre de la calle"),
    numero: z.string().describe("Número de la dirección"),
    depto: z.string().optional().describe("Número de departamento u oficina (opcional)"),
    comuna: z.string().describe("Comuna (ej: Providencia, Las Condes)"),
    region: z.string().describe("Región (ej: Región Metropolitana)"),
    coordenadas: z.string().optional().describe('Coordenadas en formato "latitud,longitud" (opcional)'),
    observaciones: z.string().optional().describe(
      "Instrucciones adicionales para el despacho (ej: edificio azul, tocar timbre 402)"
    ),
  },
  frestCrearDireccionHandler
);

