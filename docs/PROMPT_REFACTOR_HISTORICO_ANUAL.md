# Prompt: Plan de refactor del Histórico Anual para obtener datos desde Convex

## Contexto para el modelo / desarrollador

El dashboard de PaGob Durango tiene dos vistas principales:

1. **Análisis Enero** (`JanuaryDashboard`): ya migrado a Convex. Obtiene datos vía `useQuery(api.queries.*)` de `dailyData`, `hourlyDistribution`, `intradayData`, etc. Los datos se acotan por `lastAvailableDay` (desde 2026) para comparaciones equivalentes entre 2024, 2025 y 2026.

2. **Histórico Anual** (`AnnualDashboard` → `AnnualComparisonSection`): **aún usa datos estáticos** en `src/data/annualData.ts`. Compara 2024 vs 2025 a nivel mensual, trimestral y anual.

Objetivo: **aplicar la misma lógica y patrones que en Análisis Enero** para que el Histórico Anual obtenga sus datos desde Convex (queries, estructura `{ sum, days }` cuando aplique, loading, y una única fuente de verdad).

---

## Estado actual del Histórico Anual

### Fuente de datos
- **Archivo:** `src/data/annualData.ts`
- **Origen:** objetos estáticos `dailyData2024Raw` y `dailyData2025Raw` (clave `YYYY-MM-DD` → pagos).
- **Derivados (calculados en el propio archivo):**
  - `monthlyComparisonData`: por mes, `{ month, monthName, '2024', '2025', difference, growthRate }`
  - `monthlyAccumulatedData`: por mes con `accumulated2024`, `accumulated2025`
  - `annualTotals`: `{ '2024': number, '2025': number }`
  - `annualGrowth`: `{ absolute, percentage }`
  - `annualDailyAverages`: `{ '2024', '2025' }` (total / 366 o 365)
  - `annualStats`: `maxMonth2024`, `minMonth2024`, `maxMonth2025`, `minMonth2025`, `monthsWithGrowth`, `monthsWithDecline`, `bestGrowthMonth`, `worstGrowthMonth`
  - `quarterlyData`: `{ '2024': { Q1, Q2, Q3, Q4 }, '2025': { Q1, Q2, Q3, Q4 } }`
  - `ANNUAL_YEAR_COLORS`: paleta para 2024/2025

### Componente que consume
- **`AnnualComparisonSection`** (`src/components/sections/AnnualComparisonSection.tsx`):
  - Tarjetas de resumen: totales 2024/2025, crecimiento año vs año, mejor mes 2025.
  - Gráficos: vista **Mensual** (barras) y **Acumulado** (áreas) con `monthlyComparisonData` / `monthlyAccumulatedData`.
  - Tabla de detalle mensual.
  - Bloque “Comparación por Trimestre” con `quarterlyData`.
  - Bloque “Statistics Summary” con `annualStats` (meses con crecimiento/descenso, mayor crecimiento/descenso).

### Esquema Convex actual
- **`dailyData`:** `{ year, day, events, isComplete }` con índice `by_year_day`. En la implementación actual se usa para **Enero** (day 1–31). No hay campo `month`.
- Otras tablas: `hourlyDistribution`, `intradayData`, `intradayMeta`, `processingControl`, `extractionLog`. No hay tabla de datos mensuales ni anuales.

---

## Requisitos del refactor

1. **Fuente de verdad en Convex**  
   - Los datos que hoy viven en `annualData.ts` deben poder provenir de Convex (o derivarse de tablas en Convex).  
   - Mantener coherencia con el patrón ya usado en Análisis Enero: queries tipadas, `useQuery`, estados de carga.

2. **Decisión de modelo de datos**  
   - **Opción A:** Nueva tabla `monthlyData` con `{ year, month, events }` (eventos por mes). Las queries agregarían por año, trimestre, etc.  
   - **Opción B:** Extender `dailyData` con `month` (1–12) y reutilizarla. Las queries de histórico anual agregarían por `(year, month)`. Implicaría ampliar ETL/seed/CloudWatch para meses distintos de enero.  
   - **Opción C:** Otra variante que consideres (p. ej. tabla `annualDailyData` con `year, month, day`).  
   - El plan debe **recomendar una opción** y justificar brevemente (simplicidad, ETL existente, evolución a 2026 u otros años).

3. **ETL y población inicial**  
   - Hoy `annualData.ts` contiene ~365/366 días por año para 2024 y 2025.  
   - Definir cómo se alimenta Convex:
     - Migración one-shot desde `annualData.ts` (script/mutation/seed) a la tabla elegida.
     - Y/o CSV/CloudWatch para años completos, si ya existen o se van a crear.  
   - Si el ETL de CloudWatch actual solo cubre enero, el plan debe indicar cómo se obtendrían (o no) el resto de meses para 2024/2025 y, si aplica, 2026.

4. **Queries Convex a implementar**  
   - Listar las queries necesarias para sustituir cada derivado de `annualData.ts`, por ejemplo:
     - `getAnnualMonthlyData` → equivalente a `monthlyComparisonData` (por mes: 2024, 2025, difference, growthRate).
     - `getAnnualMonthlyAccumulated` → equivalente a `monthlyAccumulatedData`.
     - `getAnnualTotals` → `annualTotals`.
     - `getAnnualGrowth` → `annualGrowth`.
     - `getAnnualDailyAverages` → `annualDailyAverages` (o derivado de totales y días del año).
     - `getAnnualStats` → `annualStats` (mejor/peor mes, meses con crecimiento/descenso, etc.).
     - `getAnnualQuarterlyData` → `quarterlyData`.
   - Si alguna se puede componer a partir de otras (p. ej. crecimiento a partir de totales), indicarlo para evitar duplicar lógica.

5. **Formato de respuestas y comparaciones**  
   - Seguir el criterio ya usado en “Distribución por Semana” y “L-V vs S-D”: cuando tenga sentido, devolver `{ sum, days }` (u otro par) para que los promedios se calculen como `sum / days` en el cliente.  
   - Para el histórico anual, aclarar en qué bloques aplica (p. ej. promedios diarios por año) y en cuáles no (p. ej. totales mensuales son solo suma).

6. **Cambios en el frontend**  
   - **`AnnualComparisonSection`:**
     - Sustituir imports desde `annualData.ts` por `useQuery(api.queries.*)`.
     - Añadir estado de carga (skeleton o spinner) mientras `useQuery` devuelve `undefined`.
     - Mantener la misma UI: tarjetas, gráficos Mensual/Acumulado, tabla mensual, trimestres, statistics summary.  
   - **`AnnualDashboard`:**  
     - Si hace falta, pasar datos o estado de carga a `AnnualComparisonSection`; por defecto se puede mantener la estructura actual y solo alimentar con datos de Convex.  
   - **`annualData.ts`:**  
     - Planificar su eliminación o dejarlo solo como respaldo/legacy hasta confirmar que Convex y ETL están estables. Si se elimina, mover `ANNUAL_YEAR_COLORS` (y tipos compartidos) a un módulo común (p. ej. `src/types` o `src/constants`).

7. **Compatibilidad y `lastAvailableDay`**  
   - El histórico anual hoy solo usa 2024 y 2025 completos. Si en el futuro se incluye 2026 (año parcial), el plan debe prever:
     - Cómo se definiría un “último mes/día disponible” para 2026.
     - Si las comparaciones 2024 vs 2025 se mantienen siempre sobre año completo y 2026 se trata aparte (p. ej. “YTD 2026” vs “mismo período 2025”).

8. **Testing y validación**  
   - Cómo comprobar que los totales, mensuales, trimestrales y estadísticas derivadas en Convex coinciden con los de `annualData.ts` antes de retirarlo (p. ej. tests o script de comparación).

---

## Entregables esperados del plan

1. **Sección 1 – Modelo de datos**  
   - Tabla(s) nueva(s) o cambios en `dailyData` (o alternativa elegida).  
   - Esquema en código (TypeScript/Convex) y un párrafo de justificación.

2. **Sección 2 – ETL y semilla**  
   - Pasos para poblar la tabla (seed, script, mutation, CSV, CloudWatch).  
   - Orden recomendado (p. ej. primero 2024/2025 desde `annualData` o CSV, luego automatización si aplica).

3. **Sección 3 – Queries**  
   - Lista de queries con firma (args y retorno) y una línea de descripción.  
   - Notas sobre `{ sum, days }` u otros formatos cuando aplique.

4. **Sección 4 – Cambios en componentes**  
   - Lista de archivos a tocar (`AnnualComparisonSection`, `AnnualDashboard`, `annualData.ts`, `src/types` o `constants`).  
   - Para cada uno: qué se elimina, qué se añade, qué se reemplaza (en 1–2 frases).

5. **Sección 5 – Migración y limpieza**  
   - Orden de implementación (schema → seed → queries → frontend).  
   - Cuándo y cómo eliminar o archivar `annualData.ts`.

6. **Sección 6 – Futuro (2026, año parcial)**  
   - Supuestos y extensión mínima (queries, `lastAvailableDay` por mes, etc.) si se agrega 2026 al histórico anual.

---

## Cómo usar este prompt

- Copiar este documento (o las secciones relevantes) en la instrucción para el modelo o en la descripción de la tarea.  
- Añadir referencias a archivos concretos si tu repo tiene rutas distintas:  
  - `convex/schema.ts`, `convex/queries.ts`, `convex/seedData.ts`  
  - `src/data/annualData.ts`  
  - `src/components/sections/AnnualComparisonSection.tsx`  
  - `src/pages/AnnualDashboard.tsx`  
- Si ya tienes decidido `monthlyData` vs extender `dailyData`, puedes indicarlo en el prompt y pedir que el plan se acote a esa opción.

---

## Ejemplo de redacción para la tarea

> Necesito un **plan de refactor** para que el **Histórico Anual** del dashboard de PaGob deje de usar `src/data/annualData.ts` y obtenga todos sus datos desde **Convex**, con la misma lógica y presentación que ya usamos en Análisis Enero (queries, `useQuery`, loading, y cuando tenga sentido `{ sum, days }` para promedios).
>
> Por favor, sigue el documento `docs/PROMPT_REFACTOR_HISTORICO_ANUAL.md` y entrega un plan con las 6 secciones indicadas: modelo de datos, ETL/semilla, queries, cambios en componentes, migración/limpieza y consideraciones para 2026 (año parcial).  
> Incluye en el plan las firmas de las queries y los cambios concretos en `AnnualComparisonSection` y `annualData.ts`.
