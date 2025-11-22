# Database Connection Troubleshooting

## 🔴 Error: Connection Pool Error - Closed

```
database planeat: connection pool error: Error { kind: Closed, cause: None }
```

Este error indica que el pool de conexiones a PostgreSQL está cerrado o no disponible.

## 🔍 Diagnóstico

### 1. Verificar que la Base de Datos Existe en Producción

En Encore Cloud Dashboard:

1. Ve a https://app.encore.cloud
2. Selecciona tu app `planeat`
3. Ve al ambiente de **Production**
4. Busca en la sección **Infrastructure** > **Databases**
5. ¿Ves una base de datos llamada `planeat`?

#### ✅ Si la base de datos EXISTE:
- Verifica el estado (debe estar "Running")
- Revisa los logs de la base de datos

#### ❌ Si la base de datos NO EXISTE:
Encore debe crearla automáticamente. Si no lo hizo:

```bash
# Desde CLI, forzar creación de infraestructura
encore infra recreate --env production
```

### 2. Verificar Configuración de la Base de Datos

Revisa tu archivo de configuración:

**`whatsapp/db.ts`:**
```typescript
export const db = new SQLDatabase("planeat", { 
  migrations: "./migrations" 
});
```

✅ El nombre `"planeat"` debe coincidir con el usado en toda la app.

### 3. Verificar Migraciones

Las migraciones deben aplicarse en producción:

**Desde Encore Dashboard:**
1. Ve a **Databases** > `planeat`
2. Revisa la sección **Migrations**
3. ¿Se aplicaron todas las migraciones?

**Migraciones en tu app:**
```
whatsapp/migrations/
├── 1_create_tables.up.sql
├── 2_add_family_members.up.sql
├── 3_consolidate_members.up.sql
└── 4_add_session_id.up.sql
```

Si las migraciones no se aplicaron:

```bash
# Desde CLI
encore db migrate --env production
```

### 4. Verificar Límites de Conexión

PostgreSQL tiene límites de conexiones simultáneas:

**Free tier de Encore:**
- Max connections: ~20-25

**Si alcanzaste el límite:**
1. Revisa cuántas instancias de la app están corriendo
2. Reduce el pool size en producción
3. Actualiza el plan si es necesario

### 5. Verificar Logs Completos

En Encore Dashboard:

1. Ve a **Logs** (ambiente production)
2. Filtra por servicio `whatsapp`
3. Busca errores adicionales antes del connection pool error:

```bash
# Mensajes clave a buscar:
- "migration failed"
- "database initialization"
- "connection refused"
- "authentication failed"
```

## 🔧 Soluciones Comunes

### Solución 1: Forzar Recreación de Infraestructura

```bash
# Desde tu máquina local
encore infra recreate --env production --yes
```

⚠️ **Advertencia:** Esto recreará la base de datos (perderás datos).

### Solución 2: Verificar Deploy Completo

Asegúrate de que el deploy se completó correctamente:

```bash
# Ver estado del último deploy
encore deploy list --env production

# Si está en progreso o falló, intenta de nuevo
encore deploy production
```

### Solución 3: Revisar Configuración de Red

En ambientes VPC custom, verifica:
- Security groups permiten conexiones al puerto 5432
- La app puede alcanzar la base de datos
- DNS está configurado correctamente

### Solución 4: Configuración Manual de Conexión

Si usas una base de datos externa (no managed por Encore):

1. Configura las variables de entorno en Encore Dashboard
2. Asegúrate de que las credenciales sean correctas

## 🆘 Solución Temporal: Usar Base de Datos de Desarrollo

Si necesitas que funcione YA mientras resuelves producción:

1. En Encore Dashboard, crea un ambiente **Staging**
2. Deploy a staging en lugar de production
3. Staging tendrá su propia base de datos

```bash
encore deploy staging
```

## 📞 Contactar Soporte de Encore

Si nada funciona, contacta al equipo de Encore:

**Discord:** https://encore.dev/discord
**Email:** support@encore.dev

Provee:
- App ID: `planeat-4ga2`
- Environment: `production`
- Error message completo
- Timestamp del error

## 🔍 Comandos de Diagnóstico Útiles

```bash
# Ver información de la base de datos
encore db conn-uri planeat --env production

# Ver logs en tiempo real
encore logs --env production

# Ver estado de infraestructura
encore infra show --env production

# Probar conexión local
encore db proxy --env production
# Luego en otra terminal:
psql $(encore db conn-uri planeat --env production)
```

## ✅ Checklist de Verificación

- [ ] Base de datos existe en Encore Dashboard
- [ ] Estado de la base de datos es "Running"
- [ ] Todas las migraciones se aplicaron correctamente
- [ ] Deploy completado exitosamente (no en progreso)
- [ ] Logs no muestran errores de migración
- [ ] No hay límite de conexiones alcanzado
- [ ] Otras partes de la app funcionan (endpoints que no usan DB)
- [ ] El mismo código funciona en desarrollo/staging

## 🐛 Si Nada Funciona: Plan B

Como workaround temporal, puedes desactivar features que usen la BD:

1. Comenta temporalmente las queries en `claude-agent-client.ts`
2. Usa memoria en lugar de base de datos para sesiones
3. Deploy una versión mínima que funcione
4. Resuelve el problema de DB en paralelo

