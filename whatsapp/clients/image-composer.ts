// Compositor de imágenes - Combina imagen de comida con texto de receta
import sharp from "sharp";

interface RecipeComposition {
  recipeName: string;
  ingredients: string[];
  instructions: string[];
}

/**
 * Compone una imagen final con la foto de comida arriba y la receta abajo
 * @param foodImageBuffer - Buffer con la imagen de la comida generada
 * @param recipeName - Nombre de la receta
 * @param recipeText - Texto completo de la receta (puede ser formateado)
 * @returns Buffer con la imagen compuesta en formato PNG
 */
export async function composeFoodImageWithRecipe(
  foodImageBuffer: Buffer,
  recipeName: string,
  recipeText: string
): Promise<Buffer> {
  console.log(`🖼️ Composing image for recipe: ${recipeName}`);
  
  try {
    // Dimensiones objetivo
    const targetWidth = 1080;
    const foodImageHeight = 720;
    
    // Redimensionar la imagen de comida a las dimensiones objetivo
    const resizedFoodImage = await sharp(foodImageBuffer)
      .resize(targetWidth, foodImageHeight, {
        fit: "cover",
        position: "center",
      })
      .png()
      .toBuffer();
    
    // Parsear el texto de receta para extraer ingredientes e instrucciones
    const recipe = parseRecipeText(recipeName, recipeText);
    
    // Generar el SVG con el texto de la receta
    const textSvg = generateRecipeTextSVG(recipe, targetWidth);
    
    // Calcular altura del SVG basado en el contenido
    const textHeight = calculateTextHeight(recipe);
    
    // Renderizar el SVG a imagen
    const textImageBuffer = await sharp(Buffer.from(textSvg))
      .resize(targetWidth, textHeight)
      .png()
      .toBuffer();
    
    // Combinar la imagen de comida con el texto
    const finalImage = await sharp({
      create: {
        width: targetWidth,
        height: foodImageHeight + textHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        {
          input: resizedFoodImage,
          top: 0,
          left: 0,
        },
        {
          input: textImageBuffer,
          top: foodImageHeight,
          left: 0,
        },
      ])
      .png()
      .toBuffer();
    
    console.log(`✅ Image composed successfully (${finalImage.length} bytes)`);
    return finalImage;
    
  } catch (error: any) {
    console.error("❌ Error composing image:", error.message);
    throw new Error(`Failed to compose image: ${error.message}`);
  }
}

/**
 * Parsea el texto de receta para extraer ingredientes e instrucciones
 */
function parseRecipeText(recipeName: string, recipeText: string): RecipeComposition {
  const lines = recipeText.split("\n").map(line => line.trim()).filter(line => line);
  
  const ingredients: string[] = [];
  const instructions: string[] = [];
  
  let currentSection: "ingredients" | "instructions" | null = null;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Detectar secciones
    if (lowerLine.includes("ingrediente") || lowerLine.includes("ingredient")) {
      currentSection = "ingredients";
      continue;
    } else if (
      lowerLine.includes("instrucciones") ||
      lowerLine.includes("preparación") ||
      lowerLine.includes("preparacion") ||
      lowerLine.includes("pasos") ||
      lowerLine.includes("instructions")
    ) {
      currentSection = "instructions";
      continue;
    }
    
    // Agregar línea a la sección actual
    if (currentSection === "ingredients" && line.length > 0) {
      // Limpiar bullets y guiones
      const cleanedLine = line.replace(/^[-•*]\s*/, "").trim();
      if (cleanedLine) ingredients.push(cleanedLine);
    } else if (currentSection === "instructions" && line.length > 0) {
      // Limpiar numeración
      const cleanedLine = line.replace(/^\d+\.\s*/, "").trim();
      if (cleanedLine) instructions.push(cleanedLine);
    }
  }
  
  // Si no se detectaron secciones, asumir que todo es instrucciones
  if (ingredients.length === 0 && instructions.length === 0) {
    instructions.push(...lines);
  }
  
  return {
    recipeName,
    ingredients,
    instructions,
  };
}

/**
 * Genera el SVG con el texto de la receta
 */
function generateRecipeTextSVG(recipe: RecipeComposition, width: number): string {
  const padding = 40;
  const contentWidth = width - padding * 2;
  
  let yPosition = padding + 20;
  let svgContent = "";
  
  // Título de la receta
  svgContent += `
    <text x="${padding}" y="${yPosition}" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="48" font-weight="bold" fill="#2C3E50">
      ${escapeXml(recipe.recipeName)}
    </text>
  `;
  yPosition += 80;
  
  // Ingredientes
  if (recipe.ingredients.length > 0) {
    svgContent += `
      <text x="${padding}" y="${yPosition}" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="36" font-weight="bold" fill="#34495E">
        Ingredientes:
      </text>
    `;
    yPosition += 50;
    
    for (const ingredient of recipe.ingredients) {
      // Wrap text si es muy largo
      const wrappedLines = wrapText(ingredient, 50);
      for (let i = 0; i < wrappedLines.length; i++) {
        svgContent += `
          <text x="${padding + 20}" y="${yPosition}" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="28" fill="#555">
            ${i === 0 ? "• " : "  "}${escapeXml(wrappedLines[i])}
          </text>
        `;
        yPosition += 38;
      }
    }
    yPosition += 20;
  }
  
  // Instrucciones
  if (recipe.instructions.length > 0) {
    svgContent += `
      <text x="${padding}" y="${yPosition}" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="36" font-weight="bold" fill="#34495E">
        Preparación:
      </text>
    `;
    yPosition += 50;
    
    for (let i = 0; i < recipe.instructions.length; i++) {
      const instruction = recipe.instructions[i];
      const wrappedLines = wrapText(instruction, 50);
      
      for (let j = 0; j < wrappedLines.length; j++) {
        svgContent += `
          <text x="${padding + 20}" y="${yPosition}" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="28" fill="#555">
            ${j === 0 ? `${i + 1}. ` : "   "}${escapeXml(wrappedLines[j])}
          </text>
        `;
        yPosition += 38;
      }
      yPosition += 10;
    }
  }
  
  // Añadir padding inferior
  yPosition += 40;
  
  const svg = `
    <svg width="${width}" height="${yPosition}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${yPosition}" fill="white"/>
      ${svgContent}
    </svg>
  `;
  
  return svg;
}

/**
 * Calcula la altura aproximada del texto de la receta
 */
function calculateTextHeight(recipe: RecipeComposition): number {
  let height = 100; // Padding inicial + título
  
  if (recipe.ingredients.length > 0) {
    height += 50; // Título de sección
    // Calcular líneas wrapeadas para cada ingrediente
    for (const ingredient of recipe.ingredients) {
      const lines = Math.ceil(ingredient.length / 50);
      height += lines * 38;
    }
    height += 20; // Espacio entre secciones
  }
  
  if (recipe.instructions.length > 0) {
    height += 50; // Título de sección
    // Calcular líneas wrapeadas para cada instrucción
    for (const instruction of recipe.instructions) {
      const lines = Math.ceil(instruction.length / 50);
      height += lines * 38 + 10;
    }
  }
  
  height += 80; // Padding inferior
  
  return height;
}

/**
 * Wrap text to fit within a certain character limit
 */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  
  for (const word of words) {
    if ((currentLine + word).length <= maxChars) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  
  return lines;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

