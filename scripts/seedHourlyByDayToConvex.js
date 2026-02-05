/**
 * DEPRECADO: Los datos horarios ahora provienen de CloudWatch vía rawHourlyData.
 * Use la re-extracción completa:
 *   1. npm run convex:clear
 *   2. npx convex run cloudwatch:runFullReextract
 *   3. npx convex run cloudwatch:runRebuildAggregates
 */
console.warn(`
⚠️  Este script está deprecado.
   Los datos horarios se obtienen desde CloudWatch (rawHourlyData).
   Para re-extraer todo: npx convex run cloudwatch:runFullReextract
   Luego: npx convex run cloudwatch:runRebuildAggregates
`);
process.exit(1);
