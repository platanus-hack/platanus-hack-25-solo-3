# Instalación de Fuentes para Generación de Imágenes

Las imágenes de recetas usan Sharp/SVG que requiere fuentes instaladas en el sistema.

## Fuentes requeridas

El sistema usa estas fuentes (en orden de prioridad):
1. **DejaVu Sans** (recomendada, viene por defecto en Ubuntu)
2. **Liberation Sans** (alternativa)
3. **sans-serif** (fallback genérico)

## Verificar fuentes instaladas

```bash
fc-list | grep -i dejavu
fc-list | grep -i liberation
```

## Instalar fuentes (si no están instaladas)

### Ubuntu/Debian

```bash
# Instalar fuentes DejaVu (recomendado)
sudo apt update
sudo apt install fonts-dejavu fonts-dejavu-core fonts-dejavu-extra

# O instalar Liberation fonts
sudo apt install fonts-liberation fonts-liberation2

# Actualizar cache de fuentes
sudo fc-cache -fv
```

### Verificar que Sharp puede usar las fuentes

Después de instalar, verifica que las fuentes estén disponibles:

```bash
fc-list | grep -i "dejavu sans"
```

Deberías ver algo como:
```
/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf: DejaVu Sans:style=Book
/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf: DejaVu Sans:style=Bold
```

## Troubleshooting

Si las imágenes generadas muestran cuadraditos en lugar de texto:

1. **Verifica que las fuentes estén instaladas:**
   ```bash
   fc-list | grep -i dejavu
   ```

2. **Instala las fuentes faltantes:**
   ```bash
   sudo apt install fonts-dejavu-core
   sudo fc-cache -fv
   ```

3. **Reinicia el servidor Node.js:**
   ```bash
   pm2 restart planeat
   ```

4. **Genera una nueva imagen** para probar.

## Fuentes alternativas

Si DejaVu Sans no funciona, puedes cambiar en `whatsapp/clients/image-composer.ts`:

```typescript
font-family="Noto Sans, Ubuntu, sans-serif"
```

E instalar:
```bash
sudo apt install fonts-noto fonts-ubuntu
```

