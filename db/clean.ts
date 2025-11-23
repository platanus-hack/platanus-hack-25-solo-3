import dotenv from "dotenv";
dotenv.config();

import { pool } from "./connection";

async function cleanDatabase() {
  const client = await pool.connect();

  try {
    console.log("🧹 Limpiando base de datos...");

    // Desactivar checks de foreign keys temporalmente
    await client.query("SET session_replication_role = 'replica';");

    // Obtener todas las tablas
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    const tables = tablesResult.rows;
    console.log(`📋 Encontradas ${tables.length} tablas`);

    // Eliminar todas las tablas
    for (const { tablename } of tables) {
      console.log(`🗑️  Eliminando tabla: ${tablename}`);
      await client.query(`DROP TABLE IF EXISTS "${tablename}" CASCADE`);
    }

    // Reactivar checks de foreign keys
    await client.query("SET session_replication_role = 'origin';");

    console.log("✅ Base de datos limpiada exitosamente");
    console.log("");
    console.log("💡 Ejecuta 'npm run migrate' para recrear las tablas");
  } catch (error) {
    console.error("❌ Error limpiando base de datos:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  // Confirmación de seguridad
  const args = process.argv.slice(2);
  const force = args.includes("--force") || args.includes("-f");

  if (!force) {
    console.log(
      "⚠️  ADVERTENCIA: Esto eliminará TODAS las tablas de la base de datos"
    );
    console.log("");
    console.log("Para confirmar, ejecuta:");
    console.log("  npm run db:clean -- --force");
    console.log("");
    process.exit(1);
  }

  cleanDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { cleanDatabase };
