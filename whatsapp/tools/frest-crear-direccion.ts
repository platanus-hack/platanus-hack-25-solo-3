/**
 * Tool: frest_crear_direccion
 * Crea una dirección de despacho para un usuario en Frest
 */

import { z } from "zod";
import { frestClient } from "../clients/frest-client.js";
import { FrestApiException } from "../clients/frest-types.js";

export const frestCrearDireccionTool = {
  name: "frest_crear_direccion",
  description: `Crea una nueva dirección de despacho para un usuario existente en Frest.
Determina automáticamente la zona de despacho según la ubicación.`,
  input_schema: {
    type: "object" as const,
    properties: {
      user_id: {
        type: "number",
        description: "ID del usuario en Frest",
      },
      calle: {
        type: "string",
        description: "Nombre de la calle",
      },
      numero: {
        type: "string",
        description: "Número de la dirección",
      },
      depto: {
        type: "string",
        description: "Número de departamento u oficina (opcional)",
      },
      comuna: {
        type: "string",
        description: "Comuna (ej: Providencia, Las Condes)",
      },
      region: {
        type: "string",
        description: "Región (ej: Región Metropolitana)",
      },
      coordenadas: {
        type: "string",
        description: 'Coordenadas en formato "latitud,longitud" (opcional)',
      },
      observaciones: {
        type: "string",
        description:
          "Instrucciones adicionales para el despacho (ej: edificio azul, tocar timbre 402)",
      },
    },
    required: ["user_id", "calle", "numero", "comuna", "region"],
  },
};

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
  try {
    console.log(
      `📍 [Frest] Creando dirección para usuario ${input.user_id}: ${input.calle} ${input.numero}, ${input.comuna}`
    );

    const { user_id, ...direccionData } = input;

    const result = await frestClient.crearDireccion(user_id, direccionData);

    console.log(`✅ [Frest] Dirección creada: ${result.direccion_completa}`);

    return JSON.stringify({
      success: true,
      direccion_id: result.direccion_id,
      zona_id: result.zona_id,
      direccion_completa: result.direccion_completa,
      es_valida: result.es_valida,
      mensaje: result.mensaje,
    });
  } catch (error) {
    if (error instanceof FrestApiException) {
      console.error(`❌ [Frest] Error al crear dirección:`, error.errores);
      return JSON.stringify({
        success: false,
        error: error.errores.join(", "),
      });
    }

    console.error(`❌ [Frest] Error inesperado:`, error);
    return JSON.stringify({
      success: false,
      error: "Error inesperado al crear dirección en Frest",
    });
  }
}

