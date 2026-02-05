#!/usr/bin/env node
/**
 * Limpia todas las tablas de datos en Convex usando `convex import --replace`.
 * Es el método recomendado por Convex: eficiente, atómico y sin límite de lecturas.
 *
 * Uso: node scripts/clearConvexTables.js [--prod]
 */

import { execSync } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

const TABLES = [
  "dailyData",
  "monthlyData",
  "hourlyDistribution",
  "rawHourlyData",
  "intradayData",
  "intradayMeta",
  "processingControl",
  "extractionLog",
];

const args = process.argv.slice(2);
const isProd = args.includes("--prod");
const convexArgs = isProd ? ["--prod"] : [];

const emptyPath = join(process.cwd(), "empty_clear.jsonl");

try {
  writeFileSync(emptyPath, "", "utf8");
  console.log("🗑️ Limpiando tablas con convex import --replace...\n");

  for (const table of TABLES) {
    const cmd = ["npx", "convex", "import", "--replace", "-y", "--table", table, emptyPath, ...convexArgs];
    console.log(`   ${table}...`);
    execSync(cmd.join(" "), { stdio: "inherit" });
  }

  console.log("\n✅ Todas las tablas limpiadas.");
} finally {
  if (existsSync(emptyPath)) {
    unlinkSync(emptyPath);
  }
}
