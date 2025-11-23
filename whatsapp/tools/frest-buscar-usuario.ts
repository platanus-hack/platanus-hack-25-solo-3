/**
 * Tool: frest_buscar_usuario
 * Busca un usuario en Frest por su número de teléfono
 */

import { z } from "zod";
import { frestClient } from "../clients/frest-client";
import { FrestApiException } from "../clients/frest-types";

export const frestBuscarUsuarioTool = {
  name: "frest_buscar_usuario",
  description: `Busca si existe un usuario registrado en Frest por su número de teléfono.
Retorna información completa del usuario incluyendo todas sus direcciones guardadas.
Este tool debe ser el PRIMERO en llamarse antes de intentar registrar un usuario.`,
  input_schema: {
    type: "object" as const,
    properties: {
      telefono: {
        type: "string",
        description:
          "Número de teléfono en formato internacional SIN el símbolo +. Ejemplo: 56995545216",
      },
    },
    required: ["telefono"],
  },
};

export async function executeFrestBuscarUsuario(input: {
  telefono: string;
}): Promise<string> {
  try {
    console.log(`🔍 [Frest] Buscando usuario por teléfono: ${input.telefono}`);

    const result = await frestClient.buscarUsuarioPorTelefono(input.telefono);

    if (result.encontrado && result.data) {
      const usuario = result.data;
      console.log(`✅ [Frest] Usuario encontrado: ${usuario.nombre_completo}`);

      return JSON.stringify({
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
      });
    } else {
      console.log(`ℹ️  [Frest] Usuario NO encontrado: ${input.telefono}`);

      return JSON.stringify({
        success: true,
        encontrado: false,
        mensaje: "No hay un cliente registrado con ese número de teléfono en Frest.",
      });
    }
  } catch (error) {
    if (error instanceof FrestApiException) {
      console.error(`❌ [Frest] Error al buscar usuario:`, error.errores);
      return JSON.stringify({
        success: false,
        error: error.errores.join(", "),
      });
    }

    console.error(`❌ [Frest] Error inesperado:`, error);
    return JSON.stringify({
      success: false,
      error: "Error inesperado al buscar usuario en Frest",
    });
  }
}

