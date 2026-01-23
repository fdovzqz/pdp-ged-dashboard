// Script para procesar los CSV y generar los datos para el dashboard
// NOTA: Los timestamps en CSV están en UTC, hay que restar 6 horas para México (UTC-6)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  // Skip header
  const data = {};
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const [timestamp, events] = line.split(',');
    const eventCount = parseInt(events, 10);
    
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
const lastDay2026 = Math.max(...days2026Array);

console.log(`\n========================================`);
console.log(`Procesando datos hasta el día ${lastDay2026}`);
console.log(`========================================`);

// Generate combined array dynamically
const historicalDataArray = [];
for (let day = 1; day <= lastDay2026; day++) {
  const date2024 = `2024-01-${day.toString().padStart(2, '0')}`;
  const date2025 = `2025-01-${day.toString().padStart(2, '0')}`;
  const date2026 = `2026-01-${day.toString().padStart(2, '0')}`;
  
  const val2024 = data2024[date2024] || 0;
  const val2025 = data2025[date2025] || 0;
  const val2026 = data2026[date2026] || 0;
  
  historicalDataArray.push(`  { day: ${day}, '2024': ${val2024}, '2025': ${val2025}, '2026': ${val2026} },`);
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
function parseCSVForHourly(filePath, yearFilter) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  const hourlyData = {};
  
  // Initialize all hours
  for (let h = 0; h < 24; h++) {
    hourlyData[h] = 0;
  }
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const [timestamp, events] = line.split(',');
    const eventCount = parseInt(events, 10);
    
    // Parse UTC timestamp and convert to Mexico time (UTC-6)
    const utcDate = new Date(timestamp.replace(' ', 'T') + 'Z');
    const mexicoDate = new Date(utcDate.getTime() - (6 * 60 * 60 * 1000));
    
    const year = mexicoDate.getUTCFullYear();
    const month = mexicoDate.getUTCMonth() + 1;
    const day = mexicoDate.getUTCDate();
    const hour = mexicoDate.getUTCHours();
    
    // Only count January data for the specified year, days 1 to lastDay
    if (year === yearFilter && month === 1 && day >= 1 && day <= lastDay2026) {
      hourlyData[hour] += eventCount;
    }
  }
  
  return hourlyData;
}

const hourly2024 = parseCSVForHourly(path.join(__dirname, '../data/2024-01-31.csv'), 2024);
const hourly2025 = parseCSVForHourly(path.join(__dirname, '../data/2025-01-31.csv'), 2025);
const hourly2026 = parseCSVForHourly(path.join(__dirname, '../data/2026-01-MTD.csv'), 2026);

const hourLabels = ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', 
                    '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'];

const hourlyDistributionArray = [];
for (let h = 0; h < 24; h++) {
  const label = hourLabels[h];
  hourlyDistributionArray.push(`  { hour: ${h}, label: '${label}', '2024': ${hourly2024[h]}, '2025': ${hourly2025[h]}, '2026': ${hourly2026[h]} },`);
}

console.log(`\nDistribución horaria procesada: 24 horas`);

// ========== ACTUALIZAR ARCHIVO historicalData.ts ==========
const historicalDataPath = path.join(__dirname, '../src/data/historicalData.ts');
let historicalDataContent = fs.readFileSync(historicalDataPath, 'utf8');

// 1. Reemplazar array historicalData
const historicalDataPattern = /(export const historicalData: DailyData\[\] = \[)([\s\S]*?)(\];)/;
const newHistoricalData = `export const historicalData: DailyData[] = [\n${historicalDataArray.join('\n')}\n];`;
historicalDataContent = historicalDataContent.replace(historicalDataPattern, newHistoricalData);

// 2. Reemplazar valor totals['2026']
const totalsPattern = /(export const totals = \{[\s\S]*?'2026':\s*)(\d+)([\s\S]*?\};)/;
historicalDataContent = historicalDataContent.replace(totalsPattern, `$1${total2026}$3`);

// 3. Reemplazar array hourlyDistribution
const hourlyPattern = /(export const hourlyDistribution: HourlyData\[\] = \[)([\s\S]*?)(\];)/;
const newHourlyDistribution = `export const hourlyDistribution: HourlyData[] = [\n${hourlyDistributionArray.join('\n')}\n];`;
historicalDataContent = historicalDataContent.replace(hourlyPattern, newHourlyDistribution);

// Escribir archivo actualizado
fs.writeFileSync(historicalDataPath, historicalDataContent, 'utf8');

console.log(`\n✅ Archivo actualizado: src/data/historicalData.ts`);
console.log(`\n🎉 ¡Proceso completado! El dashboard está actualizado.`);
