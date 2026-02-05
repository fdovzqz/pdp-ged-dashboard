# Soporte Multi-Mes y Actualización Continua

## Resumen

Convex extrae y actualiza datos **a la fecha actual**:

- **Intradía:** Día en curso (1–5 min según horario México)
- **Diarios:** Días completos del mes actual
- **Mensuales:** Agregación en `monthlyData` al completar cada día

## Schema

- `dailyData`: campo `month` (1–12), índice `by_year_month_day`
- `hourlyDistribution`: campo `month`, índice `by_year_month_type_hour`

## Flujo

1. **Cron** (`convex/crons.ts`): cada 1 minuto
2. **CloudWatch** (`convex/cloudwatch.ts`):
   - Fecha actual en México (UTC-6)
   - Si cambia mes/año, reinicia desde día 1
   - Días completos → `dailyData`, `hourlyDistribution`, `monthlyData`
   - Día actual → `intradayData`, `intradayMeta`

## Extracción Manual

```bash
npx convex run cloudwatch:manualFetch
```

## Variables Requeridas

`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `CLOUDWATCH_LOG_GROUP` (opcional)
