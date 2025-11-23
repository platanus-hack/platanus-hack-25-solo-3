// Cliente para Google Generative AI - Generación de imágenes de comida
import { GoogleGenAI } from "@google/genai";
import { config } from "../../config/env";

let googleAI: GoogleGenAI | null = null;

/**
 * Obtener instancia del cliente de Google Generative AI
 */
function getGoogleAI(): GoogleGenAI {
  if (!googleAI) {
    const apiKey = config.google.apiKey;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY no está configurada en las variables de entorno");
    }
    googleAI = new GoogleGenAI({ apiKey });
  }
  return googleAI;
}

/**
 * Genera una imagen de comida usando Google Generative AI (Imagen-3)
 * @param dishName - Nombre del plato a generar
 * @param additionalContext - Contexto adicional sobre el plato (opcional)
 * @returns Buffer con la imagen generada en formato PNG
 */
export async function generateFoodImage(
  dishName: string,
  additionalContext?: string
): Promise<Buffer> {
  console.log(`🎨 Generating food image for: ${dishName}`);
  
  try {
    const ai = getGoogleAI();
    
    // Crear prompt optimizado para generar imagen de comida
    const prompt = additionalContext
      ? `Professional food photography of ${dishName}. ${additionalContext}. High quality, appetizing, well-lit, restaurant-style presentation on a white plate.`
      : `Professional food photography of ${dishName}. High quality, appetizing, well-lit, restaurant-style presentation on a white plate.`;
    
    console.log(`📝 Prompt: ${prompt}`);
    
    // Generar la imagen con timeout de 30 segundos usando generateContent (no generateImages)
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Image generation timeout (30s)")), 30000)
    );
    
    // Usar generateContent con gemini-2.5-flash-image (Nano Banana)
    const generationPromise = ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });
    
    const result = await Promise.race([generationPromise, timeoutPromise]);
    
    // Extraer la imagen del resultado
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error("No candidates in response from Google AI");
    }
    
    const candidate = result.candidates[0];
    
    if (!candidate.content?.parts) {
      throw new Error("No parts in candidate content");
    }
    
    // Buscar la parte que contiene la imagen
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        // La imagen viene en base64
        const imageData = Buffer.from(part.inlineData.data, 'base64');
        console.log(`✅ Image generated successfully (${imageData.length} bytes)`);
        return imageData;
      }
    }
    
    throw new Error("No image data found in response parts");
    
  } catch (error: any) {
    console.error("❌ Error generating food image:", error.message);
    
    // Si falla, intentar generar una imagen simple como fallback
    if (error.message.includes("timeout")) {
      console.log("⏱️ Timeout - image generation took too long");
    }
    
    throw new Error(`Failed to generate food image: ${error.message}`);
  }
}

/**
 * Valida que la API key de Google esté configurada
 */
export function validateGoogleAPIKey(): boolean {
  return !!config.google.apiKey;
}

