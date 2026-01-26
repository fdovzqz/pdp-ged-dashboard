// Script para extraer datos de AWS CloudWatch Logs Insights
// NOTA: Los timestamps en CloudWatch están en UTC, hay que restar 6 horas para México (UTC-6)
import { CloudWatchLogsClient, StartQueryCommand, GetQueryResultsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

config(); // Cargar variables de entorno desde .env

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar cliente CloudWatch
const client = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const LOG_GROUP = process.env.CLOUDWATCH_LOG_GROUP || '/aws/vendedlogs/states/PaymentProcessStateMachineLogs/master';

// Función para leer el archivo de control
function getLastProcessedDay() {
  const controlPath = path.join(__dirname, '../data/lastProcessedDay.json');
  if (!fs.existsSync(controlPath)) {
    // Si no existe, inicializar con día 0 (procesar desde el día 1)
    return {
      lastCompleteDay: 0,
      lastProcessedDate: '2026-01-00',
      lastProcessedTimestamp: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      year: 2026,
      month: 1,
    };
  }
  return JSON.parse(fs.readFileSync(controlPath, 'utf8'));
}

// Función para calcular rango de fechas en UTC considerando UTC-6 de México
function getDateRangeForDay(day, year = 2026, month = 0) {
  // Día en México empieza a las 06:00 UTC del día N
  // Día en México termina a las 05:59:59.999 UTC del día N+1
  const startUTC = new Date(Date.UTC(year, month, day, 6, 0, 0, 0));
  const endUTC = new Date(Date.UTC(year, month, day + 1, 5, 59, 59, 999));
  return { startUTC, endUTC };
}

// Función para ejecutar query en CloudWatch
async function executeCloudWatchQuery(startTime, endTime) {
  const query = `
fields @timestamp, @message, @logStream, @log 
| filter details.parameters like /./ 
| parse details.parameters '"status":"*"' as status 
| parse details.parameters '"tramite":"*"' as tramite 
| parse details.parameters '"referencia":"*"' as referencia 
| parse details.parameters '"tramiteId":"*"' as tramiteId 
| parse details.parameters '"total_pagar":"*",' as monto
| parse details.parameters ',"id":"*"},' as transactionId
| filter status like /PAGO VALIDADO/
| filter @timestamp >= ${startTime} and @timestamp < ${endTime}
| stats count_distinct(referencia) as total_events by datefloor(@timestamp - 21600000, 1h) + 21600000
`;

  console.log(`\nEjecutando query CloudWatch...`);
  console.log(`Rango: ${new Date(startTime).toISOString()} - ${new Date(endTime).toISOString()}`);

  const command = new StartQueryCommand({
    logGroupName: LOG_GROUP,
    startTime: Math.floor(startTime / 1000), // CloudWatch espera segundos
    endTime: Math.floor(endTime / 1000),
    queryString: query,
  });

  const response = await client.send(command);
  const queryId = response.queryId;

  if (!queryId) {
    throw new Error('No se recibió queryId de CloudWatch');
  }

  console.log(`Query iniciada. QueryId: ${queryId}`);
  console.log(`Esperando resultados...`);

  // Polling para obtener resultados
  let results = null;
  let attempts = 0;
  const maxAttempts = 60; // Máximo 5 minutos (5 segundos * 60)

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Esperar 5 segundos

    const getResultsCommand = new GetQueryResultsCommand({ queryId });
    const resultsResponse = await client.send(getResultsCommand);

    if (resultsResponse.status === 'Complete') {
      results = resultsResponse.results;
      break;
    } else if (resultsResponse.status === 'Failed' || resultsResponse.status === 'Cancelled') {
      throw new Error(`Query falló con estado: ${resultsResponse.status}`);
    }

    attempts++;
    process.stdout.write('.');
  }

  if (!results) {
    throw new Error('Timeout esperando resultados de CloudWatch');
  }

  console.log(`\n✅ Resultados obtenidos: ${results.length} registros`);
  return results;
}

// Función para convertir resultados de CloudWatch a formato CSV
function convertResultsToCSV(results) {
  const csvLines = ['"datefloor(@timestamp - 21600000, 1h) + 21600000",total_events'];

  results.forEach((result) => {
    let timestamp = null;
    let events = null;

    result.forEach((field) => {
      if (field.field === 'datefloor(@timestamp - 21600000, 1h) + 21600000') {
        // El timestamp puede venir como número (milisegundos) o como string ISO
        const timestampValue = field.value;
        let date;
        if (typeof timestampValue === 'number') {
          date = new Date(timestampValue);
        } else if (typeof timestampValue === 'string') {
          // Intentar parsear como número primero
          const numValue = parseInt(timestampValue, 10);
          if (!isNaN(numValue) && numValue > 1000000000000) {
            // Es un timestamp en milisegundos
            date = new Date(numValue);
          } else {
            // Intentar parsear como fecha ISO
            date = new Date(timestampValue);
          }
        }
        if (date && !isNaN(date.getTime())) {
          timestamp = date.toISOString().replace('T', ' ').replace('Z', '').slice(0, -1);
        }
      } else if (field.field === 'total_events') {
        events = field.value;
      }
    });

    if (timestamp && events !== null) {
      csvLines.push(`"${timestamp}",${events}`);
    }
  });

  return csvLines.join('\n');
}

// Función principal
async function main() {
  try {
    console.log('========================================');
    console.log('Extracción de datos desde CloudWatch');
    console.log('========================================\n');

    // Leer último día procesado
    const lastProcessed = getLastProcessedDay();
    console.log(`Último día completo procesado: ${lastProcessed.lastCompleteDay}`);

    // Obtener fecha actual en México (UTC-6)
    const now = new Date();
    const mexicoNow = new Date(now.getTime() - 6 * 60 * 60 * 1000); // Restar 6 horas
    const todayDay = mexicoNow.getUTCDate();
    const todayHour = mexicoNow.getUTCHours();
    const todayMonth = mexicoNow.getUTCMonth();
    const todayYear = mexicoNow.getUTCFullYear();

    console.log(`Fecha actual (México): ${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')} ${String(todayHour).padStart(2, '0')}:00`);

    const lastCompleteDay = lastProcessed.lastCompleteDay;
    const nextDayToProcess = lastCompleteDay + 1;

    if (nextDayToProcess > todayDay) {
      console.log('\n✅ No hay días nuevos para procesar.');
      return;
    }

    // Determinar qué días procesar
    const daysToProcess = [];
    for (let day = nextDayToProcess; day <= todayDay; day++) {
      daysToProcess.push(day);
    }

    console.log(`\nDías a procesar: ${daysToProcess.join(', ')}`);

    // Procesar cada día
    const allCSVLines = [];
    let lastCompleteDayProcessed = lastCompleteDay;
    let todayIntradayData = null;

    for (const day of daysToProcess) {
      const isToday = day === todayDay;
      const isComplete = isToday ? todayHour >= 23 : true; // Día completo si no es hoy o si ya pasaron las 23:00

      console.log(`\n--- Procesando día ${day} (${isComplete ? 'completo' : 'incompleto'}) ---`);

      const { startUTC, endUTC } = getDateRangeForDay(day, todayYear, todayMonth);
      const results = await executeCloudWatchQuery(startUTC.getTime(), endUTC.getTime());

      if (results.length === 0) {
        console.log(`⚠️  No se encontraron datos para el día ${day}`);
        continue;
      }

      if (isComplete) {
        // Día completo: agregar al CSV histórico
        const csvData = convertResultsToCSV(results);
        const csvLines = csvData.split('\n').slice(1); // Omitir header
        allCSVLines.push(...csvLines);
        lastCompleteDayProcessed = day;
        console.log(`✅ Día ${day} completo procesado`);
      } else {
        // Día incompleto: guardar para intradía
        // Agrupar por hora ya que CloudWatch puede devolver múltiples registros por hora
        const hourlyMap = new Map();
        
        results.forEach((result) => {
          let timestamp = null;
          let events = null;
          result.forEach((field) => {
            if (field.field === 'datefloor(@timestamp - 21600000, 1h) + 21600000') {
              timestamp = field.value; // Mantener el valor original
            } else if (field.field === 'total_events') {
              events = parseInt(field.value, 10);
            }
          });
          
          if (timestamp !== null && events !== null) {
            // CloudWatch devuelve el timestamp como string en formato "YYYY-MM-DD HH:mm:ss.SSS"
            // Este timestamp ya está ajustado por la query (agrupado por hora de México)
            // pero el formato sigue siendo UTC, así que necesitamos parsearlo correctamente
            let utcDate;
            
            if (typeof timestamp === 'string') {
              // Formato: "2026-01-26 19:00:00.000"
              // Convertir a formato ISO para parsear: "2026-01-26T19:00:00.000Z"
              const isoString = timestamp.replace(' ', 'T') + 'Z';
              utcDate = new Date(isoString);
            } else if (typeof timestamp === 'number') {
              utcDate = new Date(timestamp);
            } else {
              console.log(`⚠️  Tipo de timestamp desconocido: ${typeof timestamp}`);
              return;
            }
            
            if (isNaN(utcDate.getTime())) {
              console.log(`⚠️  Timestamp inválido: ${timestamp}`);
              return;
            }
            
            // El timestamp viene en UTC pero ya agrupado por hora de México
            // Necesitamos restar 6 horas para obtener la hora real de México
            const mexicoDate = new Date(utcDate.getTime() - 6 * 60 * 60 * 1000);
            const hour = mexicoDate.getUTCHours();
            
            // Sumar eventos si ya existe esa hora
            if (hourlyMap.has(hour)) {
              hourlyMap.set(hour, hourlyMap.get(hour) + events);
            } else {
              hourlyMap.set(hour, events);
            }
          }
        });
        
        // Convertir map a array y ordenar por hora
        const intradayHourly = Array.from(hourlyMap.entries())
          .map(([hour, events]) => ({ hour, events }))
          .sort((a, b) => a.hour - b.hour);
        
        // Calcular acumulados
        let cumulative = 0;
        todayIntradayData = intradayHourly.map((h) => {
          cumulative += h.events;
          return { ...h, cumulative };
        });
        
        console.log(`📊 Día ${day} incompleto - ${todayIntradayData.length} horas con datos guardadas para intradía`);
      }
    }

    // Guardar datos intradía si hay datos del día actual incompleto
    if (todayIntradayData && todayIntradayData.length > 0) {
      // Calcular hora de extracción en México (UTC-6)
      const nowUtc = new Date();
      const mexicoTime = new Date(nowUtc.getTime() - 6 * 60 * 60 * 1000);
      const extractionHour = mexicoTime.getUTCHours();
      const extractionMinute = mexicoTime.getUTCMinutes();
      const extractionTimeStr = `${extractionHour.toString().padStart(2, '0')}:${extractionMinute.toString().padStart(2, '0')}`;
      
      // Guardar JSON en data/
      const intradayJsonPath = path.join(__dirname, '../data/today-intraday.json');
      fs.writeFileSync(
        intradayJsonPath,
        JSON.stringify({ 
          day: todayDay, 
          data: todayIntradayData,
          lastExtraction: extractionTimeStr,
          lastExtractionIso: nowUtc.toISOString()
        }, null, 2),
        'utf8'
      );
      console.log(`✅ Datos intradía JSON guardados: ${intradayJsonPath}`);
      
      // También generar archivo TypeScript para importación directa
      const intradayTsPath = path.join(__dirname, '../src/data/today-intraday.ts');
      const tsContent = `// Datos intradía del día actual - Generado automáticamente por fetchCloudWatch.js
// Última actualización: ${nowUtc.toISOString()} (${extractionTimeStr} hora México)

import type { IntradayHourData } from './intradayData';

export const todayIntradayData: IntradayHourData[] = ${JSON.stringify(todayIntradayData, null, 2)};

export const todayIntradayDay = ${todayDay};

// Hora de última extracción (hora México, UTC-6)
export const lastExtractionTime = '${extractionTimeStr}';
`;
      fs.writeFileSync(intradayTsPath, tsContent, 'utf8');
      console.log(`✅ Datos intradía TypeScript guardados: ${intradayTsPath}`);
      console.log(`💡 Los datos están disponibles para la sección Intradía (extracción: ${extractionTimeStr} MX).`);
    } else {
      // Si no hay datos intradía, limpiar archivos anteriores si existen
      const intradayTsPath = path.join(__dirname, '../src/data/today-intraday.ts');
      if (fs.existsSync(intradayTsPath)) {
        // Crear archivo vacío o con datos null
        const tsContent = `// Datos intradía del día actual - Generado automáticamente por fetchCloudWatch.js
// No hay datos disponibles actualmente

import type { IntradayHourData } from './intradayData';

export const todayIntradayData: IntradayHourData[] | null = null;

export const todayIntradayDay: number | null = null;
`;
        fs.writeFileSync(intradayTsPath, tsContent, 'utf8');
      }
    }

    if (allCSVLines.length === 0) {
      if (todayIntradayData && todayIntradayData.length > 0) {
        console.log('\n✅ Solo hay datos del día actual (incompleto). Datos intradía guardados.');
      } else {
        console.log('\n⚠️  No se encontraron datos nuevos.');
      }
      return;
    }

    // Si hay días completos nuevos, actualizar CSV histórico
    if (lastCompleteDayProcessed > lastCompleteDay) {
      console.log(`\n📝 Actualizando CSV histórico con días ${lastCompleteDay + 1} a ${lastCompleteDayProcessed}...`);

      // Leer CSV existente
      const csvPath = path.join(__dirname, '../data/2026-01-MTD.csv');
      let existingCSV = '';
      if (fs.existsSync(csvPath)) {
        existingCSV = fs.readFileSync(csvPath, 'utf8');
      }

      // Agregar nuevos datos (mantener header solo una vez)
      const header = '"datefloor(@timestamp - 21600000, 1h) + 21600000",total_events\n';
      const newCSV = existingCSV
        ? existingCSV + '\n' + allCSVLines.join('\n')
        : header + allCSVLines.join('\n');

      fs.writeFileSync(csvPath, newCSV, 'utf8');
      console.log(`✅ CSV actualizado: ${csvPath}`);

      // Ejecutar processCSV.js para actualizar historicalData.ts
      console.log('\n🔄 Ejecutando processCSV.js...');
      execSync('node scripts/processCSV.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    } else {
      console.log('\n📊 Solo hay datos del día actual (incompleto). No se actualiza CSV histórico.');
      console.log('💡 Los datos intradía ya fueron guardados arriba.');
    }

    console.log('\n🎉 ¡Proceso completado!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
