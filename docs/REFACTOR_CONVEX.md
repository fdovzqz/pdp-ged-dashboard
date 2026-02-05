# Refactor a Convex - Documentación Técnica

## Resumen

El dashboard de PaGob Durango usa **Convex** como backend real-time. Los datos provienen de **AWS CloudWatch** y se procesan automáticamente mediante un cron.

### Flujo Actual

```
┌─────────────────────┐
│   AWS CloudWatch    │
│   (Logs Insights)   │
└─────────┬───────────┘
          │ Re-extracción / Cron
          ▼
┌─────────────────────┐
│  convex/cloudwatch  │
│  rawHourlyData      │
└─────────┬───────────┘
          │ rebuildAggregatesFromRaw
          ▼
┌─────────────────────┐
│   Convex Database   │
│  dailyData          │
│  monthlyData        │
│  hourlyDistribution │
│  intradayData       │
└─────────┬───────────┘
          │ WebSocket
          ▼
┌─────────────────────┐
│   React Frontend    │
│   (useQuery hooks)  │
└─────────────────────┘
```

---

## Esquema de Base de Datos

```typescript
// convex/schema.ts (resumen)

dailyData: { year, month?, day, events, isComplete }
  .index("by_year_month_day")

monthlyData: { year, month, events }
  .index("by_year_month")

hourlyDistribution: { year, month?, dayType, hour, events }
  .index("by_year_month_type_hour")

intradayData: { day, hour, events, cumulative }
  .index("by_day_hour")

intradayMeta: { day, lastExtraction, lastExtractionIso }
  .index("by_day")

rawHourlyData: { year, month, day, hour, events }  // Fuente única desde CloudWatch
  .index("by_year_month_day_hour")

processingControl: { key, lastCompleteDay, lastProcessedTimestamp, year, month }
  .index("by_key")

extractionLog: { timestamp, recordsProcessed, status, errorMessage? }

systemFlags: { key, value, updatedAt }  // cronPaused, reextractCanceled
  .index("by_key")

analysisNotes: { id, yearLabel, content, accentColor, order }  // Notas contextuales
  .index("by_order")
```

---

## Cron Job

```typescript
// convex/crons.ts
crons.interval("fetch-cloudwatch-data", { minutes: 1 }, internal.cloudwatch.fetchAndUpdateData);
```

- **Intervalo:** 1 minuto (9:00–21:00 MX) o 5 min fuera de horario
- **Solo producción:** Los crons no corren en `npx convex dev`

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev
npx convex dev

# Deploy
npx convex deploy --yes

# Seed
npm run convex:seed              # dailyData, hourlyDistribution, processingControl
npm run convex:seed-annual       # monthlyData (2024, 2025)
npm run convex:seed:notes        # analysisNotes
npm run convex:seed-intraday     # intradayData (prueba)

# Reset completo (CloudWatch como fuente)
npm run convex:full-reset        # dev
npm run convex:full-reset:prod   # prod

# Limpiar tablas
npm run convex:clear
npm run convex:clear:prod

# Extracción manual
npx convex run cloudwatch:manualFetch

# Validación
npm run convex:validate-daily
npm run validate-annual
```

---

## Queries Principales

| Query | Descripción |
|-------|-------------|
| `getHistoricalData` | Datos diarios por mes (2024, 2025, 2026) |
| `getLastAvailableDay` | Último día completo |
| `getTotals` | Totales por año |
| `getIntradayData` | Día actual + proyecciones |
| `getForecastData` | Proyección hasta día 31 |
| `getHourlyDistribution` | Distribución por hora |
| `getAnnualMonthlyData` | Histórico anual 2024 vs 2025 vs 2026 |
| `getAnalysisNotes` | Notas de análisis |
| `getProcessingContext` | Mes/año/corte actual |

---

## Variables de Entorno

### Convex (Dashboard → Settings)
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION=us-east-1
CLOUDWATCH_LOG_GROUP
```

### Frontend (.env.local)
```
VITE_CONVEX_URL=https://tu-proyecto.convex.cloud
```

---

## Referencias

- [Convex Documentation](https://docs.convex.dev/)
- [Convex Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs)
- [AWS CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/)
