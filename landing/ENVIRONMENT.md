# Environment Configuration for Landing Page

## 🌍 Environment Variables

La landing page usa variables de entorno de Vite para configurar URLs según el ambiente.

### Variables Disponibles

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base del API backend | `https://api.planeat.life` |

### Archivos de Configuración

#### `.env.development` (Desarrollo Local)
```env
VITE_API_URL=http://127.0.0.1:4000
```

#### `.env.production` (Producción)
```env
VITE_API_URL=https://api.planeat.life
```

#### `.env.example` (Plantilla)
Documentación de las variables disponibles.

## 🔄 Detección Automática

Si no se especifica `VITE_API_URL`, el código detecta automáticamente:

```typescript
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "production"
    ? "https://api.planeat.life"
    : "http://127.0.0.1:4000");
```

### Lógica de Fallback

1. **Prioridad 1:** `VITE_API_URL` (si está definida)
2. **Prioridad 2:** Autodetección por `import.meta.env.MODE`:
   - `production` → `https://api.planeat.life`
   - `development` → `http://127.0.0.1:4000`

## 🚀 Uso en Desarrollo

```bash
# Desarrollo local (usa .env.development)
npm run landing:dev

# Build de producción (usa .env.production)
npm run landing:build

# Preview del build (usa variables del build)
npm run landing:preview
```

## 🏗️ Build para Encore Cloud

Encore Cloud automáticamente detectará `production` mode:

```bash
# En Encore Cloud:
npm install         # ejecuta postinstall
npm run landing:build  # usa .env.production
# Result: API_URL = https://api.planeat.life ✅
```

## 🧪 Testing en Staging

Si necesitas probar contra un ambiente de staging:

1. Crea `.env.staging`:
```env
VITE_API_URL=https://staging-api.planeat.life
```

2. Actualiza `package.json`:
```json
{
  "scripts": {
    "landing:build:staging": "cd landing && vite build --mode staging"
  }
}
```

## 🔐 Seguridad

- ✅ Archivos `.env.production` y `.env.development` se suben al repo
- ✅ Son seguros porque solo contienen URLs públicas
- ❌ `.env.local` y `.env.*.local` están en `.gitignore`
- ❌ NUNCA pongas API keys o secrets en variables `VITE_*`

## 📝 Verificación

Después del build, puedes verificar la URL usada:

```bash
# Inspecciona el bundle generado
grep -r "api.planeat.life" landing/dist/assets/
```

O abre las DevTools del navegador y verifica la URL en las Network requests.
