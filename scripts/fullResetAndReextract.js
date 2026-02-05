#!/usr/bin/env node
/**
 * Flujo completo: pausa cron → limpia tablas → re-extrae desde CloudWatch → rebuild → reactiva cron.
 * El watermark (lastProcessedDay) se define según lo descargado de CloudWatch.
 *
 * Uso: node scripts/fullResetAndReextract.js [--prod]
 */

import { execSync } from "child_process";

const args = process.argv.slice(2);
const isProd = args.includes("--prod");
const convexRun = (fn, fnArgs = "") => {
  const parts = ["npx", "convex", "run", fn];
  if (fnArgs) parts.push(fnArgs);
  if (isProd) parts.push("--prod");
  const cmd = parts.join(" ");
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

console.log("========================================");
console.log("Reset completo + Re-extracción CloudWatch");
console.log(isProd ? "(producción)" : "(dev)");
console.log("========================================");

try {
  console.log("\n1. Pausando cron...");
  convexRun("mutations:setCronPaused", "'{\"paused\": true}'");

  console.log("\n2. Limpiando tablas...");
  execSync(`node scripts/clearConvexTables.js ${isProd ? "--prod" : ""}`, {
    stdio: "inherit",
  });

  console.log("\n3. Re-extracción + Rebuild (watermark desde CloudWatch)...");
  convexRun("cloudwatch:runFullReextractAndRebuild");

  console.log("\n✅ Proceso completado. Cron reactivado.");
} catch (err) {
  console.error("\n❌ Error:", err.message);
  console.log("Intentando reactivar cron...");
  try {
    convexRun("mutations:setCronPaused", "'{\"paused\": false}'");
  } catch (_) {
    console.error('No se pudo reactivar. Ejecuta: npx convex run mutations:setCronPaused \'{"paused": false}\'');
  }
  process.exit(1);
}
