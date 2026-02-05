# Portal de Pagos - Dashboard Durango

Dashboard de análisis de pagos del Estado de Durango. Comparativa histórica 2024–2026 con datos en tiempo real desde AWS CloudWatch vía Convex.

## Tecnologías

- **Frontend:** React, TypeScript, Vite, Tailwind, Recharts, Framer Motion
- **Backend:** Convex (real-time database)
- **Datos:** AWS CloudWatch Logs

## Pantallas

- **Análisis Enero** – Comparativa 2024/2025/2026 para enero
- **Mes Actual** – Mes en curso con intradía y proyecciones
- **Histórico Anual** – Comparativa mensual 2024 vs 2025 vs 2026

## Desarrollo

```bash
npm install
npm run dev
npx convex dev   # En otra terminal
```

## Documentación

- [SETUP_CONVEX.md](docs/SETUP_CONVEX.md) – Configuración de Convex
- [REFACTOR_CONVEX.md](docs/REFACTOR_CONVEX.md) – Arquitectura técnica
- [MIGRACION_MES_ACTUAL.md](docs/MIGRACION_MES_ACTUAL.md) – Soporte multi-mes

## Scripts Principales

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run convex:dev` | Convex en modo desarrollo |
| `npm run convex:deploy` | Deploy a Convex |
| `npm run convex:full-reset` | Reset + re-extracción desde CloudWatch |
