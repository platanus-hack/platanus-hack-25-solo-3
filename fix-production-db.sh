#!/bin/bash
echo "🔧 Diagnosticando base de datos en producción..."
echo ""

echo "1️⃣ Verificando infraestructura..."
encore infra show --env production

echo ""
echo "2️⃣ Intentando obtener connection string..."
encore db conn-uri planeat --env production

echo ""
echo "3️⃣ Verificando estado del deploy..."
encore deploy list --env production | head -5

echo ""
echo "📝 Si ves errores arriba, intenta:"
echo "   encore deploy production"
echo ""
echo "Si la base de datos no existe, contacta a soporte de Encore."
