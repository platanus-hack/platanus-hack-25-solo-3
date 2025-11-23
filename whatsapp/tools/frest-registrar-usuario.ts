/**
 * Tool: frest_registrar_usuario
 * Registra un nuevo usuario en Frest sin contraseña
 */

import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { frestClient } from "../clients/frest-client";
import { FrestApiException } from "../clients/frest-types";

// Execute function for backward compatibility with direct API client
export async function executeFrestRegistrarUsuario(input: {
  nombre: string;
  paterno: string;
  materno?: string;
  email: string;
  rut?: string;
  celular: string;
}): Promise<string> {
  const result = await frestRegistrarUsuarioHandler(input);
  return result.content[0].text;
}

// Handler function used by both SDK and direct API
async function frestRegistrarUsuarioHandler({ nombre, paterno, materno, email, rut, celular }: {
  nombre: string;
  paterno: string;
  materno?: string;
  email: string;
  rut?: string;
  celular: string;
}) {
  {
    try {
      console.log(`📝 [Frest] Registrando nuevo usuario: ${nombre} ${paterno}`);

      const result = await frestClient.registrarUsuario({
        nombre,
        paterno,
        materno,
        email,
        rut,
        celular,
        acepto_terminos: true, // El bot acepta términos automáticamente
      });

      console.log(`✅ [Frest] Usuario registrado: ${result.nombre_completo}`);

      const resultData = {
        success: true,
        user_id: result.user_id,
        nombre_completo: result.nombre_completo,
        email: result.email,
        requiere_verificacion: result.requiere_verificacion,
        mensaje: result.requiere_verificacion
          ? `Usuario registrado exitosamente. Se ha enviado un código de verificación a ${result.email}.`
          : "Usuario registrado exitosamente.",
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
        console.error(`❌ [Frest] Error al registrar usuario:`, error.errores);
        errorData = {
          success: false,
          error: error.errores.join(", "),
        };
      } else {
        console.error(`❌ [Frest] Error inesperado:`, error);
        errorData = {
          success: false,
          error: "Error inesperado al registrar usuario en Frest",
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
export const frestRegistrarUsuarioTool = tool(
  "frest_registrar_usuario",
  "Registra un nuevo usuario en Frest sin contraseña. " +
  "El usuario recibirá un código de verificación por email. " +
  "Solo usar este tool si frest_buscar_usuario retornó que el usuario NO existe.",
  {
    nombre: z.string().describe("Nombre del usuario"),
    paterno: z.string().describe("Apellido paterno"),
    materno: z.string().optional().describe("Apellido materno (opcional)"),
    email: z.string().describe("Email del usuario"),
    rut: z.string().optional().describe("RUT del usuario en formato 12345678-9 (opcional)"),
    celular: z.string().describe("Número de celular con prefijo +56"),
  },
  frestRegistrarUsuarioHandler
);

