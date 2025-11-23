import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verificar que DATABASE_URL esté configurado
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL no está configurado en .env");
  console.error("📝 Copia env.template a .env y configúralo");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    // Crear tabla de migraciones si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version BIGINT PRIMARY KEY,
        dirty BOOLEAN NOT NULL DEFAULT false,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Leer archivos de migración
    const migrationsDir = path.join(__dirname, "../whatsapp/migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".up.sql"))
      .sort();

    console.log(`📁 Found ${files.length} migration files`);

    for (const file of files) {
      // Extraer número de versión del nombre del archivo
      const version = parseInt(file.split("_")[0]);

      // Verificar si ya fue aplicada
      const result = await client.query(
        "SELECT version FROM schema_migrations WHERE version = $1",
        [version]
      );

      if (result.rows.length > 0) {
        console.log(`⏭️  Migration ${file} already applied`);
        continue;
      }

      console.log(`🔄 Applying migration: ${file}`);

      // Leer y ejecutar migración
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (version) VALUES ($1)",
          [version]
        );
        await client.query("COMMIT");
        console.log(`✅ Migration ${file} applied successfully`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }

    console.log("✅ All migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { runMigrations };
