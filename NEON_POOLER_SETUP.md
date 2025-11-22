# Configuración del Connection Pooler en Neon

## 🔴 Problema Actual

```
database planeat: connection pool error: Error { kind: Closed, cause: None }
```

Este error ocurre porque:
- **Neon Serverless** suspende las conexiones después de 60 segundos de inactividad
- **Pooler está Deshabilitado** en tu endpoint
- Las conexiones se cierran prematuramente

## ✅ Solución: Habilitar Connection Pooler

### Paso 1: Acceder a la Configuración de Neon

1. En **Encore Cloud Dashboard**, ve a **Infrastructure**
2. Haz click en **"ep-wandering-firefly-agsp23ii"** (tu Neon Endpoint)
3. Esto debería abrirte el dashboard de Neon

### Paso 2: Habilitar Pooler

En el dashboard de Neon:

1. Ve a la sección de tu database **"planeat-4ga2"**
2. Busca **Connection Settings** o **Endpoint Settings**
3. Encuentra la opción **"Connection Pooler"**
4. **Habilítalo** y selecciona el modo:
   - **Transaction mode**: Para apps serverless (RECOMENDADO)
   - **Session mode**: Para apps con conexiones largas

5. Guarda los cambios

### Paso 3: Actualizar Connection String (Si es necesario)

Después de habilitar el pooler, es posible que cambie la connection string:

```bash
# Verifica la nueva connection string
encore db conn-uri planeat --env production
```

Si cambió, Encore debería actualizarla automáticamente.

### Paso 4: Redesploy

Después de habilitar el pooler:

```bash
encore deploy production
```

## 🎯 Configuraciones Recomendadas para Neon + Encore

### En Neon Endpoint:

| Setting | Valor Recomendado | Actual |
|---------|-------------------|--------|
| **Pooler** | **Enabled** | ❌ Disabled |
| **Pooler Mode** | Transaction | - |
| **Min vCPUs** | 0.25 | ✅ 0.25 |
| **Max vCPUs** | 0.25 | ✅ 0.25 |
| **Suspend Timeout** | 300 (5 min) | ⚠️ 60 sec |

### Aumentar Suspend Timeout (Opcional)

Si sigues teniendo problemas:

1. En Neon, aumenta **Suspend Timeout** de 60 a 300 segundos
2. Esto evita que la BD se suspenda durante conversaciones activas

## 🔍 Verificar que Funcione

Después de los cambios:

### 1. Probar Conexión Local

```bash
# Usa el proxy para probar la conexión
encore db proxy --env production

# En otra terminal, prueba conectarte
psql $(encore db conn-uri planeat --env production)

# Dentro de psql, verifica las tablas:
\dt
```

### 2. Monitorear Logs

```bash
# Stream logs en tiempo real
encore logs --env production
```

### 3. Probar el Endpoint

Envía un mensaje de WhatsApp o usa el landing page y verifica que:
- No aparezca el error de "connection pool"
- Las queries funcionen correctamente
- Los logs muestren actividad normal

## 🚨 Si Aún No Funciona

### Opción 1: Contactar Soporte de Encore

El equipo de Encore puede revisar la configuración de Neon:

- **Discord**: https://encore.dev/discord
- Menciona: "Connection pool closed con Neon en production"
- App ID: `planeat-4ga2`

### Opción 2: Verificar Permisos de Red

En algunos casos, puede haber problemas de red entre Encore Compute y Neon:

1. En Encore Dashboard, ve a **Logs**
2. Busca errores como:
   - `connection refused`
   - `network unreachable`
   - `authentication failed`

### Opción 3: Recrear el Endpoint

Como último recurso:

```bash
# Esto recreará la infraestructura de BD
encore infra recreate --env production

# ⚠️ CUIDADO: Esto BORRARÁ los datos existentes
```

## 📋 Checklist

Antes de contactar soporte, verifica:

- [ ] Pooler está habilitado en Neon
- [ ] Pooler mode es "Transaction"
- [ ] Redesployaste después de cambios
- [ ] Las migraciones se aplicaron correctamente
- [ ] No hay otros errores en los logs
- [ ] La connection string es correcta
- [ ] El servicio whatsapp está "Ready" en el dashboard

## 🎓 Entender el Problema

### ¿Por qué pasa esto con Neon?

Neon es una base de datos **serverless** que:
- Se **suspende** después de inactividad (tu: 60 seg)
- Toma unos segundos en **"despertar"**
- Sin pooler, las conexiones pueden cerrarse antes de completarse

### ¿Por qué el Pooler ayuda?

El pooler:
- Mantiene conexiones activas
- Maneja la reconexión automática
- Optimiza para workloads serverless
- Reduce latencia de cold starts

### Transaction Mode vs Session Mode

- **Transaction Mode** (para Encore/Serverless):
  - Cada query es una transacción independiente
  - Libera conexiones entre queries
  - Mejor para workloads variables
  
- **Session Mode** (para apps tradicionales):
  - Mantiene conexión durante toda la sesión
  - Soporta todas las features de PostgreSQL
  - Consume más recursos

Para tu app de WhatsApp, **Transaction Mode es ideal**.

