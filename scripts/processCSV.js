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

// Process each file
const data2026 = parseCSV(path.join(__dirname, '../data/logs-insights-results.csv'));
const data2025 = parseCSV(path.join(__dirname, '../data/logs-insights-results(1).csv'));
const data2024 = parseCSV(path.join(__dirname, '../data/logs-insights-results(2).csv'));

console.log('=== 2024 Daily Totals ===');
const days2024 = Object.entries(data2024)
  .filter(([date]) => date.startsWith('2024-01'))
  .sort(([a], [b]) => a.localeCompare(b));

days2024.forEach(([date, total]) => {
  const day = parseInt(date.split('-')[2], 10);
  console.log(`  { day: ${day}, '2024': ${total} },`);
});

console.log('\nTotal 2024 (Jan 1-31):', days2024.reduce((sum, [, val]) => sum + val, 0));

console.log('\n=== 2025 Daily Totals ===');
const days2025 = Object.entries(data2025)
  .filter(([date]) => date.startsWith('2025-01'))
  .sort(([a], [b]) => a.localeCompare(b));

days2025.forEach(([date, total]) => {
  const day = parseInt(date.split('-')[2], 10);
  console.log(`  { day: ${day}, '2025': ${total} },`);
});

console.log('\nTotal 2025 (Jan 1-31):', days2025.reduce((sum, [, val]) => sum + val, 0));

console.log('\n=== 2026 Daily Totals ===');
const days2026 = Object.entries(data2026)
  .filter(([date]) => date.startsWith('2026-01'))
  .sort(([a], [b]) => a.localeCompare(b));

days2026.forEach(([date, total]) => {
  const day = parseInt(date.split('-')[2], 10);
  console.log(`  { day: ${day}, '2026': ${total} },`);
});

console.log('\nTotal 2026 (Jan 1-22):', days2026.reduce((sum, [, val]) => sum + val, 0));

// Generate combined array for days 1-21
console.log('\n=== Combined Data (Days 1-21) ===');
console.log('export const historicalData: DailyData[] = [');
for (let day = 1; day <= 21; day++) {
  const date2024 = `2024-01-${day.toString().padStart(2, '0')}`;
  const date2025 = `2025-01-${day.toString().padStart(2, '0')}`;
  const date2026 = `2026-01-${day.toString().padStart(2, '0')}`;
  
  const val2024 = data2024[date2024] || 0;
  const val2025 = data2025[date2025] || 0;
  const val2026 = data2026[date2026] || 0;
  
  console.log(`  { day: ${day}, '2024': ${val2024}, '2025': ${val2025}, '2026': ${val2026} },`);
}
console.log('];');

// Generate data for days 22-31
console.log('\n=== Historical Data Full 2024 (Days 22-31) ===');
console.log('const historicalDataFull2024: Record<number, number> = {');
for (let day = 22; day <= 31; day++) {
  const date = `2024-01-${day.toString().padStart(2, '0')}`;
  const val = data2024[date] || 0;
  console.log(`  ${day}: ${val},`);
}
console.log('};');

console.log('\n=== Historical Data Full 2025 (Days 22-31) ===');
console.log('const historicalDataFull2025: Record<number, number> = {');
for (let day = 22; day <= 31; day++) {
  const date = `2025-01-${day.toString().padStart(2, '0')}`;
  const val = data2025[date] || 0;
  console.log(`  ${day}: ${val},`);
}
console.log('};');

// Calculate totals
let total2024_1to21 = 0;
let total2025_1to21 = 0;
let total2026_1to21 = 0;

for (let day = 1; day <= 21; day++) {
  const date2024 = `2024-01-${day.toString().padStart(2, '0')}`;
  const date2025 = `2025-01-${day.toString().padStart(2, '0')}`;
  const date2026 = `2026-01-${day.toString().padStart(2, '0')}`;
  
  total2024_1to21 += data2024[date2024] || 0;
  total2025_1to21 += data2025[date2025] || 0;
  total2026_1to21 += data2026[date2026] || 0;
}

console.log('\n=== Totals (Days 1-21) ===');
console.log(`2024: ${total2024_1to21}`);
console.log(`2025: ${total2025_1to21}`);
console.log(`2026: ${total2026_1to21}`);

// Day 22 for 2026
const date2026_22 = `2026-01-22`;
console.log(`\n2026 Day 22: ${data2026[date2026_22] || 0}`);

// ========== HOURLY DISTRIBUTION ==========
console.log('\n\n========== HOURLY DISTRIBUTION ==========');

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
    
    // Only count January data for the specified year, days 1-21
    if (year === yearFilter && month === 1 && day >= 1 && day <= 21) {
      hourlyData[hour] += eventCount;
    }
  }
  
  return hourlyData;
}

const hourly2024 = parseCSVForHourly(path.join(__dirname, '../data/logs-insights-results(2).csv'), 2024);
const hourly2025 = parseCSVForHourly(path.join(__dirname, '../data/logs-insights-results(1).csv'), 2025);
const hourly2026 = parseCSVForHourly(path.join(__dirname, '../data/logs-insights-results.csv'), 2026);

const hourLabels = ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', 
                    '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'];

console.log('\nexport const hourlyDistribution: HourlyData[] = [');
for (let h = 0; h < 24; h++) {
  const label = hourLabels[h];
  console.log(`  { hour: ${h}, label: '${label}', '2024': ${hourly2024[h]}, '2025': ${hourly2025[h]}, '2026': ${hourly2026[h]} },`);
}
console.log('];');

// Summary
console.log('\n=== Hourly Summary ===');
console.log('Hour | 2024 | 2025 | 2026');
for (let h = 0; h < 24; h++) {
  console.log(`${hourLabels[h].padEnd(5)} | ${String(hourly2024[h]).padStart(4)} | ${String(hourly2025[h]).padStart(4)} | ${String(hourly2026[h]).padStart(4)}`);
}
