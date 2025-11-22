#!/bin/bash
echo "🔍 Verificando ambiente STAGING..."
echo ""

echo "1️⃣ Listando ambientes disponibles:"
encore env list

echo ""
echo "2️⃣ Verificando infraestructura en staging:"
encore infra show --env staging

echo ""
echo "3️⃣ Connection string de staging:"
encore db conn-uri planeat --env staging 2>&1

echo ""
echo "4️⃣ Últimos deploys en staging:"
encore deploy list --env staging 2>&1 | head -10
