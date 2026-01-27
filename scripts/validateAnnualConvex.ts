/**
 * Script para validar que los datos del Histórico Anual en Convex coinciden
 * con los de _archive/annualData.legacy.ts. Requiere monthlyData poblado (npm run convex:seed-annual).
 *
 * Uso: npm run validate-annual
 * Requiere: npx convex run, datos en monthlyData (npm run convex:seed-annual).
 */
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

import {
  monthlyComparisonData,
  monthlyAccumulatedData,
  annualTotals,
  annualGrowth,
  annualStats,
  quarterlyData,
} from "../_archive/annualData.legacy";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");

function runQuery(name: string): unknown {
  const out = execSync(`npx convex run queries:${name}`, {
    encoding: "utf-8",
    cwd: root,
  });
  return JSON.parse(out.trim()) as unknown;
}

// Esperado para getAnnualDailyAverages: Convex devuelve { sum, days }
const expectedDailyAverages = {
  "2024": { sum: annualTotals["2024"], days: 366 },
  "2025": { sum: annualTotals["2025"], days: 365 },
};

const TOLERANCE = 1e-6;

function approx(a: number, b: number): boolean {
  return Math.abs(a - b) < TOLERANCE;
}

function compareMonthly(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  return (
    a.month === b.month &&
    a.monthName === b.monthName &&
    (a["2024"] as number) === (b["2024"] as number) &&
    (a["2025"] as number) === (b["2025"] as number) &&
    approx((a.difference as number) ?? 0, (b.difference as number) ?? 0) &&
    approx((a.growthRate as number) ?? 0, (b.growthRate as number) ?? 0)
  );
}

function compareAccumulated(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  return (
    a.month === b.month &&
    a.monthName === b.monthName &&
    (a["2024"] as number) === (b["2024"] as number) &&
    (a["2025"] as number) === (b["2025"] as number) &&
    (a.accumulated2024 as number) === (b.accumulated2024 as number) &&
    (a.accumulated2025 as number) === (b.accumulated2025 as number)
  );
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a === "number" && typeof b === "number") return approx(a, b);
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((x, i) => deepEqual(x, b[i]));
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ak = Object.keys(a as object).sort();
    const bk = Object.keys(b as object).sort();
    if (ak.length !== bk.length || ak.some((k, i) => ak[i] !== bk[i])) return false;
    return ak.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
  }
  return false;
}

function main(): void {
  console.log("Validando Convex vs _archive/annualData.legacy.ts...\n");

  let ok = true;

  const convexMonthly = runQuery("getAnnualMonthlyData") as Record<string, unknown>[];
  if (convexMonthly.length !== monthlyComparisonData.length) {
    console.error("❌ getAnnualMonthlyData: longitud distinta");
    ok = false;
  } else {
    const match = convexMonthly.every((c, i) =>
      compareMonthly(c as Record<string, unknown>, monthlyComparisonData[i] as unknown as Record<string, unknown>)
    );
    if (!match) {
      console.error("❌ getAnnualMonthlyData: datos no coinciden");
      ok = false;
    } else console.log("✓ getAnnualMonthlyData");
  }

  const convexAccumulated = runQuery("getAnnualMonthlyAccumulated") as Record<string, unknown>[];
  if (convexAccumulated.length !== monthlyAccumulatedData.length) {
    console.error("❌ getAnnualMonthlyAccumulated: longitud distinta");
    ok = false;
  } else {
    const match = convexAccumulated.every((c, i) =>
      compareAccumulated(c as Record<string, unknown>, monthlyAccumulatedData[i] as unknown as Record<string, unknown>)
    );
    if (!match) {
      console.error("❌ getAnnualMonthlyAccumulated: datos no coinciden");
      ok = false;
    } else console.log("✓ getAnnualMonthlyAccumulated");
  }

  const convexTotals = runQuery("getAnnualTotals") as Record<string, number>;
  if (
    convexTotals["2024"] !== annualTotals["2024"] ||
    convexTotals["2025"] !== annualTotals["2025"]
  ) {
    console.error("❌ getAnnualTotals: no coinciden");
    ok = false;
  } else console.log("✓ getAnnualTotals");

  const convexGrowth = runQuery("getAnnualGrowth") as { absolute: number; percentage: string };
  if (
    convexGrowth.absolute !== annualGrowth.absolute ||
    convexGrowth.percentage !== annualGrowth.percentage
  ) {
    console.error("❌ getAnnualGrowth: no coinciden");
    ok = false;
  } else console.log("✓ getAnnualGrowth");

  const convexDaily = runQuery("getAnnualDailyAverages") as Record<string, { sum: number; days: number }>;
  if (
    convexDaily["2024"].sum !== expectedDailyAverages["2024"].sum ||
    convexDaily["2024"].days !== expectedDailyAverages["2024"].days ||
    convexDaily["2025"].sum !== expectedDailyAverages["2025"].sum ||
    convexDaily["2025"].days !== expectedDailyAverages["2025"].days
  ) {
    console.error("❌ getAnnualDailyAverages: no coinciden");
    ok = false;
  } else console.log("✓ getAnnualDailyAverages");

  const convexQuarterly = runQuery("getAnnualQuarterlyData") as Record<string, Record<string, number>>;
  if (!deepEqual(convexQuarterly, quarterlyData)) {
    console.error("❌ getAnnualQuarterlyData: no coinciden");
    ok = false;
  } else console.log("✓ getAnnualQuarterlyData");

  const convexStats = runQuery("getAnnualStats") as Record<string, unknown>;
  const keys: (keyof typeof annualStats)[] = [
    "maxMonth2024", "minMonth2024", "maxMonth2025", "minMonth2025",
    "monthsWithGrowth", "monthsWithDecline", "bestGrowthMonth", "worstGrowthMonth",
  ];
  for (const k of keys) {
    const c = convexStats[k] as Record<string, unknown>;
    const e = annualStats[k] as Record<string, unknown>;
    if (k === "monthsWithGrowth" || k === "monthsWithDecline") {
      if (c !== e) {
        console.error(`❌ getAnnualStats.${k}: no coincide`);
        ok = false;
        break;
      }
    } else if (!compareMonthly(c ?? {}, e ?? {})) {
      console.error(`❌ getAnnualStats.${k}: no coincide`);
      ok = false;
      break;
    }
  }
  if (ok) console.log("✓ getAnnualStats");

  console.log("");
  if (ok) {
    console.log("✅ Validación correcta: Convex coincide con _archive/annualData.legacy.ts.");
  } else {
    console.error("❌ Validación fallida. Revisar seed (npm run convex:seed-annual) y origen de datos.");
    process.exit(1);
  }
}

main();
