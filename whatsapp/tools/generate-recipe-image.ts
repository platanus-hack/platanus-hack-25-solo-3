// Tool para generar y enviar imágenes de recetas
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { generateFoodImage } from "../clients/google-image-client";
import { composeFoodImageWithRecipe } from "../clients/image-composer";
import { sendImageMessage } from "../whatsapp-client";

/**
 * Tool MCP para generar y enviar imagen de receta
 */
export const generateRecipeImageTool = tool(
  "generate_recipe_image",
  "Genera una imagen de una receta con foto de la comida arriba y texto de la receta debajo. " +
    "La imagen se envía automáticamente al usuario por WhatsApp. " +
    "Usa este tool cuando: " +
    "1. El usuario pide el menú semanal (generar imágenes para cada día) " +
    "2. El usuario solicita una receta específica " +
    "3. Quieres enviar una receta visualmente atractiva",
  {
    phone_number: z
      .string()
      .describe("Número de teléfono del usuario (formato: +56912345678)"),
    recipe_name: z
      .string()
      .describe("Nombre de la receta (ej: 'Pollo al Horno con Papas')"),
    recipe_text: z
      .string()
      .describe(
        "Texto completo de la receta incluyendo ingredientes e instrucciones de preparación. " +
          "Debe estar formateado con secciones 'Ingredientes:' e 'Instrucciones:' o 'Preparación:'"
      ),
    context: z
      .string()
      .optional()
      .describe(
        "Contexto adicional sobre el plato para mejorar la generación de la imagen (opcional)"
      ),
  },
  async ({ phone_number, recipe_name, recipe_text, context }) => {
    console.log("🔧 TOOL CALLED: generate_recipe_image");
    console.log(`   Recipe: ${recipe_name}`);
    console.log(`   For: ${phone_number}`);

    try {
      // Paso 1: Generar imagen de la comida con Google AI
      console.log("📸 Step 1/3: Generating food image...");
      const foodImageBuffer = await generateFoodImage(recipe_name, context);

      // Paso 2: Componer imagen con texto de receta
      console.log("🖼️ Step 2/3: Composing image with recipe text...");
      const finalImageBuffer = await composeFoodImageWithRecipe(
        foodImageBuffer,
        recipe_name,
        recipe_text
      );

      // Paso 3: Enviar por WhatsApp
      console.log("📤 Step 3/3: Sending image via WhatsApp...");
      await sendImageMessage(
        phone_number,
        finalImageBuffer,
        `📖 Receta: ${recipe_name}`
      );

      console.log(`✅ Recipe image sent successfully to ${phone_number}`);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              message: `Imagen de receta "${recipe_name}" enviada exitosamente`,
              recipe_name,
            }),
          },
        ],
      };
    } catch (error: any) {
      console.error("❌ Error generating recipe image:", error);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: `No se pudo generar la imagen de la receta. Error: ${error.message}`,
            }),
          },
        ],
      };
    }
  }
);

/**
 * Handler para uso directo (sin MCP) - para uso en claude-client.ts
 */
export async function generateRecipeImage(
  phoneNumber: string,
  recipeName: string,
  recipeText: string,
  context?: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🎨 Generating recipe image: ${recipeName} for ${phoneNumber}`);
    
    // Paso 1: Generar imagen de la comida con Google AI
    console.log("📸 Step 1/3: Generating food image...");
    const foodImageBuffer = await generateFoodImage(recipeName, context);

    // Paso 2: Componer imagen con texto de receta
    console.log("🖼️ Step 2/3: Composing image with recipe text...");
    const finalImageBuffer = await composeFoodImageWithRecipe(
      foodImageBuffer,
      recipeName,
      recipeText
    );

    // Paso 3: Enviar por WhatsApp
    console.log("📤 Step 3/3: Sending image via WhatsApp...");
    await sendImageMessage(
      phoneNumber,
      finalImageBuffer,
      `📖 Receta: ${recipeName}`
    );

    console.log(`✅ Recipe image sent successfully to ${phoneNumber}`);

    return {
      success: true,
      message: `Imagen de receta "${recipeName}" enviada exitosamente`,
    };
  } catch (error: any) {
    console.error("❌ Error generating recipe image:", error);

    return {
      success: false,
      message: `No se pudo generar la imagen de la receta. Error: ${error.message}`,
    };
  }
}

