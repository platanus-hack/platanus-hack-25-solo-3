# 🚀 Setup PlanEat - Express.js

Guía rápida para configurar y ejecutar PlanEat.

## 📋 Requisitos

- Node.js 20+
- PostgreSQL 14 (AWS RDS recomendado)
- Cuenta de Kapso (WhatsApp Business API)
- API Key de Anthropic (Claude)

## ⚡ Quick Start

### 1. Instalar

```bash
npm install
```

### 2. Configurar Variables de Entorno

```bash
cp env.template .env
```

Edita `.env` con tus credenciales:

```env
# Database
DATABASE_URL=postgresql://user:pass@your-rds.amazonaws.com:5432/planeat

# WhatsApp
KAPSO_API_KEY=tu_key_de_kapso
KAPSO_PHONE_NUMBER_ID=tu_phone_id
WHATSAPP_BUSINESS_NUMBER=+56XXXXXXXXX

# AI
ANTHROPIC_API_KEY=tu_key_de_claude
```

### 3. Configurar Base de Datos

#### Opción A: AWS RDS (Recomendado)

1. Ve a AWS Console > RDS
2. Create database
   - Engine: PostgreSQL 14.x
   - Instance: db.t3.micro (free tier)
   - Master username: planeat_admin
   - Database name: planeat
   - Public access: Yes (solo para desarrollo)
3. Security Group: permite puerto 5432 desde tu IP
4. Copia el endpoint a `DATABASE_URL`

#### Opción B: PostgreSQL Local

```bash
# Instalar PostgreSQL
brew install postgresql@14  # macOS
# o
sudo apt install postgresql-14  # Linux

# Crear base de datos
createdb planeat

# Configurar DATABASE_URL
DATABASE_URL=postgresql://localhost:5432/planeat
```

### 4. Ejecutar Migraciones

```bash
npm run migrate
```

Deberías ver:

```
✅ Migration 1_create_tables.up.sql applied successfully
✅ Migration 2_add_family_members.up.sql applied successfully
✅ Migration 3_consolidate_members.up.sql applied successfully
✅ Migration 4_add_session_id.up.sql applied successfully
✅ All migrations completed successfully
```

### 5. Build Landing Page

```bash
npm run landing:build
```

### 6. Iniciar Servidor

```bash
# Opción A: Con script automático
./start.sh

# Opción B: Manual
npm run dev
```

El servidor estará en `http://localhost:4000`

## 🧪 Probar

### Health Check

```bash
curl http://localhost:4000/health
```

Respuesta:
```json
{"status":"ok","timestamp":"2025-11-22T..."}
```

### Test Webhook

```bash
curl -X POST http://localhost:4000/test/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola", "from": "+56912345678"}'
```

### Desde la Landing

1. Abre `http://localhost:4000`
2. Ingresa tu número de WhatsApp
3. Click "Comenzar"
4. Deberías recibir un mensaje en WhatsApp

## 📁 Estructura del Proyecto

```
planeat/
├── server.ts              # ⭐ Servidor Express
├── config/
│   └── env.ts            # Validación de env vars
├── db/
│   ├── connection.ts     # PostgreSQL connection
│   └── migrate.ts        # Migrations runner
├── whatsapp/
│   ├── routes.ts         # ⭐ Endpoints WhatsApp
│   ├── message-processor.ts
│   ├── agents/           # Agentes de IA
│   │   ├── router.ts     # Router principal
│   │   ├── onboarding.ts # Setup inicial
│   │   ├── menu-planner.ts
│   │   └── shopping-list.ts
│   ├── tools/            # Herramientas Claude
│   ├── migrations/       # SQL migrations
│   ├── db.ts            # DB adapter
│   └── secrets.ts       # Env vars
└── landing/              # Vue frontend
    ├── src/
    └── dist/            # Build estático
```

## 🔧 Scripts Disponibles

```bash
npm run dev              # Desarrollo (hot reload)
npm start                # Producción
npm run build            # Build completo
npm run migrate          # Ejecutar migraciones
npm run landing:dev      # Dev landing (Vite)
npm run landing:build    # Build landing
```

## 🌐 Endpoints API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/` | GET | Landing page |
| `/health` | GET | Health check |
| `/webhooks/whatsapp` | POST | Webhook de Kapso |
| `/test/webhook` | POST | Test local |
| `/start` | POST | Iniciar conversación |

## 🔒 Configurar Kapso Webhook

1. Ve a Kapso Dashboard: https://app.kapso.ai
2. Settings > Webhooks
3. URL: `https://tu-dominio.com/webhooks/whatsapp`
4. Events: selecciona todos
5. Save

Para desarrollo local con ngrok:

```bash
# Instalar ngrok
brew install ngrok  # macOS

# Exponer puerto local
ngrok http 4000

# Usar la URL de ngrok en Kapso
https://xxxx-xx-xxx-xxx-xxx.ngrok.io/webhooks/whatsapp
```

## 🐛 Troubleshooting

### Error: Cannot find module

```bash
npm install
npm run build
```

### Error: Database connection

Verifica:
- ✅ `DATABASE_URL` es correcto
- ✅ PostgreSQL está corriendo
- ✅ Security Group permite tu IP (RDS)
- ✅ Usuario y password correctos

### Error: Port already in use

```bash
# Ver qué usa el puerto 4000
lsof -ti:4000

# Matar proceso
lsof -ti:4000 | xargs kill -9

# O cambiar puerto en .env
PORT=3000
```

### Webhook no recibe mensajes

Verifica:
- ✅ URL del webhook configurada en Kapso
- ✅ Servidor accesible públicamente (usa ngrok para local)
- ✅ `KAPSO_PHONE_NUMBER_ID` correcto en `.env`

## 📚 Más Información

- **Documentación completa**: `README.md`
- **Agentes IA**: `whatsapp/agents/README.md`
- **Tools**: `whatsapp/tools/README.md`

## 🆘 Ayuda

Si encuentras problemas:

1. Revisa los logs del servidor
2. Verifica variables de entorno en `.env`
3. Asegúrate de que las migraciones se ejecutaron
4. Verifica conectividad a la base de datos

---

**¡Listo para usar!** 🎉

