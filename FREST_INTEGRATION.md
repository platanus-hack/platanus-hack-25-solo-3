# Integración con Frest API

Esta documentación explica cómo está integrada la API de Frest (ecommerce de alimentos) con PlanEat.

## 📋 Resumen

PlanEat ahora puede hacer pedidos completos en Frest directamente desde WhatsApp:
- ✅ Buscar/registrar usuarios
- ✅ Consultar productos con precios y stock en tiempo real
- ✅ Crear pedidos y generar links de pago
- ✅ Seguimiento de pedidos

## 🔧 Configuración

### 1. Variables de Entorno

Agregar al archivo `.env`:

```bash
# Frest API (Ecommerce Integration)
FREST_API_URL=http://localhost:8001  # Para desarrollo local
FREST_API_KEY=tu_frest_api_key_aqui
```

Para producción:
```bash
FREST_API_URL=https://api.frest.cl
FREST_API_KEY=tu_clave_produccion
```

### 2. Iniciar Frest API Local (Desarrollo)

```bash
# En el proyecto de Frest (LaVegaAdmin)
php artisan serve --port=8001
```

## 🏗️ Arquitectura

### Archivos Creados

```
whatsapp/
├── clients/
│   ├── frest-client.ts         # Cliente HTTP con axios
│   └── frest-types.ts          # Interfaces y types
├── tools/
│   ├── frest-buscar-usuario.ts
│   ├── frest-registrar-usuario.ts
│   ├── frest-crear-direccion.ts
│   ├── frest-consultar-productos.ts
│   ├── frest-crear-pedido.ts
│   └── frest-consultar-estado-pedido.ts
└── agents/
    └── ecommerce.ts            # Actualizado con integración Frest
```

### Flujo de Funcionamiento

1. **Usuario envía mensaje** → WhatsApp Bot
2. **Router detecta intención** → Agente Ecommerce
3. **Agente Ecommerce** ejecuta herramientas:
   - `frest_buscar_usuario` → Verifica si usuario existe
   - `frest_registrar_usuario` → Registra si no existe
   - `frest_crear_direccion` → Crea dirección si falta
   - `frest_consultar_productos` → Busca productos con precios
   - `frest_crear_pedido` → Crea pedido + link de pago
   - `frest_consultar_estado_pedido` → Tracking del pedido

## 🔌 Cliente HTTP (frest-client.ts)

### Características

- ✅ Autenticación automática (header `X-Bot-Api-Key`)
- ✅ Rate limiting (100 requests/min)
- ✅ Retry logic (3 intentos para errores 5xx)
- ✅ Timeout de 30 segundos
- ✅ Logging completo de requests
- ✅ Manejo de errores robusto

### Uso

```typescript
import { frestClient } from "./clients/frest-client";

// Buscar usuario
const result = await frestClient.buscarUsuarioPorTelefono("56995545216");

// Consultar productos
const productos = await frestClient.consultarProductos(["Tomate", "Lechuga"]);

// Crear pedido
const pedido = await frestClient.crearPedido({
  user_id: 123,
  direccion_id: 456,
  ventana_id: 1,
  bodega_id: 1,
  tipo_pedido_id: 1,
  forma_pago: "webpay",
  items: [
    { producto_id: 45, cantidad: 2 },
    { producto_id: 67, cantidad: 1 }
  ]
});
```

## 🤖 Herramientas (Tools) de Claude

### 1. `frest_buscar_usuario`

Busca si existe un usuario registrado en Frest.

**Input:**
```json
{
  "telefono": "56995545216"
}
```

**Output:**
```json
{
  "success": true,
  "encontrado": true,
  "usuario": { ... },
  "direcciones": [ ... ]
}
```

### 2. `frest_registrar_usuario`

Registra un nuevo usuario sin contraseña.

**Input:**
```json
{
  "nombre": "Juan",
  "paterno": "Pérez",
  "email": "juan@example.com",
  "celular": "+56912345678"
}
```

### 3. `frest_crear_direccion`

Crea una dirección de despacho.

**Input:**
```json
{
  "user_id": 123,
  "calle": "Av. Providencia",
  "numero": "1234",
  "comuna": "Providencia",
  "region": "Región Metropolitana"
}
```

### 4. `frest_consultar_productos`

Busca productos con precios y stock en tiempo real.

**Input:**
```json
{
  "productos": ["Tomate", "Lechuga", "Palta"]
}
```

**Output:**
```json
{
  "success": true,
  "productos_disponibles": [
    {
      "producto_id": 45,
      "nombre": "Tomate",
      "precio": 1490,
      "stock": 50
    }
  ],
  "no_encontrados": [ ... ]
}
```

### 5. `frest_crear_pedido`

Crea un pedido completo y genera link de pago.

**Input:**
```json
{
  "user_id": 123,
  "direccion_id": 456,
  "ventana_id": 1,
  "bodega_id": 1,
  "tipo_pedido_id": 1,
  "forma_pago": "webpay",
  "items": [
    { "producto_id": 45, "cantidad": 2 },
    { "producto_id": 67, "cantidad": 1 }
  ]
}
```

**Output:**
```json
{
  "success": true,
  "pedido_id": 12345,
  "codigo_pedido": "FRE-12345",
  "total": 4870,
  "payment_link": "https://webpay.transbank.cl/..."
}
```

### 6. `frest_consultar_estado_pedido`

Consulta el estado de un pedido.

**Input:**
```json
{
  "pedido_id": 12345
}
```

## 💬 Ejemplo de Conversación

```
Usuario: Quiero comprar tomates y lechugas

Bot: [Usa frest_buscar_usuario]
Bot: Hola Juan! Veo que tienes una dirección guardada en Providencia. 
     ¿Quieres que el pedido llegue ahí?

Usuario: Sí

Bot: [Usa frest_consultar_productos]
Bot: Encontré tus productos en Frest! 🛒
     ✅ Tomate: $1.490/kg (stock: 50 kg)
     ✅ Lechuga Costina: $890/un (stock: 30 un)
     ¿Cuánto quieres de cada uno?

Usuario: 2 kilos de tomate y 1 lechuga

Bot: [Usa frest_crear_pedido]
Bot: ¡Listo! Tu pedido #FRE-12345 está creado 🎉
     
     Resumen:
     - Subtotal: $3.870
     - Despacho: $1.000
     - Total: $4.870
     
     Para completar tu compra, paga aquí:
     https://webpay.transbank.cl/...
     
     ⏰ El link expira en 2 horas.
```

## 🚨 Manejo de Errores

### Error de Conexión

Si Frest API no está disponible, el bot automáticamente hace fallback:

```
Bot: Ups! Frest está temporalmente fuera de servicio 😔
     
     Por ahora puedes hacer tu pedido manualmente en:
     - Jumbo: https://www.jumbo.cl
     - Líder: https://www.lider.cl
     
     📋 Tu lista para copiar:
     - Tomate
     - Lechuga
```

### Rate Limit Excedido

El cliente detecta automáticamente el rate limit (100 req/min) y retorna un error claro:

```json
{
  "success": false,
  "error": "Rate limit excedido. Máximo 100 requests por minuto."
}
```

### Errores de Validación

Los errores de la API (400, 422) se capturan y retornan al agente:

```json
{
  "success": false,
  "error": "Este email ya está registrado en el sistema."
}
```

## 🧪 Testing

### Test Manual

1. Iniciar Frest API local:
```bash
cd ../LaVegaAdmin
php artisan serve --port=8001
```

2. Iniciar PlanEat:
```bash
npm run dev
```

3. Enviar mensaje de WhatsApp:
```
"quiero comprar tomates"
```

### Verificar Logs

```bash
# Logs de PlanEat
tail -f logs/app.log | grep Frest

# Logs de Frest API
tail -f ../LaVegaAdmin/storage/logs/laravel.log | grep "Bot API"
```

## 📊 Monitoreo

### Métricas Importantes

- **Rate Limit:** 100 requests/min por API key
- **Timeout:** 30 segundos por request
- **Retry:** 3 intentos para errores 5xx
- **Cache:** No se implementa cache (productos en tiempo real)

### Logs

Todos los requests se registran automáticamente:

```
🌐 [Frest API] POST /productos/consultar
✅ [Frest API] POST /productos/consultar - 200
🛒 [Frest] Consultando 3 productos
✅ [Frest] Encontrados: 3/3 productos
```

## 🔒 Seguridad

- ✅ API Key en headers (no en URL)
- ✅ Queries parametrizadas (SQL injection prevention)
- ✅ Validación de inputs con Zod
- ✅ Rate limiting del lado del cliente
- ✅ Timeout para prevenir requests colgados
- ✅ HTTPS en producción

## 🚀 Deployment

### Variables de Producción

```bash
FREST_API_URL=https://api.frest.cl
FREST_API_KEY=produccion_key_aqui
```

### Checklist de Deploy

- [ ] Configurar `FREST_API_URL` en producción
- [ ] Configurar `FREST_API_KEY` en producción
- [ ] Verificar que Frest API está en `https://`
- [ ] Probar flujo completo en staging
- [ ] Configurar alertas de errores
- [ ] Documentar API key para el equipo

## 📚 Referencias

- [Documentación Frest Bot API](../Frest/LaVegaAdmin/BOT_API_DOCUMENTATION.md)
- [Agente de Ecommerce](./whatsapp/agents/ecommerce.ts)
- [Cliente HTTP](./whatsapp/clients/frest-client.ts)
- [Types](./whatsapp/clients/frest-types.ts)

---

**Última actualización:** 23 de Noviembre, 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Producción

