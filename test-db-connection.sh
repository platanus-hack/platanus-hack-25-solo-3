#!/bin/bash
echo "🔍 Probando conexión a la base de datos local..."
echo ""

echo "1️⃣ Verificando que encore run esté activo:"
pgrep -fl "encore run" || echo "⚠️  encore run NO está corriendo"

echo ""
echo "2️⃣ Intentando conectar a la BD:"
CONN_URI=$(encore db conn-uri planeat 2>&1)
echo "Connection URI: $CONN_URI"

echo ""
echo "3️⃣ Listando tablas en la BD:"
encore db shell planeat --write << 'SQL'
\dt
SQL

echo ""
echo "4️⃣ Verificando que las migraciones se hayan aplicado:"
encore db shell planeat --write << 'SQL'
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;
SQL

echo ""
echo "✅ Si todo aparece arriba, la BD está funcionando"
echo "❌ Si hay errores, necesitamos resetear la BD"
