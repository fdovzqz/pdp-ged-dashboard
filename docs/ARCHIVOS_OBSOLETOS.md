# Archivos Obsoletos después de la Migración a Convex

Después de validar que la migración a Convex funciona correctamente, los siguientes archivos pueden eliminarse o moverse a un respaldo:

## Archivos de Datos Estáticos (src/data/)

Estos archivos ya no son necesarios porque los datos ahora vienen de Convex:

- `src/data/historicalData.ts` - Migrado a tabla `dailyData` y `hourlyDistribution`
- `src/data/intradayData.ts` - Lógica migrada a `convex/queries.ts`
- `src/data/today-intraday.ts` - Migrado a tabla `intradayData` y `intradayMeta`
- `src/data/annualData.ts` - (revisar si se usa en otros dashboards)

## Scripts de Extracción (scripts/)

Estos scripts fueron reemplazados por la action de Convex:

- `scripts/fetchCloudWatch.js` - Migrado a `convex/cloudwatch.ts`
- `scripts/processCSV.js` - Ya no necesario (los datos se procesan en Convex)

## Archivos de Datos CSV (data/)

Estos archivos pueden mantenerse como respaldo histórico:

- `data/2024-01-31.csv` - Respaldo histórico
- `data/2024-daily.csv` - Respaldo histórico
- `data/2025-01-31.csv` - Respaldo histórico
- `data/2025-daily.csv` - Respaldo histórico
- `data/2026-01-MTD.csv` - Respaldo histórico (ya no se actualiza)
- `data/lastProcessedDay.json` - Reemplazado por tabla `processingControl`
- `data/today-intraday.json` - Reemplazado por tablas `intradayData`/`intradayMeta`

## Comandos para Eliminar

Una vez validada la migración, ejecutar:

```bash
# Eliminar archivos de datos estáticos
rm src/data/historicalData.ts
rm src/data/intradayData.ts
rm src/data/today-intraday.ts

# Eliminar scripts obsoletos
rm scripts/fetchCloudWatch.js
rm scripts/processCSV.js

# Mover CSV a carpeta de respaldo (opcional)
mkdir -p data/backup
mv data/*.csv data/backup/
mv data/*.json data/backup/
```

## Actualizar package.json

Eliminar los scripts obsoletos:

```json
{
  "scripts": {
    // ELIMINAR estos:
    // "fetch-today": "node scripts/fetchCloudWatch.js",
    // "update-data": "npm run fetch-today && node scripts/processCSV.js"
  }
}
```

## Nota Importante

**NO eliminar estos archivos hasta haber validado completamente:**

1. El seed de datos funciona correctamente
2. Todas las cifras coinciden con el checkpoint
3. El cron job de CloudWatch funciona
4. El dashboard muestra los datos correctamente
5. La actualización en tiempo real funciona

## Verificación Post-Limpieza

Después de eliminar los archivos, verificar:

```bash
# Compilación TypeScript
npx tsc --noEmit

# Build de producción
npm run build

# Lint
npm run lint
```
