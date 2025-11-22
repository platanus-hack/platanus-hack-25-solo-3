#!/bin/bash
echo "🔍 Verificando ambiente STAGING en Encore Cloud..."
echo ""

echo "1️⃣ Verificando connection string de staging:"
encore db conn-uri planeat --env staging 2>&1

echo ""
echo "2️⃣ Intentando conectarse a la BD de staging:"
psql "$(encore db conn-uri planeat --env staging 2>&1)" -c "\dt" 2>&1 | head -20

echo ""
echo "3️⃣ Verificando migraciones en staging:"
psql "$(encore db conn-uri planeat --env staging 2>&1)" -c "SELECT * FROM schema_migrations;" 2>&1

echo ""
echo "4️⃣ Verificando logs recientes (últimas 30 líneas):"
encore logs --env staging 2>&1 | tail -30

echo ""
echo "✅ Análisis completo"
