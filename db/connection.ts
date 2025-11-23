import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Pool } = pg;

// Verificar que DATABASE_URL esté configurado
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL no está configurado en .env");
  console.error("📝 Copia env.template a .env y configúralo");
  process.exit(1);
}

// Configuración de la conexión a PostgreSQL (AWS RDS)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL configuration for RDS
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: true,
          // RDS usa certificados de Amazon, pero acepta conexiones seguras sin verificación estricta
          // Si necesitas el certificado de RDS, descárgalo de: https://truststore.pki.rds.amazonaws.com/
          // ca: fs.readFileSync('/path/to/rds-ca-bundle.pem').toString()
        }
      : undefined,
  max: 20, // máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // 10 segundos (aumentado)
  statement_timeout: 30000, // 30 segundos para queries
});

// Adaptador para compatibilidad con el código existente de Encore
export const db = {
  async query<T = any>(
    strings: TemplateStringsArray,
    ...values: any[]
  ): Promise<AsyncIterable<T>> {
    // Convertir template string a query parametrizado
    let text = strings[0];
    const params = [];

    for (let i = 0; i < values.length; i++) {
      params.push(values[i]);
      text += `$${i + 1}` + strings[i + 1];
    }

    // Log de performance para queries lentas
    const startTime = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - startTime;

    if (duration > 1000) {
      console.warn(
        `⚠️  Slow query detected (${duration}ms):`,
        text.substring(0, 100)
      );
    } else if (duration > 100) {
      console.log(`🐌 Query took ${duration}ms`);
    }

    // Retornar un async iterable para compatibilidad
    return {
      async *[Symbol.asyncIterator]() {
        for (const row of result.rows) {
          yield row;
        }
      },
    };
  },

  async queryRow<T = any>(
    strings: TemplateStringsArray,
    ...values: any[]
  ): Promise<T | null> {
    let text = strings[0];
    const params = [];

    for (let i = 0; i < values.length; i++) {
      params.push(values[i]);
      text += `$${i + 1}` + strings[i + 1];
    }

    // Log de performance
    const startTime = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - startTime;

    if (duration > 1000) {
      console.warn(
        `⚠️  Slow query detected (${duration}ms):`,
        text.substring(0, 100)
      );
    } else if (duration > 100) {
      console.log(`🐌 Query took ${duration}ms`);
    }

    return (result.rows[0] as T) || null;
  },

  async exec(strings: TemplateStringsArray, ...values: any[]): Promise<void> {
    let text = strings[0];
    const params = [];

    for (let i = 0; i < values.length; i++) {
      params.push(values[i]);
      text += `$${i + 1}` + strings[i + 1];
    }

    await pool.query(text, params);
  },
};

// Test de conexión
pool.on("connect", () => {
  console.log("✅ Database connected");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected database error:", err);
});

export default pool;
