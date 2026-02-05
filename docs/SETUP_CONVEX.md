# Configuración de Convex

## 1. Inicializar

```bash
npx convex dev
```

## 2. Variables de Entorno en Convex

```bash
npx convex env set AWS_ACCESS_KEY_ID "tu-access-key-id"
npx convex env set AWS_SECRET_ACCESS_KEY "tu-secret-access-key"
npx convex env set AWS_REGION "us-east-1"
npx convex env set CLOUDWATCH_LOG_GROUP "/aws/vendedlogs/states/..."
```

O desde el dashboard: Settings → Environment Variables.

## 3. Frontend (.env.local)

```bash
VITE_CONVEX_URL=https://tu-proyecto.convex.cloud
```

## 4. Poblar la Base de Datos

### Opción A: Seed manual (datos de ejemplo)

```bash
npx convex run seedData:seedAllData
node scripts/seedAnnualToConvex.js
npm run convex:seed:notes
npx convex run seedData:seedIntradayData   # Opcional: intradía de prueba
```

### Opción B: Re-extracción desde CloudWatch (datos reales)

```bash
npm run convex:full-reset   # Dev
# o
npm run convex:full-reset:prod   # Prod
```

Esto: pausa cron → limpia tablas → re-extrae desde CloudWatch → reconstruye agregados → reactiva cron.

## 5. Verificar Cron

Dashboard de Convex → Cron Jobs → `fetch-cloudwatch-data` (cada 1 min).

## 6. Extracción Manual

```bash
npx convex run cloudwatch:manualFetch
```

---

## Estructura de Tablas

| Tabla | Descripción |
|-------|-------------|
| `dailyData` | Datos diarios por año/mes |
| `monthlyData` | Histórico anual (2024, 2025, 2026) |
| `hourlyDistribution` | Distribución horaria weekday/weekend |
| `rawHourlyData` | Fuente única desde CloudWatch |
| `intradayData` | Día actual en progreso |
| `intradayMeta` | Última extracción intradía |
| `processingControl` | Último día procesado |
| `extractionLog` | Log de extracciones |
| `systemFlags` | cronPaused, reextractCanceled |
| `analysisNotes` | Notas contextuales del dashboard |

---

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `convex:seed` | Seed base (dailyData, hourlyDistribution) |
| `convex:seed-annual` | monthlyData desde CSV |
| `convex:seed:notes` | Notas de análisis |
| `convex:seed-intraday` | Intradía de prueba |
| `convex:clear` | Limpiar tablas |
| `convex:full-reset` | Reset + re-extracción CloudWatch |
| `convex:cancel-reextract` | Cancelar re-extracción en curso |
| `convex:validate-daily` | Validar datos vs CloudWatch |

---

## Troubleshooting

### Cron no se ejecuta
- Solo corre en **producción** (`npx convex deploy`)

### Datos no se actualizan
1. Verificar credenciales AWS
2. Revisar logs en Convex Dashboard
3. Ejecutar `npx convex run cloudwatch:manualFetch`

### Reset completo en producción
```bash
npm run convex:clear:prod
npx convex run seedData:seedAllData --prod
node scripts/seedAnnualToConvex.js --prod
npm run convex:seed:notes:prod
# Intradía: npx convex run seedData:seedIntradayData --prod
# O re-extracción: npm run convex:full-reset:prod
```
