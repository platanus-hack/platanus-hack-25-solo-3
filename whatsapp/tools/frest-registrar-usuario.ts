/**
 * Tool: frest_registrar_usuario
 * Registra un nuevo usuario en Frest sin contraseña
 */

import { z } from "zod";
import { frestClient } from "../clients/frest-client";
import { FrestApiException } from "../clients/frest-types";

export const frestRegistrarUsuarioTool = {
  name: "frest_registrar_usuario",
  description: `Registra un nuevo usuario en Frest sin contraseña.
El usuario recibirá un código de verificación por email.
Solo usar este tool si frest_buscar_usuario retornó que el usuario NO existe.`,
  input_schema: {
    type: "object" as const,
    properties: {
      nombre: {
        type: "string",
        description: "Nombre del usuario",
      },
      paterno: {
        type: "string",
        description: "Apellido paterno",
      },
      materno: {
        type: "string",
        description: "Apellido materno (opcional)",
      },
      email: {
        type: "string",
        description: "Email del usuario",
      },
      rut: {
        type: "string",
        description: "RUT del usuario en formato 12345678-9 (opcional)",
      },
      celular: {
        type: "string",
        description: "Número de celular con prefijo +56",
      },
    },
    required: ["nombre", "paterno", "email", "celular"],
  },
};

export async function executeFrestRegistrarUsuario(input: {
  nombre: string;
  paterno: string;
  materno?: string;
  email: string;
  rut?: string;
  celular: string;
}): Promise<string> {
  try {
    console.log(`📝 [Frest] Registrando nuevo usuario: ${input.nombre} ${input.paterno}`);

    const result = await frestClient.registrarUsuario({
      ...input,
      acepto_terminos: true, // El bot acepta términos automáticamente
    });

    console.log(`✅ [Frest] Usuario registrado: ${result.nombre_completo}`);

    return JSON.stringify({
      success: true,
      user_id: result.user_id,
      nombre_completo: result.nombre_completo,
      email: result.email,
      requiere_verificacion: result.requiere_verificacion,
      mensaje: result.requiere_verificacion
        ? `Usuario registrado exitosamente. Se ha enviado un código de verificación a ${result.email}.`
        : "Usuario registrado exitosamente.",
    });
  } catch (error) {
    if (error instanceof FrestApiException) {
      console.error(`❌ [Frest] Error al registrar usuario:`, error.errores);
      return JSON.stringify({
        success: false,
        error: error.errores.join(", "),
      });
    }

    console.error(`❌ [Frest] Error inesperado:`, error);
    return JSON.stringify({
      success: false,
      error: "Error inesperado al registrar usuario en Frest",
    });
  }
}

