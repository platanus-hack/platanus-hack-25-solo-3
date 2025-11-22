# Configuración de Dominios Personalizados para PlanEat

## 🎯 Objetivo
Configurar:
- `www.planeat.life` → Landing page
- `api.planeat.life` → API de WhatsApp

## 📋 Pasos de Configuración

### 1. Configurar DNS en tu proveedor de dominio

Agrega los siguientes registros DNS:

```dns
# Para la landing page
www.planeat.life    CNAME    <encore-generated-domain>.encr.app    TTL 3600

# Para la API
api.planeat.life    CNAME    <encore-generated-domain>.encr.app    TTL 3600

# Registro raíz (opcional)
planeat.life        CNAME    <encore-generated-domain>.encr.app    TTL 3600
# O si tu DNS no soporta CNAME en el apex:
planeat.life        ALIAS    <encore-generated-domain>.encr.app    TTL 3600
```

**Nota:** El dominio `<encore-generated-domain>` lo obtendrás en el paso 2.

### 2. Configurar en Encore Cloud Dashboard

#### A. Obtener el dominio generado por Encore

1. Ve a https://app.encore.cloud
2. Selecciona tu app `planeat`
3. Ve a tu ambiente de producción
4. Copia el dominio generado (algo como `planeat-4ga2-prod-abc123.encr.app`)

#### B. Agregar dominios personalizados

1. En el dashboard, ve a **Settings** > **Custom Domains**
2. Haz clic en **Add Custom Domain**

**Para la landing page:**
```
Domain: www.planeat.life
Service: landing
Path: / (or *)
```

**Para la API:**
```
Domain: api.planeat.life  
Service: whatsapp
Path: /
```

3. Encore generará automáticamente certificados SSL via Let's Encrypt
4. Espera unos minutos para que los certificados se provisionen

### 3. Verificar DNS Propagación

```bash
# Verificar que los registros DNS estén configurados
dig www.planeat.life CNAME
dig api.planeat.life CNAME

# Probar SSL
curl https://www.planeat.life
curl https://api.planeat.life/webhooks/whatsapp -I
```

### 4. Actualizar Configuración de Kapso

Una vez que los dominios estén activos, actualiza el webhook URL en Kapso:

**Webhook URL:** `https://api.planeat.life/webhooks/whatsapp`

Pasos:
1. Ve al dashboard de Kapso
2. Configuración de Webhooks
3. Actualiza la URL del webhook
4. Guarda cambios

### 5. Probar el Flujo Completo

1. **Landing page:** Visita `https://www.planeat.life`
   - ✅ Debe cargar correctamente
   - ✅ El formulario debe funcionar
   - ✅ Debe enviar mensajes por WhatsApp

2. **API de WhatsApp:** Envía un mensaje de WhatsApp
   - ✅ Debe recibirse en el webhook
   - ✅ El bot debe responder

## 🔧 Alternativa: Usar Gateway de Encore

Si prefieres tener un solo dominio con routing interno, puedes usar la funcionalidad de Gateway:

### Estructura del Gateway

```typescript
// whatsapp/encore.service.ts
import { Service, Gateway } from "encore.dev/service";
import { auth } from "./auth"; // Si tienes auth

export default new Service("whatsapp", {
  // Si necesitas configurar un gateway con auth
});

export const gateway = new Gateway({
  // Configuración opcional de gateway
});
```

Con esta configuración, Encore automáticamente:
- Rutea `api.planeat.life/*` → endpoints expuestos
- Maneja CORS correctamente
- Provee certificados SSL

## 📊 Arquitectura Final

```
Usuario → www.planeat.life (Landing)
           ↓
        Ingresa teléfono
           ↓
        api.planeat.life/start
           ↓
        WhatsApp Bot procesando
           ↓
        Kapso webhook → api.planeat.life/webhooks/whatsapp
           ↓
        Claude Agent SDK
           ↓
        Respuesta por WhatsApp
```

## 🚨 Troubleshooting

### DNS no propaga
- Espera hasta 24-48 horas (aunque usualmente es minutos)
- Verifica con `dig` o `nslookup`
- Limpia cache DNS local: `sudo dscacheutil -flushcache` (macOS)

### SSL Error
- Encore auto-genera certificados Let's Encrypt
- Verifica que los dominios estén correctamente apuntando
- Contacta soporte de Encore si persiste

### Webhook no funciona
- Verifica que Kapso tenga la URL correcta
- Revisa logs en Encore Dashboard
- Prueba con `curl -X POST https://api.planeat.life/webhooks/whatsapp`

## 📚 Recursos

- [Encore Custom Domains Docs](https://encore.dev/docs/deploy/custom-domains)
- [Encore Gateway Docs](https://encore.dev/docs/ts/primitives/api-gateway)
- [Kapso Webhook Configuration](https://docs.kapso.ai/docs/platform/webhooks)

