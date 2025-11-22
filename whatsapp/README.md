# PlanEat WhatsApp Bot - Configuración y Uso

## ✅ Estado actual

El bot está completamente implementado y el servidor de Encore está corriendo en `http://localhost:4000`.

**Endpoints disponibles:**
- `POST /webhooks/whatsapp` - Webhook para recibir mensajes de Kapso
- `POST /test/webhook` - Endpoint de testing sin necesidad de WhatsApp real

## 🔑 Configurar secrets (Paso 1 - REQUERIDO)

Antes de usar el bot, debes configurar estas 3 variables de entorno:

### 1. ANTHROPIC_API_KEY
API key de Anthropic para usar Claude.

**Obtener**: https://console.anthropic.com/settings/keys

**Configurar**:
```bash
encore secret set --type local ANTHROPIC_API_KEY
```
Pega tu API key cuando se solicite y presiona Enter.

### 2. KAPSO_API_KEY
API key de Kapso para enviar/recibir mensajes de WhatsApp.

**Obtener**: Kapso dashboard → Project Settings → API Keys

**Configurar**:
```bash
encore secret set --type local KAPSO_API_KEY
```
Pega tu API key cuando se solicite y presiona Enter.

### 3. KAPSO_PHONE_NUMBER_ID
ID del número de WhatsApp Business conectado a Kapso.

**Obtener**: Kapso dashboard → WhatsApp → Ver detalles del número

**Configurar**:
```bash
encore secret set --type local KAPSO_PHONE_NUMBER_ID
```
Pega el Phone Number ID cuando se solicite y presiona Enter.

**Nota**: Después de configurar los secrets, reinicia Encore:
```bash
# Detener: Ctrl+C en la terminal donde corre encore run
encore run
```

## 🧪 Testing sin WhatsApp real (Paso 2 - Recomendado)

Prueba el bot localmente sin necesidad de configurar webhooks:

```bash
curl -X POST http://localhost:4000/test/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola, quiero crear mi hogar",
    "from": "+56912345678"
  }'
```

Ejemplos de mensajes para probar:

```bash
# Saludar al bot
curl -X POST http://localhost:4000/test/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola", "from": "+56912345678"}'

# Crear un hogar
curl -X POST http://localhost:4000/test/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Quiero crear mi hogar, somos 4 personas", "from": "+56912345678"}'

# Consultar lista de compras
curl -X POST http://localhost:4000/test/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Necesito hacer mi lista de compras", "from": "+56912345678"}'
```

## 🌐 Configurar webhook en Kapso (Paso 3 - Para producción)

Una vez que hayas probado localmente, configura el webhook en Kapso:

### Opción A: Usando ngrok (desarrollo)

1. **Asegúrate de que ngrok esté corriendo y apuntando al puerto 4000**

2. **Obtén tu URL de ngrok**
   - Ejemplo: `https://abc123.ngrok.io`

3. **Configura el webhook en Kapso:**
   - Ve a: Kapso dashboard → Project Settings → Webhooks
   - Click en "Add Webhook"
   - URL: `https://tu-url-de-ngrok.ngrok.io/webhooks/whatsapp`
   - Eventos: Selecciona `whatsapp.message.received`
   - Guarda y verifica que esté activo

### Opción B: Usando Encore Cloud (producción)

1. **Despliega a Encore Cloud:**
```bash
git add .
git commit -m "Add WhatsApp bot"
git push encore
```

2. **Obtén la URL de producción:**
```bash
encore app show
```

3. **Configura el webhook en Kapso:**
   - URL: `https://tu-app.encr.app/webhooks/whatsapp`
   - Eventos: `whatsapp.message.received`

## 🏗️ Arquitectura

```
WhatsApp Usuario → Kapso API → Webhook (/webhooks/whatsapp)
                                    ↓
                          Message Processor
                                    ↓
                          Claude Agent SDK
                          (con MCP Tools)
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            Tools de WhatsApp              Tools de Database
            - send_whatsapp_message        - get_user_context
            - send_interactive_buttons     - create_household
                                          - add_household_member
                    ↓                               ↓
            Respuesta por WhatsApp          PostgreSQL (Encore)
```

## 📊 Base de datos

El servicio usa PostgreSQL con las siguientes tablas:

- **`users`** - Usuarios identificados por número de WhatsApp
- **`households`** - Hogares/familias con configuración
- **`household_members`** - Relación entre usuarios y hogares
- **`conversations`** - Estado de conversaciones con Claude

Las migrations se ejecutan automáticamente al iniciar Encore.

## 🔧 Estructura de archivos

```
/whatsapp/
├── encore.service.ts           # Definición del servicio
├── whatsapp.ts                 # Endpoints (webhook + testing)
├── agent.ts                    # Claude Agent SDK + Tools
├── message-processor.ts        # Procesador principal
├── whatsapp-client.ts          # Cliente SDK de Kapso
├── types.ts                    # Interfaces TypeScript
├── migrations/
│   └── 1_create_tables.up.sql # Schema de DB
└── README.md                   # Esta documentación
```

## 🎯 Funcionalidades implementadas

### ✅ Funcionalidades actuales:

- Recibir mensajes de texto por WhatsApp
- Responder usando Claude Sonnet 3.5
- Obtener contexto de usuario desde DB
- Crear hogares nuevos
- Agregar miembros a hogares
- Enviar mensajes de texto
- Enviar mensajes con botones interactivos

### 🔜 Próximas funcionalidades (roadmap):

- [ ] Transcripción de audios (ElevenLabs u OpenAI Whisper)
- [ ] Análisis de imágenes de despensa
- [ ] Extracción de ingredientes de fotos
- [ ] Planificador de menú semanal inteligente
- [ ] Generación automática de listas de compras
- [ ] Votación familiar de comidas
- [ ] Integración con API de supermercados para pedidos

## 🐛 Troubleshooting

### El webhook retorna 502
- **Causa**: Encore no está corriendo
- **Solución**: Ejecuta `encore run` en el directorio del proyecto

### No recibo respuestas del bot
- **Causa**: Los secrets no están configurados
- **Solución**: Configura los 3 secrets (ver sección "Configurar secrets")

### Error: "Connection refused" en ngrok
- **Causa**: Encore no está escuchando en el puerto correcto
- **Solución**: Verifica que Encore esté corriendo en puerto 4000

### Claude no responde o responde lento
- **Causa**: ANTHROPIC_API_KEY inválida o límite de rate
- **Solución**: Verifica tu API key en https://console.anthropic.com

### El bot no envía mensajes por WhatsApp
- **Causas posibles**:
  1. KAPSO_API_KEY o KAPSO_PHONE_NUMBER_ID incorrectos
  2. Webhook no configurado en Kapso
- **Solución**: 
  1. Verifica tus credenciales de Kapso
  2. Asegúrate de que el webhook esté activo en Kapso dashboard

## 📝 Logs y debugging

Para ver los logs de Encore en tiempo real:

```bash
# En la terminal donde corre encore run
# Los logs aparecerán automáticamente
```

Para ver qué está pensando Claude:

```bash
# Los logs incluyen "Claude thinking:" para ver el razonamiento interno
```

## 🚀 Deploy a producción

1. **Configura los secrets de producción:**
```bash
encore secret set --type prod ANTHROPIC_API_KEY
encore secret set --type prod KAPSO_API_KEY
encore secret set --type prod KAPSO_PHONE_NUMBER_ID
```

2. **Despliega:**
```bash
git push encore
```

3. **Actualiza el webhook en Kapso** con la URL de producción

## 📚 Recursos adicionales

- [Documentación de Encore.ts](https://encore.dev/docs)
- [Claude Agent SDK](https://docs.anthropic.com/en/docs/agent-sdk/overview)
- [Kapso API](https://docs.kapso.ai)
- [Kapso MCP](https://docs.kapso.ai/docs/mcp/introduction)

## 🆘 Soporte

Si encuentras problemas:

1. Revisa esta documentación
2. Verifica los logs de Encore
3. Prueba con el endpoint `/test/webhook` primero
4. Verifica que todos los secrets estén configurados correctamente

---

**Desarrollado para PlatanusHack 2025** 🚀
