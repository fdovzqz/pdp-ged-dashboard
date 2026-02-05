# Configuración de Convex

Este documento describe los pasos para configurar Convex en el proyecto PaGob Durango Dashboard.

## 1. Inicializar Convex

```bash
# Iniciar el servidor de desarrollo de Convex
npx convex dev
```

Esto te pedirá crear una cuenta de Convex si no la tienes, y configurará tu proyecto.

## 2. Configurar Variables de Entorno en Convex

Las credenciales de AWS deben configurarse en el dashboard de Convex para que la función de CloudWatch funcione:

```bash
# Configurar variables de entorno
npx convex env set AWS_ACCESS_KEY_ID "tu-access-key-id"
npx convex env set AWS_SECRET_ACCESS_KEY "tu-secret-access-key"
npx convex env set AWS_REGION "us-east-1"
npx convex env set CLOUDWATCH_LOG_GROUP "/aws/vendedlogs/states/PaymentProcessStateMachineLogs/master"
```

O puedes configurarlas desde el dashboard de Convex:
1. Ve a https://dashboard.convex.dev
2. Selecciona tu proyecto
3. Ve a Settings > Environment Variables
4. Agrega las siguientes variables:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION` (us-east-1)
   - `CLOUDWATCH_LOG_GROUP`

## 3. Configurar Variable de Entorno del Frontend

Agrega la URL de Convex a tu archivo `.env.local`:

```bash
VITE_CONVEX_URL=https://tu-proyecto.convex.cloud
```

La URL la obtienes al ejecutar `npx convex dev`.

## 4. Poblar la Base de Datos (Seed)

Ejecuta la mutation de seed para cargar los datos históricos:

```bash
# Desde el dashboard de Convex o usando la CLI
npx convex run seedData:seedAllData
```

O desde el dashboard:
1. Ve a Functions
2. Busca `seedData:seedAllData`
3. Ejecuta la función

## 5. Verificar el Cron Job

El cron job se activará automáticamente al desplegar. Puedes verificar su estado en:
1. Dashboard de Convex > Cron Jobs
2. Debería aparecer "fetch-cloudwatch-data" ejecutándose cada 5 minutos

## 6. Testing Manual

Para probar la extracción de CloudWatch manualmente:

```bash
npx convex run cloudwatch:manualFetch
```

## Troubleshooting

### Error de credenciales AWS
Verifica que las variables de entorno estén configuradas correctamente:
```bash
npx convex env list
```

### Datos no aparecen en el frontend
1. Verifica que el seed se ejecutó: `npx convex run seedData:checkIfSeeded`
2. Verifica la conexión de Convex en la consola del navegador
3. Asegúrate de que `VITE_CONVEX_URL` esté configurado correctamente

### Limpiar y re-seed
Si necesitas reiniciar los datos:
```bash
npm run convex:clear
npx convex run seedData:seedAllData
node scripts/seedAnnualToConvex.js
# Intradía (día 26 de prueba; o usa cloudwatch:manualFetch si tienes AWS):
npx convex run seedData:seedIntradayData
```

### Recuperar producción tras datos duplicados
Si los números en prod aparecen duplicados (p. ej. por haber ejecutado `seedAllData` varias veces sin limpiar), haz un reset completo y re-seed. **Nota:** `convex:clear` también borra `intradayData` e `intradayMeta`; tras el seed hay que repoblar intradía (seed o CloudWatch).

**Producción:**
```bash
# 1. Limpiar todas las tablas
npm run convex:clear:prod

# 2. Seed de datos base (diarios, distribución horaria, processingControl)
npx convex run seedData:seedAllData --prod

# 3. Histórico anual (monthlyData)
node scripts/seedAnnualToConvex.js --prod

# 4. Intradía: datos de prueba (día 26) O CloudWatch real si tienes AWS en prod:
npx convex run seedData:seedIntradayData --prod
# Alternativa con datos reales: npx convex run cloudwatch:manualFetch --prod
```

A partir de ahora `seedAllData` **borra antes de insertar** las tablas que escribe, así que volver a ejecutarlo no duplicará datos.

### Reset completo + Re-extracción desde CloudWatch
Para borrar todo y re-extraer desde CloudWatch (rawHourlyData como fuente única):

1. **Pausa el cron** durante el proceso
2. Limpia tablas
3. Re-extrae desde CloudWatch y reconstruye agregados
4. **El watermark se define según lo descargado de CloudWatch**
5. Reactiva el cron

```bash
# Dev
npm run convex:full-reset

# Producción
npm run convex:full-reset:prod
```

### Alinear dev y prod
Para que dev tenga los mismos datos que prod (dailyData, monthlyData, intradayData, etc.):

**Dev (sin --prod):**
```bash
npm run convex:clear
npx convex run seedData:seedAllData
node scripts/seedAnnualToConvex.js
npx convex run seedData:seedIntradayData
```

**Prod:** usa `npm run convex:clear:prod` para limpiar, y `--prod` en `convex run` y `node scripts/seedAnnualToConvex.js --prod`.

## Estructura de Tablas

- `dailyData` - Datos diarios por año
- `monthlyData` - Histórico anual (2024, 2025) por mes
- `hourlyDistribution` - Distribución horaria (weekday/weekend)
- `intradayData` - Datos del día actual en progreso
- `intradayMeta` - Metadatos de última extracción
- `processingControl` - Control del último día procesado
- `extractionLog` - Log de extracciones para monitoreo
- `systemFlags` - Flags de sistema (p. ej. `cronPaused`); no se borra en clear

## Cifras de Control (Checkpoint 26 Enero 2026, 14:41 MX)

Después del seed, verifica estas cifras:

| Año  | Total (días 1-25) | Promedio Diario |
|------|-------------------|-----------------|
| 2024 | 27,950            | 1,118           |
| 2025 | 29,897            | 1,196           |
| 2026 | 34,570            | 1,383           |

Crecimientos:
- 2024 → 2025: +7.0%
- 2025 → 2026: +15.6%
- 2024 → 2026: +23.7%
