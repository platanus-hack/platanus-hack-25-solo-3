#!/bin/bash

echo "🚀 Iniciando PlanEat"
echo ""

# Verificar .env
if [ ! -f .env ]; then
    echo "❌ No se encontró .env"
    if [ -f env.template ]; then
        echo "📝 Copiando env.template a .env..."
        cp env.template .env
        echo "⚠️  Edita .env con tus credenciales y vuelve a ejecutar"
        exit 1
    else
        echo "❌ No se encontró env.template"
        exit 1
    fi
fi

echo "✅ Variables de entorno configuradas"

# Verificar node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Verificar landing/dist
if [ ! -d "landing/dist" ]; then
    echo "🏗️  Building landing page..."
    npm run landing:build
fi

# Verificar dist (TypeScript compilado)
if [ ! -d "dist" ] || [ ! -f "dist/server.js" ]; then
    echo "🔨 Compilando TypeScript..."
    npx tsc
fi

echo ""
echo "🎉 Todo listo! Iniciando servidor..."
echo ""

npm run dev

