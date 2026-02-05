// Script para procesar los CSV y actualizar Convex (dailyData, hourlyDistribution)
// NOTA: Los timestamps en CSV están en UTC, hay que restar 6 horas para México (UTC-6)
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prod = process.argv.includes('--prod');
const prodFlag = prod ? ' --prod' : '';

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  // Skip header
  const data = {};
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const commaIdx = line.lastIndexOf(',');
    if (commaIdx === -1) continue;
    const timestamp = line.slice(0, commaIdx).replace(/^"|"$/g, '').trim();
    const eventCount = parseInt(line.slice(commaIdx + 1).trim(), 10);
    if (Number.isNaN(eventCount)) continue;

    // Parse UTC timestamp and convert to Mexico time (UTC-6)
    const utcDate = new Date(timestamp.replace(' ', 'T') + 'Z'); // Parse as UTC
    const mexicoDate = new Date(utcDate.getTime() - (6 * 60 * 60 * 1000)); // Subtract 6 hours
    
    // Format date as YYYY-MM-DD
    const year = mexicoDate.getUTCFullYear();
    const month = String(mexicoDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(mexicoDate.getUTCDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    
    if (!data[date]) {
      data[date] = 0;
    }
    data[date] += eventCount;
  }
  
  return data;
}

// Process each file (archivos renombrados con formato descriptivo)
const data2026 = parseCSV(path.join(__dirname, '../data/2026-01-MTD.csv'));
const data2025 = parseCSV(path.join(__dirname, '../data/2025-01-31.csv'));
const data2024 = parseCSV(path.join(__dirname, '../data/2024-01-31.csv'));

// Calcular último día disponible automáticamente
const days2026Array = Object.entries(data2026)
  .filter(([date]) => date.startsWith('2026-01'))
  .map(([date]) => parseInt(date.split('-')[2], 10));
let lastDay2026 = Math.max(...days2026Array);

// Verificar si el último día está completo (comparar con hora actual en México)
const now = new Date();
const mexicoNow = new Date(now.getTime() - 6 * 60 * 60 * 1000); // Restar 6 horas para hora de México
const todayDay = mexicoNow.getUTCDate();
const todayHour = mexicoNow.getUTCHours();
const todayMonth = mexicoNow.getUTCMonth();
const todayYear = mexicoNow.getUTCFullYear();

// Si el último día es hoy y aún no son las 23:00 en México, excluirlo (día incompleto)
if (lastDay2026 === todayDay && todayMonth === 0 && todayYear === 2026 && todayHour < 23) {
  console.log(`\n⚠️  Día ${lastDay2026} está incompleto (hora actual en México: ${todayHour}:00)`);
  console.log(`   Excluyendo del procesamiento histórico. Solo se incluirá en datos intradía.`);
  lastDay2026 = todayDay - 1;
}

console.log(`\n========================================`);
console.log(`Procesando datos hasta el día ${lastDay2026} (solo días completos)`);
console.log(`========================================`);

// Build dailyData for Convex (2024, 2025: full month 1-31; 2026: 1 to lastDay2026)
const dailyDataForConvex = [];
for (const year of [2024, 2025, 2026]) {
  const maxDay = year === 2026 ? lastDay2026 : 31;
  for (let day = 1; day <= maxDay; day++) {
    const dateKey = `${year}-01-${day.toString().padStart(2, '0')}`;
    const events = (year === 2024 ? data2024 : year === 2025 ? data2025 : data2026)[dateKey] || 0;
    dailyDataForConvex.push({
      year,
      month: 1,
      day,
      events,
      isComplete: true,
    });
  }
}

// Calculate totals dynamically
let total2024 = 0;
let total2025 = 0;
let total2026 = 0;

for (let day = 1; day <= lastDay2026; day++) {
  const date2024 = `2024-01-${day.toString().padStart(2, '0')}`;
  const date2025 = `2025-01-${day.toString().padStart(2, '0')}`;
  const date2026 = `2026-01-${day.toString().padStart(2, '0')}`;
  
  total2024 += data2024[date2024] || 0;
  total2025 += data2025[date2025] || 0;
  total2026 += data2026[date2026] || 0;
}

console.log(`\nTotales calculados:`);
console.log(`  2024: ${total2024.toLocaleString()}`);
console.log(`  2025: ${total2025.toLocaleString()}`);
console.log(`  2026: ${total2026.toLocaleString()}`);

// ========== HOURLY DISTRIBUTION ==========
// Definir días de fin de semana para cada año
const weekendDays = {
  2024: [6, 7, 13, 14, 20, 21], // Sáb: 6,13,20 | Dom: 7,14,21
  2025: [4, 5, 11, 12, 18, 19], // Sáb: 4,11,18 | Dom: 5,12,19
  2026: [3, 4, 10, 11, 17, 18, 24, 25], // Sáb: 3,10,17,24 | Dom: 4,11,18,25
};

function parseCSVForHourly(filePath, yearFilter, weekendDaysForYear) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  const hourlyDataWeekday = {};
  const hourlyDataWeekend = {};
  
  // Initialize all hours
  for (let h = 0; h < 24; h++) {
    hourlyDataWeekday[h] = 0;
    hourlyDataWeekend[h] = 0;
  }
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const commaIdx = line.lastIndexOf(',');
    if (commaIdx === -1) continue;
    const timestamp = line.slice(0, commaIdx).replace(/^"|"$/g, '').trim();
    const eventCount = parseInt(line.slice(commaIdx + 1).trim(), 10);
    if (Number.isNaN(eventCount)) continue;

    // Parse UTC timestamp and convert to Mexico time (UTC-6)
    const utcDate = new Date(timestamp.replace(' ', 'T') + 'Z');
    const mexicoDate = new Date(utcDate.getTime() - (6 * 60 * 60 * 1000));
    
    const year = mexicoDate.getUTCFullYear();
    const month = mexicoDate.getUTCMonth() + 1;
    const day = mexicoDate.getUTCDate();
    const hour = mexicoDate.getUTCHours();
    
    // Only count January data for the specified year, days 1 to lastDay
    if (year === yearFilter && month === 1 && day >= 1 && day <= lastDay2026) {
      const isWeekend = weekendDaysForYear.includes(day);
      if (isWeekend) {
        hourlyDataWeekend[hour] += eventCount;
      } else {
        hourlyDataWeekday[hour] += eventCount;
      }
    }
  }
  
  return { weekday: hourlyDataWeekday, weekend: hourlyDataWeekend };
}

const hourly2024 = parseCSVForHourly(path.join(__dirname, '../data/2024-01-31.csv'), 2024, weekendDays[2024]);
const hourly2025 = parseCSVForHourly(path.join(__dirname, '../data/2025-01-31.csv'), 2025, weekendDays[2025]);
const hourly2026 = parseCSVForHourly(path.join(__dirname, '../data/2026-01-MTD.csv'), 2026, weekendDays[2026]);

const hourLabels = ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', 
                    '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'];

// Distribución horaria para días de semana (L-V)
const hourlyDistributionWeekdayArray = [];
for (let h = 0; h < 24; h++) {
  const label = hourLabels[h];
  hourlyDistributionWeekdayArray.push(`  { hour: ${h}, label: '${label}', '2024': ${hourly2024.weekday[h]}, '2025': ${hourly2025.weekday[h]}, '2026': ${hourly2026.weekday[h]} },`);
}

// Distribución horaria para fines de semana (S-D)
const hourlyDistributionWeekendArray = [];
for (let h = 0; h < 24; h++) {
  const label = hourLabels[h];
  hourlyDistributionWeekendArray.push(`  { hour: ${h}, label: '${label}', '2024': ${hourly2024.weekend[h]}, '2025': ${hourly2025.weekend[h]}, '2026': ${hourly2026.weekend[h]} },`);
}

// Distribución horaria total (para compatibilidad con componentes existentes)
const hourlyDistributionArray = [];
for (let h = 0; h < 24; h++) {
  const label = hourLabels[h];
  const total2024 = hourly2024.weekday[h] + hourly2024.weekend[h];
  const total2025 = hourly2025.weekday[h] + hourly2025.weekend[h];
  const total2026 = hourly2026.weekday[h] + hourly2026.weekend[h];
  hourlyDistributionArray.push(`  { hour: ${h}, label: '${label}', '2024': ${total2024}, '2025': ${total2025}, '2026': ${total2026} },`);
}

console.log(`\nDistribución horaria procesada: 24 horas`);
console.log(`  - Días de semana (L-V)`);
console.log(`  - Fines de semana (S-D)`);

// Build hourlyDistribution for Convex
const hourlyDistributionForConvex = [];
for (const year of [2024, 2025, 2026]) {
  const hourly = year === 2024 ? hourly2024 : year === 2025 ? hourly2025 : hourly2026;
  for (let h = 0; h < 24; h++) {
    hourlyDistributionForConvex.push({
      year,
      month: 1,
      dayType: 'weekday',
      hour: h,
      events: hourly.weekday[h] || 0,
    });
    hourlyDistributionForConvex.push({
      year,
      month: 1,
      dayType: 'weekend',
      hour: h,
      events: hourly.weekend[h] || 0,
    });
  }
}

// ========== ACTUALIZAR CONVEX ==========
const projectRoot = path.join(__dirname, '..');

function runConvexMutation(name, args) {
  const argsJson = JSON.stringify(args).replace(/'/g, "'\\''");
  execSync(`npx convex run ${name}${prodFlag} '${argsJson}'`, {
    stdio: 'inherit',
    cwd: projectRoot,
  });
}

// Insertar dailyData en lotes de 200
const DAILY_BATCH = 200;
for (let i = 0; i < dailyDataForConvex.length; i += DAILY_BATCH) {
  const batch = dailyDataForConvex.slice(i, i + DAILY_BATCH);
  runConvexMutation('mutations:batchInsertDailyData', { data: batch });
  console.log(`✅ dailyData: lote ${Math.floor(i / DAILY_BATCH) + 1} (${batch.length} registros)`);
}

// Insertar hourlyDistribution en lotes de 100
const HOURLY_BATCH = 100;
for (let i = 0; i < hourlyDistributionForConvex.length; i += HOURLY_BATCH) {
  const batch = hourlyDistributionForConvex.slice(i, i + HOURLY_BATCH);
  runConvexMutation('mutations:batchInsertHourlyDistribution', { data: batch });
  console.log(`✅ hourlyDistribution: lote ${Math.floor(i / HOURLY_BATCH) + 1} (${batch.length} registros)`);
}

// Actualizar processingControl
runConvexMutation('mutations:initProcessingControl', {
  key: 'lastProcessedDay',
  lastCompleteDay: lastDay2026,
  lastProcessedTimestamp: new Date().toISOString(),
  year: 2026,
  month: 1,
});
console.log(`✅ processingControl actualizado (último día: ${lastDay2026})`);

// ========== ACTUALIZAR ARCHIVO DE CONTROL LOCAL (opcional, para scripts legacy) ==========
const controlPath = path.join(__dirname, '../data/lastProcessedDay.json');
const lastProcessedData = {
  lastCompleteDay: lastDay2026,
  lastProcessedDate: `2026-01-${String(lastDay2026).padStart(2, '0')}`,
  lastProcessedTimestamp: new Date().toISOString(),
  year: 2026,
  month: 1,
};

fs.writeFileSync(controlPath, JSON.stringify(lastProcessedData, null, 2), 'utf8');
console.log(`✅ Archivo de control actualizado: data/lastProcessedDay.json`);
console.log(`   Último día completo procesado: ${lastDay2026}`);

console.log(`\n🎉 ¡Proceso completado! Datos actualizados en Convex.`);
