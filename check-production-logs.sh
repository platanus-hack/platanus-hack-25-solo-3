#!/bin/bash
echo "🔍 Verificando logs de producción..."
echo ""

echo "📝 Últimos logs del servicio whatsapp:"
encore logs --env production --service whatsapp -n 50

echo ""
echo "✅ Revisa los logs arriba para ver:"
echo "   - Errores de migración"
echo "   - Errores de conexión a BD"
echo "   - Timeouts"
