/**
 * Script para poblar monthlyData en Convex con datos del Histórico Anual.
 * Lee data/2024-daily.csv y data/2025-daily.csv, agrega por (year, month)
 * e invoca seedData:seedAnnualMonthlyData.
 *
 * Uso: node scripts/seedAnnualToConvex.js [--prod]
 *   --prod  ejecuta contra el deployment de producción de Convex
 * Requiere: npx convex run (Convex CLI) y que los CSV existan en data/.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parsea un CSV diario (fecha, total_events) y agrega por (year, month).
 * Aplica UTC-6 (México) como en processCSV.js.
 * @returns {Map<string, number>} clave "YYYY-M" → suma de events
 */
function parseAndAggregateByMonth(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.trim().split("\n");
  const byMonth = new Map(); // "2024-1" -> sum

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const commaIdx = line.lastIndexOf(",");
    if (commaIdx === -1) continue;
    const timestamp = line.slice(0, commaIdx).trim();
    const events = parseInt(line.slice(commaIdx + 1).trim(), 10);
    if (Number.isNaN(events)) continue;

    const utcDate = new Date(timestamp.replace(" ", "T") + "Z");
    const mexicoDate = new Date(utcDate.getTime() - 6 * 60 * 60 * 1000);
    const year = mexicoDate.getUTCFullYear();
    const month = mexicoDate.getUTCMonth() + 1; // 1-12

    const key = `${year}-${month}`;
    byMonth.set(key, (byMonth.get(key) || 0) + events);
  }

  return byMonth;
}

/**
 * Construye el array { year, month, events } para meses 1-12 de cada año.
 */
function buildMonthlyRows(byMonth, years) {
  const rows = [];
  for (const year of years) {
    for (let month = 1; month <= 12; month++) {
      const key = `${year}-${month}`;
      rows.push({
        year,
        month,
        events: byMonth.get(key) || 0,
      });
    }
  }
  return rows;
}

function main() {
  const dataDir = path.join(__dirname, "..", "data");
  const csv2024 = path.join(dataDir, "2024-daily.csv");
  const csv2025 = path.join(dataDir, "2025-daily.csv");

  if (!fs.existsSync(csv2024) || !fs.existsSync(csv2025)) {
    console.error(
      "❌ Faltan data/2024-daily.csv o data/2025-daily.csv. Ejecute este script desde la raíz del proyecto."
    );
    process.exit(1);
  }

  const byMonth = new Map();
  for (const filePath of [csv2024, csv2025]) {
    const m = parseAndAggregateByMonth(filePath);
    for (const [k, v] of m) {
      byMonth.set(k, (byMonth.get(k) || 0) + v);
    }
  }

  const data = buildMonthlyRows(byMonth, [2024, 2025]);
  if (data.length !== 24) {
    console.warn(`⚠️ Se generaron ${data.length} filas (se esperaban 24).`);
  }

  const args = { data };
  const argsJson = JSON.stringify(args);

  const prod = process.argv.includes("--prod");
  const prodFlag = prod ? " --prod" : "";

  try {
    execSync(`npx convex run seedData:seedAnnualMonthlyData${prodFlag} '${argsJson}'`, {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
    console.log("✅ seedAnnualMonthlyData ejecutado correctamente.");
  } catch (e) {
    console.error("❌ Error al ejecutar convex run:", e.message);
    process.exit(1);
  }
}

main();
