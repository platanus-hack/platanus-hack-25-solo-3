# Build Configuration for PlanEat

## 🏗️ Build Process

PlanEat tiene dos componentes que necesitan ser construidos:

1. **Landing Page (Vue 3 + Vite)** - Frontend estático
2. **Encore Backend** - API y servicios

### Build Order

```
npm install
    ↓
postinstall hook ejecuta landing:build
    ↓
landing/dist/ se genera
    ↓
Encore puede compilar y servir la landing page
```

## 📦 Scripts Disponibles

### Desarrollo Local

```bash
# Backend (Encore)
encore run

# Landing page (Vite dev server)
npm run landing:dev
```

### Build para Producción

```bash
# Build completo (automático en Encore Cloud)
npm install  # Ejecuta postinstall que construye la landing

# Build manual de la landing
npm run landing:build

# Preview de la landing
npm run landing:preview
```

## 🐛 Troubleshooting

### Error: "unable to read static assets directory"

**Causa:** El directorio `landing/dist/` no existe.

**Solución:**
```bash
# Construir la landing page manualmente
npm run landing:build

# Verificar que el directorio existe
ls -la landing/dist/
```

### Error en postinstall durante desarrollo

El script `postinstall` incluye `|| true` para no fallar si hay problemas en desarrollo.

Si quieres desactivar el auto-build en desarrollo:
```bash
# Usar npm install con --ignore-scripts
npm install --ignore-scripts
```

### Build en Encore Cloud falla

Encore Cloud ejecutará automáticamente:
1. `npm install` (que ejecuta postinstall)
2. Compila la aplicación Encore

Si falla, verifica:
- ✅ `package.json` tiene el script `postinstall`
- ✅ Todas las dependencias de Vue/Vite están en `dependencies` (no en `devDependencies`)
- ✅ `landing/vite.config.ts` está correctamente configurado

## 📁 Estructura de Archivos

```
planeat/
├── landing/
│   ├── src/
│   │   ├── App.vue
│   │   └── main.ts
│   ├── dist/              ← Generado por Vite (gitignored)
│   │   ├── index.html
│   │   └── assets/
│   ├── vite.config.ts
│   └── landing.ts         ← Encore endpoint que sirve /dist
├── whatsapp/
│   └── ...
└── package.json           ← Contiene postinstall script
```

## 🚀 Deploy Checklist

Antes de hacer deploy a producción:

- [ ] `npm run landing:build` funciona correctamente
- [ ] `landing/dist/` contiene archivos compilados
- [ ] `encore run` inicia correctamente en local
- [ ] La landing page es accesible en http://localhost:4000
- [ ] Los webhooks de WhatsApp están configurados

## 🔧 Configuración Avanzada

### Cambiar el directorio de build

Si necesitas cambiar dónde Vite genera los archivos:

1. Actualiza `landing/vite.config.ts`:
```typescript
export default defineConfig({
  build: {
    outDir: '../public' // Cambiar destino
  }
})
```

2. Actualiza `landing/landing.ts`:
```typescript
export const serveApp = api.static({
  expose: true,
  path: "/!path",
  dir: "../public", // Mismo path
});
```

### Optimizar el build

Para reducir el tiempo de build en desarrollo:

```json
// package.json
{
  "scripts": {
    "postinstall": "[ -d landing/dist ] || npm run landing:build"
  }
}
```

Esto solo construirá si el directorio no existe.

