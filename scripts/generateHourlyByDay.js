/**
 * DEPRECADO: Los datos horarios ahora provienen de CloudWatch vía rawHourlyData.
 * Use: npx convex run cloudwatch:runFullReextract
 * Luego: npx convex run cloudwatch:runRebuildAggregates
 */
console.warn(`
⚠️  Este script está deprecado.
   Los datos se obtienen desde CloudWatch.
   Use: npx convex run cloudwatch:runFullReextract
`);
process.exit(1);
