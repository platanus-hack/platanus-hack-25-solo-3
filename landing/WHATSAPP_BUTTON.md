# Landing Page - Botón de WhatsApp

## 🎯 Funcionalidad

La landing page tiene un botón que abre WhatsApp directamente con un mensaje prellenado, iniciando la conversación con el bot de PlanEat.

## 📱 Cómo Funciona

### Desarrollo Local

1. El número de WhatsApp por defecto es `56993112178`
2. Durante el build, el script `landing/scripts/inject-secrets.js` genera `.env.build.local`
3. Vite inyecta `VITE_WHATSAPP_NUMBER` en el bundle
4. El botón abre WhatsApp con el mensaje: "Hola! Me gustaría conocer más sobre PlanEat 🍽️"

### Producción (Encore Cloud)

En Encore Cloud, configura la variable de entorno:

```bash
# Desde CLI
encore secret set --type production WHATSAPP_BUSINESS_NUMBER

# O desde Encore Cloud Dashboard
# Settings → Environment Variables → Production
# Variable: WHATSAPP_BUSINESS_NUMBER
# Valor: +56993112178
```

El build en Encore Cloud:
1. Ejecuta `npm install` → `postinstall` → `landing:build`
2. `landing:build` ejecuta `landing:inject-secrets`
3. El script lee `process.env.WHATSAPP_BUSINESS_NUMBER`
4. Genera `.env.build.local` con el número
5. Vite lo inyecta en el bundle final

## 🛠️ Arquitectura

```
Encore Secret (WHATSAPP_BUSINESS_NUMBER)
           ↓
  landing/scripts/inject-secrets.js
           ↓
     .env.build.local (generado)
           ↓
    Vite Build Process
           ↓
 VITE_WHATSAPP_NUMBER en bundle
           ↓
      landing/src/App.vue
           ↓
    Botón de WhatsApp
```

## 🔧 Desarrollo

### Probar Localmente

```bash
# Con el número por defecto
npm run landing:build
npm run landing:preview

# Con un número personalizado
WHATSAPP_BUSINESS_NUMBER=56912345678 npm run landing:build
npm run landing:preview
```

### Ver el Número Inyectado

```bash
# Después del build
cat landing/.env.build.local

# O inspeccionando el bundle
grep -r "56993112178" landing/dist/assets/
```

### Cambiar el Mensaje

Edita el archivo `landing/src/App.vue`:

```typescript
// Mensaje prellenado para WhatsApp
const welcomeMessage = "Tu mensaje aquí 🍽️";
```

## 📋 Checklist de Deploy

### Local
- [x] Script `inject-secrets.js` creado
- [x] `.env.build.local` en `.gitignore`
- [x] `landing:inject-secrets` en `package.json`
- [x] Número por defecto configurado

### Staging
- [ ] Variable `WHATSAPP_BUSINESS_NUMBER` configurada
- [ ] Build exitoso
- [ ] Botón de WhatsApp funciona
- [ ] Mensaje prellenado correcto

### Production
- [ ] Variable `WHATSAPP_BUSINESS_NUMBER` configurada
- [ ] Build exitoso
- [ ] Botón de WhatsApp funciona
- [ ] Link apunta al número correcto

## 🔐 Seguridad

### ¿Por qué el número está en el cliente?

El número de WhatsApp de negocio es **público** por naturaleza:
- Aparece en la página web
- Los usuarios lo necesitan para contactarte
- No es información sensible

### ¿Por qué no está hardcodeado en el repo?

Aunque es público, usamos secrets por:
- **Flexibilidad**: Cambiar número sin modificar código
- **Ambientes**: Usar diferentes números en staging/producción
- **Buenas prácticas**: Configuración separada del código

### ¿Qué NO poner en `VITE_*`?

❌ API Keys privadas
❌ Passwords
❌ Tokens de autenticación
❌ Secrets de servicios externos

✅ Números de WhatsApp público
✅ URLs públicas
✅ IDs de servicios públicos

## 🚨 Troubleshooting

### El botón no abre WhatsApp

1. Verifica el número en el bundle:
```bash
grep -r "VITE_WHATSAPP_NUMBER" landing/dist/assets/
```

2. Revisa la consola del navegador
3. Verifica el formato del número (debe ser sin `+`)

### El número está vacío o incorrecto

1. Verifica el secret en Encore Cloud
2. Revisa que el build inyectó el número:
```bash
cat landing/.env.build.local
```

3. Asegúrate de que `npm run landing:inject-secrets` se ejecutó

### El script de inyección falla

1. Verifica permisos del script:
```bash
chmod +x landing/scripts/inject-secrets.js
```

2. Ejecuta manualmente para ver errores:
```bash
node landing/scripts/inject-secrets.js
```

## 📚 Referencias

- [WhatsApp Click to Chat](https://faq.whatsapp.com/5913398998672934)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Encore Secrets](https://encore.dev/docs/develop/secrets)

