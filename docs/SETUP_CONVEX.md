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
npx convex run seedData:clearAllData
npx convex run seedData:seedAllData
```

## Estructura de Tablas

- `dailyData` - Datos diarios por año
- `hourlyDistribution` - Distribución horaria (weekday/weekend)
- `intradayData` - Datos del día actual en progreso
- `intradayMeta` - Metadatos de última extracción
- `processingControl` - Control del último día procesado
- `extractionLog` - Log de extracciones para monitoreo

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
