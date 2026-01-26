# Refactor a Convex - Documentación Técnica

## Resumen del Cambio

Se migró el dashboard de PaGob Durango de un sistema de **datos estáticos** (archivos TypeScript y JSON) a una arquitectura **real-time** usando **Convex** como backend-as-a-service.

### Antes (Arquitectura Estática)
```
/data/
  ├── 2024-01-31.csv
  ├── 2025-01-31.csv
  ├── 2026-01-MTD.csv
  ├── today-intraday.json
  └── lastProcessedDay.json

/src/data/
  ├── historicalData.ts      # Datos hardcodeados
  ├── intradayData.ts        # Lógica de cálculo
  └── today-intraday.ts      # Datos intradía
```

**Flujo anterior:**
1. Ejecutar manualmente `node scripts/fetchCloudWatch.js`
2. Procesar CSV con `node scripts/processCSV.js`
3. Commit y deploy para ver cambios

### Después (Arquitectura Real-Time con Convex)
```
/convex/
  ├── schema.ts              # Esquema de base de datos
  ├── queries.ts             # Consultas (read-only)
  ├── mutations.ts           # Mutaciones (write)
  ├── cloudwatch.ts          # Acción de extracción AWS
  ├── crons.ts               # Scheduled function (cada 5 min)
  └── seedData.ts            # Datos iniciales
```

**Flujo actual:**
1. Cron automático cada 5 minutos extrae datos de CloudWatch
2. Frontend recibe actualizaciones en tiempo real vía WebSocket
3. Sin intervención manual necesaria

---

## Arquitectura

### Esquema de Base de Datos (Convex)

```typescript
// convex/schema.ts
dailyData: defineTable({
  year: v.number(),           // 2024, 2025, 2026
  day: v.number(),            // 1-31
  events: v.number(),         // Total de pagos
  isComplete: v.boolean(),    // ¿Día completo?
  dayType: v.string(),        // "weekday" | "weekend"
})

hourlyDistribution: defineTable({
  year: v.number(),
  dayType: v.string(),        // "weekday" | "weekend"
  hour: v.number(),           // 0-23
  total: v.number(),
  average: v.number(),
})

intradayData: defineTable({
  day: v.number(),
  hour: v.number(),
  events: v.number(),
  accumulated: v.number(),
})

intradayMeta: defineTable({
  day: v.number(),
  lastExtraction: v.string(), // "HH:MM"
  currentHour: v.number(),
})

processingControl: defineTable({
  key: v.string(),            // "lastProcessedDay"
  value: v.number(),
})

extractionLog: defineTable({
  timestamp: v.string(),
  recordsProcessed: v.number(),
  success: v.boolean(),
  error: v.optional(v.string()),
})
```

### Flujo de Datos

```
┌─────────────────────┐
│   AWS CloudWatch    │
│   (Logs Insights)   │
└─────────┬───────────┘
          │ Query cada 5 min
          ▼
┌─────────────────────┐
│  convex/cloudwatch  │
│   (internalAction)  │
└─────────┬───────────┘
          │ Mutations
          ▼
┌─────────────────────┐
│   Convex Database   │
│  (Real-time sync)   │
└─────────┬───────────┘
          │ WebSocket
          ▼
┌─────────────────────┐
│   React Frontend    │
│   (useQuery hooks)  │
└─────────────────────┘
```

### Cron Job

```typescript
// convex/crons.ts
crons.interval(
  "fetch-cloudwatch-data",
  { minutes: 5 },
  internal.cloudwatch.fetchAndUpdateData
);
```

**Nota importante:** Los cron jobs solo se ejecutan en el deployment de **producción**, no en desarrollo local (`npx convex dev`).

---

## Variables de Entorno

### Convex (Dashboard → Settings → Environment Variables)
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
CLOUDWATCH_LOG_GROUP=/aws/vendedlogs/states/PaymentProcessStateMachineLogs/master
```

### Vercel (Project → Settings → Environment Variables)
```
VITE_CONVEX_URL=https://adorable-goldfish-856.convex.cloud
```

### Local (.env.local)
```
CONVEX_DEPLOYMENT=dev:calculating-raccoon-19
VITE_CONVEX_URL=https://calculating-raccoon-19.convex.cloud
```

---

## Comandos Útiles

```bash
# Desarrollo local (conecta a Convex dev)
npm run dev
npx convex dev

# Deploy a producción
npx convex deploy --yes

# Seed de datos históricos
npx convex run seedData:seedAllData --prod

# Trigger manual de extracción
npx convex run cloudwatch:manualFetch --prod

# Ver última extracción
npx convex run queries:getLastExtraction --prod

# Configurar variable de entorno en producción
npx convex env set AWS_ACCESS_KEY_ID "valor" --prod
```

---

## Queries Principales

| Query | Descripción |
|-------|-------------|
| `getHistoricalData` | Datos diarios de los 3 años |
| `getLastAvailableDay` | Último día completo (ej: 25) |
| `getTotals` | Totales por año |
| `getTotalsUpToDay` | Totales hasta un día específico |
| `getIntradayData` | Datos del día actual + proyecciones |
| `getForecastData` | Proyección hasta día 31 |
| `getHourlyDistribution` | Distribución por hora |
| `getLastExtraction` | Último log de extracción |

---

## Lógica de Negocio

### Zona Horaria
- CloudWatch almacena timestamps en **UTC**
- Se convierten a **México (UTC-6)** para agrupar por día/hora local
- El cron se ejecuta cada 5 minutos en UTC, pero los datos se procesan en hora MX

### Día Completo
Un día se marca como `isComplete: true` cuando:
- La fecha actual (hora MX) es **posterior** al día en cuestión
- Es decir, a las 00:00 MX del día siguiente

### Proyecciones Intradía
```typescript
// Factor de progreso por hora (basado en patrones históricos)
const hourlyProgress = [
  0.01, 0.02, 0.02, 0.02, 0.02, 0.03, 0.04, 0.06, 0.10, 0.16,
  0.24, 0.34, 0.45, 0.55, 0.64, 0.72, 0.79, 0.85, 0.89, 0.93,
  0.96, 0.98, 0.99, 1.0,
];

// Proyección = actual / progreso_esperado
const proyeccion = currentTotal / hourlyProgress[currentHour];
```

---

## Cifras de Control (Checkpoint)

Estas cifras deben coincidir para validar la integridad de los datos:

| Métrica | Valor |
|---------|-------|
| Total 2024 (días 1-25) | 27,950 |
| Total 2025 (días 1-25) | 29,897 |
| Total 2026 (días 1-25) | 34,570 |
| Crecimiento 2024→2025 | +7.0% |
| Crecimiento 2025→2026 | +15.6% |
| Crecimiento 2024→2026 | +23.7% |
| Total mes 2024 | 45,471 |
| Total mes 2025 | 46,803 |

---

## Ideas de Mejora

### 🔧 Código y Arquitectura

1. **Separar queries en módulos**
   ```
   convex/
     queries/
       historical.ts
       intraday.ts
       forecast.ts
       stats.ts
   ```

2. **Crear tipos compartidos**
   ```typescript
   // convex/types.ts
   export type YearType = "2024" | "2025" | "2026";
   export interface DailyData { ... }
   export interface IntradayData { ... }
   ```

3. **Validación de datos en mutations**
   - Usar Zod o validators de Convex para validar datos de CloudWatch
   - Detectar anomalías (picos inusuales, datos faltantes)

4. **Error handling mejorado**
   - Implementar reintentos automáticos en la acción de CloudWatch
   - Notificaciones (Slack/email) cuando falla la extracción

5. **Tests**
   - Unit tests para funciones de cálculo (proyecciones, promedios)
   - Integration tests para queries de Convex
   - E2E tests con Playwright para el dashboard

### 🚀 Performance

1. **Índices optimizados**
   ```typescript
   dailyData: defineTable({...})
     .index("by_year_day", ["year", "day"])
     .index("by_year", ["year"])  // Añadir para queries frecuentes
   ```

2. **Caché en frontend**
   - Los datos históricos (2024, 2025) no cambian
   - Considerar React Query o SWR para caché agresivo

3. **Lazy loading de gráficas**
   ```typescript
   const ForecastChart = lazy(() => import('./ForecastChart'));
   ```

4. **Virtualización de listas largas**
   - Si se añaden más años, virtualizar con `react-window`

5. **Code splitting mejorado**
   ```typescript
   // vite.config.ts
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'recharts': ['recharts'],
           'motion': ['framer-motion'],
         }
       }
     }
   }
   ```

### 📊 Usabilidad

1. **Indicador de última actualización global**
   - Mostrar "Última actualización: hace 3 min" en header
   - Indicador visual cuando hay datos nuevos

2. **Modo offline**
   - Service Worker para cachear datos
   - Mostrar datos cacheados si no hay conexión

3. **Exportar datos**
   - Botón para exportar a CSV/Excel
   - Exportar gráficas como imagen

4. **Filtros avanzados**
   - Seleccionar rango de fechas personalizado
   - Comparar períodos específicos (semana 1 vs semana 2)

5. **Alertas configurables**
   - "Avisar si el día actual está 20% debajo del promedio"
   - Notificaciones push en el navegador

6. **Dark/Light mode**
   - Actualmente solo dark mode
   - Toggle para light mode

7. **Accesibilidad**
   - Mejorar contraste de colores
   - Navegación por teclado en gráficas
   - Descripciones para lectores de pantalla

### 🔐 Seguridad

1. **Rotación de credenciales AWS**
   - Usar roles IAM en lugar de access keys
   - Implementar rotación automática

2. **Rate limiting**
   - Limitar llamadas a queries públicas
   - Proteger contra abuse

3. **Auditoría**
   - Log de quién accede al dashboard
   - Historial de cambios en datos

### 📈 Funcionalidades Futuras

1. **Comparación multi-mes**
   - No solo Enero, sino cualquier mes
   - Vista anual completa

2. **Predicción con ML**
   - Usar datos históricos para predecir tendencias
   - Detección de anomalías automática

3. **Dashboard móvil**
   - App nativa o PWA optimizada
   - Notificaciones push

4. **API pública**
   - Endpoints REST para integración con otros sistemas
   - Webhooks para eventos importantes

5. **Multi-tenant**
   - Soporte para múltiples portales de pago
   - Comparativas entre estados/regiones

---

## Troubleshooting

### WebSocket Error 1006
- Verificar que `VITE_CONVEX_URL` no tenga slash al final
- Verificar que el deployment de Convex esté activo

### Cron no se ejecuta
- Los crons solo corren en **producción** (`npx convex deploy`)
- Verificar con `npx convex run queries:getLastExtraction --prod`

### Datos no se actualizan
1. Verificar credenciales AWS en Convex
2. Revisar logs en Convex Dashboard → Logs
3. Ejecutar manualmente: `npx convex run cloudwatch:manualFetch --prod`

### Build falla en Vercel
- Asegurar que `tsconfig.app.json` tenga `"types": ["vite/client", "node"]`
- Verificar que `VITE_CONVEX_URL` esté configurada

---

## Referencias

- [Convex Documentation](https://docs.convex.dev/)
- [Convex Scheduled Functions](https://docs.convex.dev/scheduling/cron-jobs)
- [AWS CloudWatch Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html)
- [Recharts Documentation](https://recharts.org/)
