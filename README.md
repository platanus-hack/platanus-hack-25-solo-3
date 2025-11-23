# PlanEat - AI Meal Planning via WhatsApp

Sistema de planificación de comidas y listas de compras inteligente usando WhatsApp Business y Claude AI.

## 🚀 Quick Start

### 1. Clonar e instalar

```bash
cd planeat
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 3. Configurar base de datos

Crea una instancia RDS PostgreSQL 14 en AWS y copia la connection string a `DATABASE_URL`.

### 4. Ejecutar migraciones

```bash
npm run migrate
```

### 5. Build landing page

```bash
npm run landing:build
```

### 6. Iniciar servidor

```bash
npm run dev
```

El servidor estará en `http://localhost:4000`

## 📁 Estructura

```
planeat/
├── server.ts              # Servidor Express principal
├── config/
│   └── env.ts            # Variables de entorno
├── db/
│   ├── connection.ts     # Conexión PostgreSQL
│   └── migrate.ts        # Script de migraciones
├── whatsapp/
│   ├── routes.ts         # Endpoints WhatsApp
│   ├── message-processor.ts
│   ├── agents/           # Agentes de IA
│   ├── tools/            # Herramientas Claude
│   ├── migrations/       # Migraciones SQL
│   ├── db.ts            # Database adapter
│   └── secrets.ts       # Secrets
├── landing/              # Frontend Vue
│   └── dist/            # Build estático
└── package.json
```

## 🔧 Scripts

```bash
npm run dev           # Desarrollo con hot reload
npm run build         # Build completo (landing + TS)
npm start             # Producción
npm run migrate       # Ejecutar migraciones
npm run db:clean      # Limpiar base de datos (requiere --force)
npm run db:reset      # Limpiar + migrar (requiere --force)
npm run landing:dev   # Dev landing (Vite)
npm run landing:build # Build landing
```

## 🌐 Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `GET /` | GET | Landing page |
| `GET /health` | GET | Health check |
| `POST /webhooks/whatsapp` | POST | Webhook Kapso |
| `POST /test/webhook` | POST | Test webhook |
| `POST /start` | POST | Iniciar conversación |

## 💾 Base de Datos

Usa AWS RDS PostgreSQL 14:

1. Crea instancia RDS en AWS Console
2. Security Group: permite puerto 5432
3. Copia endpoint a `DATABASE_URL` en `.env`
4. Ejecuta `npm run migrate`

## 🤖 Agentes IA

- **Router**: Enrutador principal de conversaciones
- **Onboarding**: Setup inicial del usuario
- **Menu Planner**: Planificación de menús semanales
- **Shopping List**: Gestión de lista de compras
- **Ecommerce**: Compra de productos

## 📦 Deploy

### Desarrollo Local

```bash
npm run dev
```

### Producción (EC2)

```bash
# En EC2
git clone <repo>
cd planeat
cp .env.example .env
# Editar .env
npm install
npm run build
npm run migrate

# Con PM2
pm2 start dist/server.js --name planeat
pm2 save
pm2 startup
```

## 🔒 Variables de Entorno

Ver `.env.example` para todas las variables requeridas.

### Esenciales

- `DATABASE_URL`: Connection string de PostgreSQL
- `KAPSO_API_KEY`: API key de Kapso
- `KAPSO_PHONE_NUMBER_ID`: ID del número de WhatsApp
- `ANTHROPIC_API_KEY`: API key de Claude

## 🛠️ Tech Stack

- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL 14 (AWS RDS)
- **AI**: Claude 3.5 (Anthropic)
- **WhatsApp**: Kapso Cloud API
- **Frontend**: Vue 3 + Vite + Tailwind CSS

## 📝 Licencia

MPL-2.0

---

**Desarrollado para PlatanusHack 2025** 🚀

