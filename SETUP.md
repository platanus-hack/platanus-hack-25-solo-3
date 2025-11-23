# PlanEat - Setup y Deploy en Ubuntu

Guía completa para instalar y desplegar PlanEat en un servidor Ubuntu.

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación de Dependencias](#instalación-de-dependencias)
3. [Configuración del Proyecto](#configuración-del-proyecto)
4. [Base de Datos PostgreSQL](#base-de-datos-postgresql)
5. [Deploy con PM2](#deploy-con-pm2)
6. [Nginx como Reverse Proxy](#nginx-como-reverse-proxy)
7. [SSL con Let's Encrypt](#ssl-con-lets-encrypt)
8. [Integración con Frest API](#integración-con-frest-api)
9. [Mantenimiento](#mantenimiento)
10. [Troubleshooting](#troubleshooting)

---

## 🖥️ Requisitos Previos

### Servidor Ubuntu

- Ubuntu 20.04 LTS o superior
- Mínimo 1GB RAM (recomendado 2GB)
- 20GB espacio en disco
- Acceso root o usuario con sudo

### Dominios/DNS

- Dominio configurado apuntando al servidor
- Ejemplo: `planeat.life` → IP del servidor

---

## 📦 Instalación de Dependencias

### 1. Actualizar el Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Instalar Node.js 20.x

```bash
# Instalar Node.js desde NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version  # Debe ser v20.x
npm --version
```

### 3. Instalar PostgreSQL

```bash
# Instalar PostgreSQL 14+
sudo apt install -y postgresql postgresql-contrib

# Verificar que está corriendo
sudo systemctl status postgresql
```

### 4. Instalar PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Verificar instalación
pm2 --version
```

### 5. Instalar Nginx

```bash
sudo apt install -y nginx

# Iniciar y habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. Instalar Git

```bash
sudo apt install -y git
```

---

## 🚀 Configuración del Proyecto

### 1. Crear Usuario para la Aplicación

```bash
# Crear usuario planeat (sin privilegios root)
sudo adduser planeat

# Agregar al grupo www-data
sudo usermod -aG www-data planeat

# Cambiar a usuario planeat
sudo su - planeat
```

### 2. Clonar el Repositorio

```bash
cd /home/planeat
git clone https://github.com/tu-usuario/planeat.git
cd planeat/planeat
```

### 3. Instalar Dependencias del Proyecto

```bash
npm install
```

### 4. Configurar Variables de Entorno

```bash
# Copiar template
cp env.template .env

# Editar con tus valores
nano .env
```

**Contenido del `.env`:**

```bash
# Server
PORT=4000
NODE_ENV=production

# Database (PostgreSQL local o RDS)
DATABASE_URL=postgresql://planeat_user:password@localhost:5432/planeat

# WhatsApp / Kapso
KAPSO_API_KEY=tu_kapso_api_key
KAPSO_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_BUSINESS_NUMBER=56993112178

# AI
ANTHROPIC_API_KEY=tu_anthropic_api_key

# Frest API (Ecommerce)
FREST_API_URL=https://api.frest.cl
FREST_API_KEY=tu_frest_api_key
```

**Guardar:** `Ctrl + O`, `Enter`, `Ctrl + X`

---

## 🗄️ Base de Datos PostgreSQL

### 1. Configurar PostgreSQL

```bash
# Cambiar a usuario postgres
sudo su - postgres

# Entrar a psql
psql
```

### 2. Crear Base de Datos y Usuario

```sql
-- Crear usuario
CREATE USER planeat_user WITH PASSWORD 'password_seguro_aqui';

-- Crear base de datos
CREATE DATABASE planeat OWNER planeat_user;

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE planeat TO planeat_user;

-- Salir
\q
exit
```

### 3. Configurar Acceso Remoto (Opcional)

Si necesitas acceder desde otra máquina:

```bash
# Editar configuración de PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Buscar y cambiar:

```
listen_addresses = 'localhost'  →  listen_addresses = '*'
```

```bash
# Editar reglas de acceso
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Agregar al final:

```
host    all             all             0.0.0.0/0               md5
```

```bash
# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### 4. Ejecutar Migraciones

```bash
# Como usuario planeat
cd /home/planeat/planeat/planeat

# Ejecutar migraciones
npm run migrate
```

Deberías ver:

```
✅ Migration 1_create_tables.up.sql completed
✅ Migration 2_add_family_members.up.sql completed
✅ Migration 3_consolidate_members.up.sql completed
✅ Migration 4_add_session_id.up.sql completed
✅ Migration 5_add_indexes.up.sql completed
```

### 5. Verificar Base de Datos

```bash
# Conectar a la base de datos
psql -U planeat_user -d planeat -h localhost

# Listar tablas
\dt

# Verificar tablas creadas:
# - users
# - households
# - household_members
# - conversations
# - shopping_lists
# - menu_plans
# - recipes

# Salir
\q
```

---

## 🔧 Deploy con PM2

### 1. Compilar el Proyecto

```bash
cd /home/planeat/planeat/planeat
npm run build
```

Debe completar sin errores.

### 2. Crear Archivo de Configuración PM2

```bash
nano ecosystem.config.cjs
```

**Contenido:**

```javascript
module.exports = {
  apps: [
    {
      name: "planeat",
      script: "./dist/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
```

### 3. Crear Directorio de Logs

```bash
mkdir -p logs
```

### 4. Iniciar con PM2

```bash
# Iniciar aplicación
pm2 start ecosystem.config.cjs

# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs planeat

# Guardar configuración para auto-inicio
pm2 save

# Configurar inicio automático al bootear
pm2 startup
# Copiar y ejecutar el comando que PM2 te muestra
```

### 5. Verificar que Funciona

```bash
# Probar endpoint de salud
curl http://localhost:4000/health

# Debería retornar:
# {"status":"ok","timestamp":"..."}
```

---

## 🌐 Nginx como Reverse Proxy

### 1. Crear Configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/planeat
```

**Contenido:**

```nginx
server {
    listen 80;
    server_name planeat.life www.planeat.life;

    # Logs
    access_log /var/log/nginx/planeat-access.log;
    error_log /var/log/nginx/planeat-error.log;

    # Aumentar tamaño de body (para imágenes de WhatsApp)
    client_max_body_size 20M;

    # Landing page (archivos estáticos)
    location / {
        root /home/planeat/planeat/planeat/dist;
        try_files $uri $uri/ /index.html;

        # Cache para assets
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
            expires 7d;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts para webhooks de WhatsApp
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:4000;
        access_log off;
    }
}
```

### 2. Habilitar el Sitio

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/planeat /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Si todo OK, recargar Nginx
sudo systemctl reload nginx
```

### 3. Verificar

```bash
# Debería retornar HTML de la landing page
curl http://planeat.life

# Debería retornar JSON
curl http://planeat.life/health
```

---

## 🔒 SSL con Let's Encrypt

### 1. Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtener Certificado SSL

```bash
sudo certbot --nginx -d planeat.life -d www.planeat.life
```

Sigue las instrucciones:

- Email de contacto
- Aceptar términos
- Elegir redirección HTTPS (opción 2)

### 3. Verificar Auto-Renovación

```bash
# Certbot configura auto-renovación, probarlo:
sudo certbot renew --dry-run
```

### 4. Verificar HTTPS

```bash
curl https://planeat.life/health
```

---

## 🛒 Integración con Frest API

### 1. Verificar Variables de Entorno

```bash
# Asegurarse que están configuradas en .env
nano /home/planeat/planeat/planeat/.env
```

```bash
FREST_API_URL=https://api.frest.cl  # URL de producción
FREST_API_KEY=tu_api_key_produccion
```

### 2. Probar Conexión

```bash
cd /home/planeat/planeat/planeat
npx tsx test-frest-productos.ts
```

Deberías ver:

```
✅ TEST DE PRODUCTOS COMPLETADO EXITOSAMENTE
```

### 3. Reiniciar Aplicación

```bash
pm2 restart planeat
```

---

## 🔧 Mantenimiento

### Ver Logs

```bash
# Logs de la aplicación
pm2 logs planeat

# Logs de Nginx
sudo tail -f /var/log/nginx/planeat-access.log
sudo tail -f /var/log/nginx/planeat-error.log

# Logs del sistema
sudo journalctl -u nginx -f
```

### Actualizar la Aplicación

```bash
cd /home/planeat/planeat/planeat

# Pull cambios
git pull origin main

# Instalar nuevas dependencias
npm install

# Compilar
npm run build

# Ejecutar migraciones (si hay nuevas)
npm run migrate

# Reiniciar
pm2 restart planeat
```

### Backup de Base de Datos

```bash
# Crear backup
pg_dump -U planeat_user planeat > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U planeat_user planeat < backup_20251122.sql
```

### Monitoreo

```bash
# CPU y memoria de la app
pm2 monit

# Estado del servidor
htop

# Espacio en disco
df -h

# Logs en tiempo real
pm2 logs planeat --lines 100
```

---

## 🔥 Troubleshooting

### La Aplicación No Inicia

```bash
# Ver logs detallados
pm2 logs planeat --err

# Verificar que el puerto no está en uso
sudo lsof -i :4000

# Verificar variables de entorno
pm2 env 0

# Reiniciar desde cero
pm2 delete planeat
pm2 start ecosystem.config.cjs
```

### Error de Conexión a PostgreSQL

```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Probar conexión manualmente
psql -U planeat_user -d planeat -h localhost

# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### Nginx Retorna 502 Bad Gateway

```bash
# Verificar que la app está corriendo
pm2 status

# Ver logs de Nginx
sudo tail -f /var/log/nginx/planeat-error.log

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Webhooks de WhatsApp No Llegan

```bash
# Verificar que el endpoint está accesible
curl -X POST https://planeat.life/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Ver logs de la aplicación
pm2 logs planeat | grep webhook

# Verificar firewall
sudo ufw status

# Permitir puertos si está bloqueado
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Error de Memoria (Out of Memory)

```bash
# Aumentar límite de memoria en ecosystem.config.cjs
nano ecosystem.config.cjs
# Cambiar: max_memory_restart: '2G'

# Reiniciar
pm2 restart planeat

# Monitorear uso
pm2 monit
```

### Frest API No Responde

```bash
# Probar conexión
npx tsx test-frest.ts

# Verificar variables
echo $FREST_API_URL
echo $FREST_API_KEY

# Ver logs
pm2 logs planeat | grep Frest
```

---

## 📊 Checklist de Deploy

### Pre-Deploy

- [ ] Dominio configurado apuntando al servidor
- [ ] Acceso SSH al servidor
- [ ] API Keys obtenidas (Anthropic, Kapso, Frest)
- [ ] Repositorio con últimos cambios

### Durante Deploy

- [ ] ✅ Node.js 20.x instalado
- [ ] ✅ PostgreSQL instalado y configurado
- [ ] ✅ Base de datos creada con usuario
- [ ] ✅ Migraciones ejecutadas correctamente
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Aplicación compilada sin errores
- [ ] ✅ PM2 corriendo la aplicación
- [ ] ✅ Nginx configurado como reverse proxy
- [ ] ✅ SSL instalado con Let's Encrypt
- [ ] ✅ Webhook de WhatsApp configurado

### Post-Deploy

- [ ] ✅ Landing page accesible en HTTPS
- [ ] ✅ API health check responde
- [ ] ✅ Logs sin errores críticos
- [ ] ✅ Enviar mensaje de prueba por WhatsApp
- [ ] ✅ Verificar que el bot responde
- [ ] ✅ Probar flujo completo (onboarding → lista)
- [ ] ✅ Configurar backups automáticos
- [ ] ✅ Configurar monitoreo

---

## 🔗 URLs Importantes

- **Landing Page:** https://planeat.life
- **API Health:** https://planeat.life/health
- **Webhook WhatsApp:** https://planeat.life/api/whatsapp/webhook
- **Logs PM2:** `/home/planeat/planeat/planeat/logs/`
- **Logs Nginx:** `/var/log/nginx/planeat-*`

---

## 📚 Recursos Adicionales

- [Documentación de PM2](https://pm2.keymetrics.io/)
- [Nginx Official Docs](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Kapso WhatsApp API](https://docs.kapso.io/)
- [Anthropic Claude API](https://docs.anthropic.com/)

---

## 🆘 Soporte

Para problemas o preguntas:

1. Revisar logs: `pm2 logs planeat`
2. Consultar esta documentación
3. Revisar issues en GitHub
4. Contactar al equipo de desarrollo

---

**Última actualización:** 23 de Noviembre, 2025  
**Versión:** 2.0.0  
**Estado:** ✅ Producción Ready
