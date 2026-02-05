# Migración: Soporte Multi-Mes y Actualización Continua

## Cambios realizados

Se actualizó el sistema para que Convex extraiga y actualice datos **a la fecha actual**, manteniendo sincronizados:

- **Intradía**: Datos del día en curso (actualización cada 1-5 min según horario)
- **Diarios**: Días completos del mes actual
- **Mensuales**: Agregación automática en `monthlyData` al completar cada día

## Cambios en el schema

- `dailyData`: Se añadió el campo `month` (1-12). Índice `by_year_month_day`.
- `hourlyDistribution`: Se añadió el campo `month`. Índice `by_year_month_type_hour`.

## Re-seed necesario

Tras desplegar estos cambios, **debes re-ejecutar el seed** porque el schema cambió:

```bash
# 1. Seed de datos diarios e intradía (Enero)
npx convex run seedData:seedAllData

# 2. Seed de datos mensuales (histórico anual 2024, 2025)
node scripts/seedAnnualToConvex.js
```

## Flujo de actualización automática

1. **Cron** (`convex/crons.ts`): Se ejecuta cada minuto.
2. **CloudWatch** (`convex/cloudwatch.ts`):
   - Obtiene la fecha actual en México (UTC-6).
   - Si cambió el mes/año, reinicia desde el día 1.
   - Procesa días completos → `dailyData` + `hourlyDistribution` + `monthlyData`.
   - Procesa el día actual (incompleto) → `intradayData` + `intradayMeta`.
3. **Variables de entorno** requeridas: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `CLOUDWATCH_LOG_GROUP` (opcional).

## Extracción manual

Para forzar una extracción manual:

```bash
npx convex run cloudwatch:manualFetch
```
