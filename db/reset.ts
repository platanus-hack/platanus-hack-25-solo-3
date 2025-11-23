import dotenv from "dotenv";
dotenv.config();

import { cleanDatabase } from "./clean.js";
import { runMigrations } from "./migrate.js";

async function resetDatabase() {
  try {
    console.log("🔄 Reiniciando base de datos...");
    console.log("");

    // Limpiar
    await cleanDatabase();

    // Esperar un momento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("");
    console.log("🔧 Ejecutando migraciones...");
    console.log("");

    // Recrear con migraciones
    await runMigrations();

    console.log("");
    console.log("✅ Base de datos reiniciada exitosamente!");
    console.log("");
  } catch (error) {
    console.error("❌ Error reiniciando base de datos:", error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const force = args.includes("--force") || args.includes("-f");

  if (!force) {
    console.log(
      "⚠️  ADVERTENCIA: Esto eliminará TODOS los datos y recreará las tablas"
    );
    console.log("");
    console.log("Para confirmar, ejecuta:");
    console.log("  npm run db:reset -- --force");
    console.log("");
    process.exit(1);
  }

  resetDatabase();
}

export { resetDatabase };
