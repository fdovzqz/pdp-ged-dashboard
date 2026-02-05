"use node";

import { action, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import {
  CloudWatchLogsClient,
  StartQueryCommand,
  GetQueryResultsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

// Función helper para determinar si un día es fin de semana (mes 1-12)
function isWeekend(year: number, month: number, day: number): boolean {
  const d = new Date(year, month - 1, day);
  const dow = d.getDay(); // 0=Dom, 6=Sáb
  return dow === 0 || dow === 6;
}

// Función para calcular rango de fechas en UTC considerando UTC-6 de México
function getDateRangeForDay(day: number, year = 2026, month = 0): { startUTC: Date; endUTC: Date } {
  // Día en México empieza a las 06:00 UTC del día N
  // Día en México termina a las 05:59:59.999 UTC del día N+1
  const startUTC = new Date(Date.UTC(year, month, day, 6, 0, 0, 0));
  const endUTC = new Date(Date.UTC(year, month, day + 1, 5, 59, 59, 999));
  return { startUTC, endUTC };
}

/** Rango de un mes completo (o parcial si endDay) en UTC, hora México */
function getDateRangeForMonth(
  year: number,
  month: number,
  endDay?: number
): { startUTC: Date; endUTC: Date } {
  const month0 = month - 1;
  const startUTC = new Date(Date.UTC(year, month0, 1, 6, 0, 0, 0));
  const lastDay = endDay ?? new Date(year, month, 0).getDate();
  const endUTC = new Date(Date.UTC(year, month0, lastDay + 1, 5, 59, 59, 999));
  return { startUTC, endUTC };
}

/** Rango de un año completo (o parcial si endMonth/endDay) en UTC, hora México */
function getDateRangeForYear(
  year: number,
  endMonth?: number,
  endDay?: number
): { startUTC: Date; endUTC: Date } {
  const startUTC = new Date(Date.UTC(year, 0, 1, 6, 0, 0, 0));
  if (endMonth !== undefined && endDay !== undefined) {
    const endUTC = new Date(Date.UTC(year, endMonth - 1, endDay + 1, 5, 59, 59, 999));
    return { startUTC, endUTC };
  }
  const endUTC = new Date(Date.UTC(year + 1, 0, 1, 5, 59, 59, 999));
  return { startUTC, endUTC };
}

// Función para ejecutar query en CloudWatch
async function executeCloudWatchQuery(
  client: CloudWatchLogsClient,
  logGroup: string,
  startTime: number,
  endTime: number
): Promise<Array<Array<{ field: string; value: string }>>> {
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

  console.log(`Ejecutando query CloudWatch...`);
  console.log(
    `Rango: ${new Date(startTime).toISOString()} - ${new Date(endTime).toISOString()}`
  );

  const command = new StartQueryCommand({
    logGroupName: logGroup,
    startTime: Math.floor(startTime / 1000),
    endTime: Math.floor(endTime / 1000),
    queryString: query,
  });

  const response = await client.send(command);
  const queryId = response.queryId;

  if (!queryId) {
    throw new Error("No se recibió queryId de CloudWatch");
  }

  console.log(`Query iniciada. QueryId: ${queryId}`);

  // Polling para obtener resultados
  let results: Array<Array<{ field: string; value: string }>> | null = null;
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const getResultsCommand = new GetQueryResultsCommand({ queryId });
    const resultsResponse = await client.send(getResultsCommand);

    if (resultsResponse.status === "Complete") {
      results = resultsResponse.results as Array<
        Array<{ field: string; value: string }>
      >;
      break;
    } else if (
      resultsResponse.status === "Failed" ||
      resultsResponse.status === "Cancelled"
    ) {
      throw new Error(`Query falló con estado: ${resultsResponse.status}`);
    }

    attempts++;
  }

  if (!results) {
    throw new Error("Timeout esperando resultados de CloudWatch");
  }

  console.log(`✅ Resultados obtenidos: ${results.length} registros`);
  return results;
}

// Función para procesar resultados de CloudWatch (un solo día → Map<hour, events>)
function processResults(results: Array<Array<{ field: string; value: string }>>): Map<number, number> {
  const hourlyMap = new Map<number, number>();

  results.forEach((result) => {
    let timestampValue: string | null = null;
    let eventsValue: number | null = null;

    result.forEach((field) => {
      if (field.field === "datefloor(@timestamp - 21600000, 1h) + 21600000") {
        timestampValue = field.value;
      } else if (field.field === "total_events") {
        eventsValue = parseInt(field.value, 10);
      }
    });

    if (timestampValue !== null && eventsValue !== null) {
      const isoString = (timestampValue as string).replace(" ", "T") + "Z";
      const utcDate = new Date(isoString);

      if (!isNaN(utcDate.getTime())) {
        const mexicoDate = new Date(utcDate.getTime() - 6 * 60 * 60 * 1000);
        const hour = mexicoDate.getUTCHours();

        if (hourlyMap.has(hour)) {
          hourlyMap.set(hour, hourlyMap.get(hour)! + eventsValue);
        } else {
          hourlyMap.set(hour, eventsValue);
        }
      }
    }
  });

  return hourlyMap;
}

/** Procesa resultados de un rango multi-día (mes). Retorna { year, month, day, hour, events }[] */
function processResultsForMonth(
  results: Array<Array<{ field: string; value: string }>>
): Array<{ year: number; month: number; day: number; hour: number; events: number }> {
  const rows: Array<{ year: number; month: number; day: number; hour: number; events: number }> = [];

  results.forEach((result) => {
    let timestampValue: string | null = null;
    let eventsValue: number | null = null;

    result.forEach((field) => {
      if (field.field === "datefloor(@timestamp - 21600000, 1h) + 21600000") {
        timestampValue = field.value;
      } else if (field.field === "total_events") {
        eventsValue = parseInt(field.value, 10);
      }
    });

    if (timestampValue !== null && eventsValue !== null) {
      const isoString = (timestampValue as string).replace(" ", "T") + "Z";
      const utcDate = new Date(isoString);

      if (!isNaN(utcDate.getTime())) {
        const mexicoDate = new Date(utcDate.getTime() - 6 * 60 * 60 * 1000);
        rows.push({
          year: mexicoDate.getUTCFullYear(),
          month: mexicoDate.getUTCMonth() + 1,
          day: mexicoDate.getUTCDate(),
          hour: mexicoDate.getUTCHours(),
          events: eventsValue,
        });
      }
    }
  });

  return rows;
}

// Tipo de retorno para la action principal
interface FetchResult {
  success: boolean;
  message?: string;
  daysProcessed?: number;
  lastCompleteDay?: number;
  totalRecords?: number;
}

// Action principal para extraer y actualizar datos
export const fetchAndUpdateData = internalAction({
  handler: async (ctx): Promise<FetchResult> => {
    const cronPaused = await ctx.runQuery(internal.queries.getCronPaused);
    if (cronPaused) {
      console.log("⏸️  Cron pausado (re-extracción en curso). Omitiendo ejecución.");
      return {
        success: true,
        message: "Skipped: cron paused during re-extraction",
        daysProcessed: 0,
        totalRecords: 0,
      };
    }

    console.log("========================================");
    console.log("Extracción de datos desde CloudWatch");
    console.log("========================================\n");

    try {
      // Obtener configuración de variables de entorno
      const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      const awsRegion = process.env.AWS_REGION || "us-east-1";
      const logGroup =
        process.env.CLOUDWATCH_LOG_GROUP ||
        "/aws/vendedlogs/states/PaymentProcessStateMachineLogs/master";

      if (!awsAccessKeyId || !awsSecretAccessKey) {
        throw new Error(
          "AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
        );
      }

      // Configurar cliente CloudWatch
      const client = new CloudWatchLogsClient({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey,
        },
      });

      // Obtener fecha actual en México (UTC-6) - antes del control para usarla en la lógica
      const now = new Date();
      const mexicoNow = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      const todayDay = mexicoNow.getUTCDate();
      const todayHour = mexicoNow.getUTCHours();
      const currentMinute = mexicoNow.getUTCMinutes();
      const todayMonth = mexicoNow.getUTCMonth();
      const todayYear = mexicoNow.getUTCFullYear();

      // Obtener último día procesado desde la base de datos
      const processingControl = await ctx.runQuery(
        internal.queries.getProcessingControl
      );

      const controlYear = processingControl?.year ?? todayYear;
      const controlMonth = processingControl?.month ?? todayMonth + 1;
      let lastCompleteDay: number = processingControl?.lastCompleteDay ?? 0;

      // Si cambió el mes o año, reiniciar desde día 1 del mes actual
      if (controlYear !== todayYear || controlMonth !== todayMonth + 1) {
        lastCompleteDay = 0;
        console.log(
          `Cambio de período: reiniciando desde día 1 de ${todayMonth + 1}/${todayYear}`
        );
      }
      console.log(`Último día completo procesado: ${lastCompleteDay}`);

      console.log(
        `Fecha actual (México): ${todayYear}-${String(todayMonth + 1).padStart(2, "0")}-${String(todayDay).padStart(2, "0")} ${String(todayHour).padStart(2, "0")}:00`
      );

      // Throttling por horario:
      // - De 09:00 a 21:00 (hora México) se ejecuta cada minuto.
      // - Fuera de ese rango solo se ejecuta cuando el minuto es múltiplo de 5.
      const isBusinessHour = todayHour >= 9 && todayHour < 21;
      if (!isBusinessHour && currentMinute % 5 !== 0) {
        console.log(
          `⏭️  Ejecución omitida por ventana horaria. Hora local: ${todayHour}:${String(currentMinute).padStart(2, "0")}`
        );
        return {
          success: true,
          message: "Skipped by schedule (off-hours throttling)",
          daysProcessed: 0,
          totalRecords: 0,
        };
      }

      const nextDayToProcess = lastCompleteDay + 1;

      if (nextDayToProcess > todayDay) {
        console.log("\n✅ No hay días nuevos para procesar.");
        // Aún así, actualizar datos intradía del día actual si es necesario
        if (todayDay > lastCompleteDay) {
          await processCurrentDay(
            ctx,
            client,
            logGroup,
            todayDay,
            todayHour,
            todayYear,
            todayMonth
          );
        }
        return { success: true, message: "No hay días nuevos, intradía actualizado" };
      }

      // Determinar qué días procesar
      const daysToProcess: number[] = [];
      for (let day = nextDayToProcess; day <= todayDay; day++) {
        daysToProcess.push(day);
      }

      console.log(`\nDías a procesar: ${daysToProcess.join(", ")}`);

      let lastCompleteDayProcessed: number = lastCompleteDay;
      let totalRecordsProcessed = 0;

      // Procesar cada día
      for (const day of daysToProcess) {
        const isToday = day === todayDay;
        // Un día está completo solo cuando ya pasó (es decir, ya estamos en el día siguiente)
        // El día actual NUNCA está completo hasta que cambie el día (00:00 MX del siguiente día)
        const isComplete = !isToday;

        console.log(
          `\n--- Procesando día ${day} (${isComplete ? "completo" : "incompleto"}) ---`
        );

        const { startUTC, endUTC } = getDateRangeForDay(day, todayYear, todayMonth);
        const results = await executeCloudWatchQuery(
          client,
          logGroup,
          startUTC.getTime(),
          endUTC.getTime()
        );

        if (results.length === 0) {
          console.log(`⚠️  No se encontraron datos para el día ${day}`);
          continue;
        }

        const hourlyMap = processResults(results);
        const dayTotal = Array.from(hourlyMap.values()).reduce((a, b) => a + b, 0);
        totalRecordsProcessed += dayTotal;

        const currentMonth1Based = todayMonth + 1;

        // Siempre escribir en rawHourlyData (fuente única)
        const rawData = Array.from(hourlyMap.entries()).map(([hour, events]) => ({
          year: todayYear,
          month: currentMonth1Based,
          day,
          hour,
          events,
        }));
        if (rawData.length > 0) {
          await ctx.runMutation(internal.mutations.batchInsertRawHourlyData, {
            data: rawData,
          });
        }

        if (isComplete) {
          // Día completo: insertar en dailyData
          await ctx.runMutation(internal.mutations.internalUpsertDailyData, {
            year: todayYear,
            month: currentMonth1Based,
            day,
            events: dayTotal,
            isComplete: true,
          });

          // Actualizar distribución horaria
          const dayType = isWeekend(todayYear, currentMonth1Based, day) ? "weekend" : "weekday";
          for (const [hour, events] of hourlyMap) {
            await ctx.runMutation(internal.mutations.incrementHourlyDistribution, {
              year: todayYear,
              month: currentMonth1Based,
              dayType,
              hour,
              additionalEvents: events,
            });
          }

          // Actualizar monthlyData (agregación mensual)
          await ctx.runMutation(internal.mutations.internalIncrementMonthlyData, {
            year: todayYear,
            month: currentMonth1Based,
            additionalEvents: dayTotal,
          });

          lastCompleteDayProcessed = day;
          console.log(`✅ Día ${day} completo procesado: ${dayTotal} eventos`);
        } else {
          // Día incompleto: guardar para intradía (rawHourlyData ya escrito arriba)
          const intradayHourly = Array.from(hourlyMap.entries())
            .map(([hour, events]) => ({ hour, events }))
            .sort((a, b) => a.hour - b.hour);

          // Calcular acumulados
          let cumulative = 0;
          const intradayData = intradayHourly.map((h) => {
            cumulative += h.events;
            return { ...h, cumulative };
          });

          // Reemplazar datos intradía
          await ctx.runMutation(internal.mutations.replaceIntradayData, {
            day,
            data: intradayData,
          });

          // Actualizar metadatos
          const extractionHour = mexicoNow.getUTCHours();
          const extractionMinute = mexicoNow.getUTCMinutes();
          const extractionTimeStr = `${extractionHour.toString().padStart(2, "0")}:${extractionMinute.toString().padStart(2, "0")}`;

          await ctx.runMutation(internal.mutations.updateIntradayMeta, {
            day,
            lastExtraction: extractionTimeStr,
            lastExtractionIso: now.toISOString(),
          });

          console.log(
            `📊 Día ${day} incompleto - ${intradayData.length} horas con datos, total: ${dayTotal}`
          );
        }
      }

      // Actualizar control de procesamiento si hubo días completos
      if (lastCompleteDayProcessed > lastCompleteDay) {
        await ctx.runMutation(internal.mutations.updateProcessingControl, {
          key: "lastProcessedDay",
          lastCompleteDay: lastCompleteDayProcessed,
          lastProcessedTimestamp: now.toISOString(),
          year: todayYear,
          month: todayMonth + 1,
        });

        // Limpiar datos intradía de días anteriores
        await ctx.runMutation(internal.mutations.cleanupOldIntradayData, {
          currentDay: todayDay,
        });
      }

      // Registrar en log de extracción
      await ctx.runMutation(internal.mutations.addExtractionLog, {
        timestamp: now.toISOString(),
        recordsProcessed: totalRecordsProcessed,
        status: "success",
      });

      console.log("\n🎉 ¡Proceso completado!");
      return {
        success: true,
        daysProcessed: daysToProcess.length,
        lastCompleteDay: lastCompleteDayProcessed,
        totalRecords: totalRecordsProcessed,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("\n❌ Error:", errorMessage);

      // Registrar error en log
      await ctx.runMutation(internal.mutations.addExtractionLog, {
        timestamp: new Date().toISOString(),
        recordsProcessed: 0,
        status: "error",
        errorMessage,
      });

      throw error;
    }
  },
});

// Función auxiliar para procesar solo el día actual (intradía)
async function processCurrentDay(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  client: CloudWatchLogsClient,
  logGroup: string,
  todayDay: number,
  _todayHour: number,
  todayYear: number,
  todayMonth: number
): Promise<void> {
  console.log(`\n--- Actualizando datos intradía del día ${todayDay} ---`);

  const { startUTC, endUTC } = getDateRangeForDay(todayDay, todayYear, todayMonth);
  const results = await executeCloudWatchQuery(
    client,
    logGroup,
    startUTC.getTime(),
    endUTC.getTime()
  );

  if (results.length === 0) {
    console.log(`⚠️  No se encontraron datos para el día ${todayDay}`);
    return;
  }

  const hourlyMap = processResults(results);

  const todayMonth1Based = todayMonth + 1;

  // Escribir en rawHourlyData (fuente única)
  const rawData = Array.from(hourlyMap.entries()).map(([hour, events]) => ({
    year: todayYear,
    month: todayMonth1Based,
    day: todayDay,
    hour,
    events,
  }));
  if (rawData.length > 0) {
    await ctx.runMutation(internal.mutations.batchInsertRawHourlyData, {
      data: rawData,
    });
  }

  const intradayHourly = Array.from(hourlyMap.entries())
    .map(([hour, events]) => ({ hour, events }))
    .sort((a, b) => a.hour - b.hour);

  let cumulative = 0;
  const intradayData = intradayHourly.map((h) => {
    cumulative += h.events;
    return { ...h, cumulative };
  });

  await ctx.runMutation(internal.mutations.replaceIntradayData, {
    day: todayDay,
    data: intradayData,
  });

  const now = new Date();
  const mexicoNow = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const extractionHour = mexicoNow.getUTCHours();
  const extractionMinute = mexicoNow.getUTCMinutes();
  const extractionTimeStr = `${extractionHour.toString().padStart(2, "0")}:${extractionMinute.toString().padStart(2, "0")}`;

  await ctx.runMutation(internal.mutations.updateIntradayMeta, {
    day: todayDay,
    lastExtraction: extractionTimeStr,
    lastExtractionIso: now.toISOString(),
  });

  console.log(`📊 Intradía actualizado: ${intradayData.length} horas con datos (rawHourlyData también)`);
}

// Action pública para trigger manual
export const manualFetch = action({
  handler: async (ctx): Promise<FetchResult> => {
    return await ctx.runAction(internal.cloudwatch.fetchAndUpdateData);
  },
});

// ============ RE-EXTRACCIÓN COMPLETA ============

interface FullReextractResult {
  success: boolean;
  daysProcessed?: number;
  totalRecords?: number;
  lastProcessedDate?: string;
  error?: string;
}

/** Genera todos los días desde start hasta end (inclusive) en hora México */
function* iterateDays(
  startYear: number,
  startMonth: number,
  startDay: number,
  endYear: number,
  endMonth: number,
  endDay: number
): Generator<{ year: number; month: number; day: number; month0: number }> {
  const start = new Date(Date.UTC(startYear, startMonth - 1, startDay, 6, 0, 0, 0));
  const end = new Date(Date.UTC(endYear, endMonth - 1, endDay, 6, 0, 0, 0));

  const current = new Date(start.getTime());
  while (current.getTime() <= end.getTime()) {
    const year = current.getUTCFullYear();
    const month = current.getUTCMonth() + 1;
    const day = current.getUTCDate();
    const month0 = current.getUTCMonth();
    yield { year, month, day, month0 };
    current.setUTCDate(current.getUTCDate() + 1);
  }
}

/** Genera meses desde start hasta end (inclusive). endDay solo para el último mes (parcial). */
function* iterateMonths(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
  endDay?: number
): Generator<{ year: number; month: number; endDay?: number }> {
  let y = startYear;
  let m = startMonth;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    const isLast = y === endYear && m === endMonth;
    yield { year: y, month: m, endDay: isLast ? endDay : undefined };
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
}

/** Re-extracción desde un mes hasta hoy. Consulta por MES. Escribe en rawHourlyData (append). */
export const fullReextractFromCloudWatch = internalAction({
  args: {
    startYear: v.optional(v.number()),
    startMonth: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<FullReextractResult> => {
    const startYear = args.startYear ?? 2024;
    const startMonth = args.startMonth ?? 1;

    console.log("========================================");
    console.log("Re-extracción desde CloudWatch");
    console.log(`Por MES: ${startYear}-${String(startMonth).padStart(2, "0")} hasta hoy (hora México)`);
    console.log("========================================\n");

    try {
      const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      const awsRegion = process.env.AWS_REGION || "us-east-1";
      const logGroup =
        process.env.CLOUDWATCH_LOG_GROUP ||
        "/aws/vendedlogs/states/PaymentProcessStateMachineLogs/master";

      if (!awsAccessKeyId || !awsSecretAccessKey) {
        throw new Error("AWS credentials not configured.");
      }

      const client = new CloudWatchLogsClient({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey,
        },
      });

      const now = new Date();
      const mexicoNow = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      const endYear = mexicoNow.getUTCFullYear();
      const endMonth = mexicoNow.getUTCMonth() + 1;
      const endDay = mexicoNow.getUTCDate();

      const PAUSE_MS = 3000;
      let monthsProcessed = 0;
      let totalRecords = 0;
      let lastProcessedDate = "";

      for (const { year, month, endDay: monthEndDay } of iterateMonths(
        startYear, startMonth,
        endYear, endMonth,
        endDay
      )) {
        const canceled = await ctx.runQuery(internal.queries.getReextractCanceled);
        if (canceled) {
          console.log("\n⛔ Cancelación solicitada. Deteniendo re-extracción.");
          return {
            success: false,
            error: "Canceled by user",
            daysProcessed: monthsProcessed,
            totalRecords,
            lastProcessedDate,
          };
        }

        const { startUTC, endUTC } = getDateRangeForMonth(year, month, monthEndDay);
        console.log(`  Consultando ${year}-${String(month).padStart(2, "0")}...`);

        const results = await executeCloudWatchQuery(
          client,
          logGroup,
          startUTC.getTime(),
          endUTC.getTime()
        );

        if (results.length > 0) {
          const rawRows = processResultsForMonth(results);
          const monthTotal = rawRows.reduce((a, r) => a + r.events, 0);

          const BATCH_SIZE = 100;
          for (let i = 0; i < rawRows.length; i += BATCH_SIZE) {
            const batch = rawRows.slice(i, i + BATCH_SIZE).map((r) => ({
              year: r.year,
              month: r.month,
              day: r.day,
              hour: r.hour,
              events: r.events,
            }));
            await ctx.runMutation(internal.mutations.batchInsertRawHourlyData, {
              data: batch,
            });
          }

          totalRecords += monthTotal;
          const lastRow = rawRows[rawRows.length - 1];
          if (lastRow) {
            lastProcessedDate = `${lastRow.year}-${String(lastRow.month).padStart(2, "0")}-${String(lastRow.day).padStart(2, "0")}`;
          }
          console.log(`    ${rawRows.length} horas, ${monthTotal} eventos`);
        }

        monthsProcessed++;
        await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
      }

      console.log(`\n✅ Re-extracción completada: ${monthsProcessed} meses, ${totalRecords} registros`);
      return {
        success: true,
        daysProcessed: monthsProcessed,
        totalRecords,
        lastProcessedDate,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("❌ Error en fullReextractFromCloudWatch:", errMsg);
      return { success: false, error: errMsg };
    }
  },
});

/** Wrapper público para ejecutar re-extracción manualmente (desde 2024-01) */
export const runFullReextract = action({
  handler: async (ctx): Promise<FullReextractResult> => {
    return await ctx.runAction(internal.cloudwatch.fullReextractFromCloudWatch, {});
  },
});

// ============ REBUILD AGGREGATES ============

/** Reconstruye dailyData, monthlyData, hourlyDistribution desde rawHourlyData */
export const rebuildAggregatesFromRaw = internalAction({
  handler: async (ctx) => {
    console.log("========================================");
    console.log("Rebuild de agregados desde rawHourlyData");
    console.log("========================================\n");

    const dailyMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    const hourlyMap = new Map<string, number>();

    const now = new Date();
    const mexicoNow = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const todayYear = mexicoNow.getUTCFullYear();
    const todayMonth = mexicoNow.getUTCMonth() + 1;
    const todayDay = mexicoNow.getUTCDate();

    let nextCursor: string | null = null;
    let totalRaw = 0;
    const rawToday: Array<{ year: number; month: number; day: number; hour: number; events: number }> = [];

    do {
      const result = await ctx.runQuery(
        internal.queries.getRawHourlyDataPage,
        { cursor: nextCursor }
      ) as {
        page: Array<{ year: number; month: number; day: number; hour: number; events: number }>;
        isDone: boolean;
        continueCursor: string;
      };
      const { page, isDone, continueCursor } = result;
      totalRaw += page.length;
      for (const r of page) {
      const dayKey = `${r.year}-${r.month}-${r.day}`;
      dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + r.events);

      const monthKey = `${r.year}-${r.month}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + r.events);

      const dayType = isWeekend(r.year, r.month, r.day) ? "weekend" : "weekday";
      const hourKey = `${r.year}-${r.month}-${dayType}-${r.hour}`;
      hourlyMap.set(hourKey, (hourlyMap.get(hourKey) ?? 0) + r.events);

        if (r.year === todayYear && r.month === todayMonth && r.day === todayDay) {
          rawToday.push(r);
        }
      }
      nextCursor = isDone ? null : (continueCursor as string);
    } while (nextCursor !== null);

    console.log(`  rawHourlyData: ${totalRaw} registros`);

    await ctx.runMutation(internal.mutations.clearAggregatesOnly);

    const dailyData: { year: number; month: number; day: number; events: number; isComplete: boolean }[] = [];
    for (const [key, events] of dailyMap) {
      const [y, m, d] = key.split("-").map(Number);
      const isPast = y < todayYear || (y === todayYear && m < todayMonth) || (y === todayYear && m === todayMonth && d < todayDay);
      dailyData.push({ year: y, month: m, day: d, events, isComplete: isPast });
    }

    const monthlyData: { year: number; month: number; events: number }[] = [];
    for (const [key, events] of monthlyMap) {
      const [y, m] = key.split("-").map(Number);
      monthlyData.push({ year: y, month: m, events });
    }

    const hourlyData: { year: number; month: number; dayType: string; hour: number; events: number }[] = [];
    for (const [key, events] of hourlyMap) {
      const parts = key.split("-");
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const dayType = parts[2];
      const hour = Number(parts[3]);
      hourlyData.push({ year, month, dayType, hour, events });
    }

    const BATCH = 100;
    for (let i = 0; i < dailyData.length; i += BATCH) {
      await ctx.runMutation(api.mutations.batchInsertDailyData, {
        data: dailyData.slice(i, i + BATCH),
      });
    }
    console.log(`  dailyData: ${dailyData.length} registros`);

    for (let i = 0; i < monthlyData.length; i += BATCH) {
      await ctx.runMutation(internal.mutations.batchInsertMonthlyData, {
        data: monthlyData.slice(i, i + BATCH),
      });
    }
    console.log(`  monthlyData: ${monthlyData.length} registros`);

    for (let i = 0; i < hourlyData.length; i += BATCH) {
      await ctx.runMutation(api.mutations.batchInsertHourlyDistribution, {
        data: hourlyData.slice(i, i + BATCH),
      });
    }
    console.log(`  hourlyDistribution: ${hourlyData.length} registros`);

    if (rawToday.length > 0) {
      const byHour = new Map<number, number>();
      for (const r of rawToday) {
        byHour.set(r.hour, (byHour.get(r.hour) ?? 0) + r.events);
      }
      const sorted = Array.from(byHour.entries()).sort((a, b) => a[0] - b[0]);
      let cumulative = 0;
      const intradayData = sorted.map(([hour, events]) => {
        cumulative += events;
        return { hour, events, cumulative };
      });
      await ctx.runMutation(internal.mutations.replaceIntradayData, {
        day: todayDay,
        data: intradayData,
      });
      const extractionHour = mexicoNow.getUTCHours();
      const extractionMinute = mexicoNow.getUTCMinutes();
      const extractionTimeStr = `${extractionHour.toString().padStart(2, "0")}:${extractionMinute.toString().padStart(2, "0")}`;
      await ctx.runMutation(internal.mutations.updateIntradayMeta, {
        day: todayDay,
        lastExtraction: extractionTimeStr,
        lastExtractionIso: now.toISOString(),
      });
      console.log(`  intradayData: día ${todayDay} actualizado`);
    }

    // Watermark: último día completo descargado de CloudWatch (rawHourlyData)
    const completeDaysThisMonth = Array.from(dailyMap.keys())
      .map((key) => key.split("-").map(Number))
      .filter(([y, m, d]) => y === todayYear && m === todayMonth && d < todayDay)
      .map(([, , d]) => d);
    const lastCompleteDayFromCloudWatch =
      completeDaysThisMonth.length > 0 ? Math.max(...completeDaysThisMonth) : 0;

    await ctx.runMutation(internal.mutations.updateProcessingControl, {
      key: "lastProcessedDay",
      lastCompleteDay: lastCompleteDayFromCloudWatch,
      lastProcessedTimestamp: now.toISOString(),
      year: todayYear,
      month: todayMonth,
    });

    console.log(
      `  Watermark (desde CloudWatch): último día completo = ${lastCompleteDayFromCloudWatch}`
    );
    console.log("\n✅ Rebuild completado");
  },
});

/** Wrapper público para rebuild */
export const runRebuildAggregates = action({
  handler: async (ctx): Promise<void> => {
    await ctx.runAction(internal.cloudwatch.rebuildAggregatesFromRaw);
  },
});

// ============ FLUJO COMPLETO: CLEAR + RE-EXTRACT + REBUILD ============

/** Reanuda re-extracción desde un mes (ej. 2025-02) y rebuild. No borra datos existentes. */
export const runResumeReextractAndRebuild = action({
  args: {
    startYear: v.number(),
    startMonth: v.number(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    try {
      await ctx.runMutation(internal.mutations.clearReextractCanceled);
      console.log("⏸️  Pausando cron...");
      await ctx.runMutation(api.mutations.setCronPaused, { paused: true });

      const reextractResult = await ctx.runAction(internal.cloudwatch.fullReextractFromCloudWatch, {
        startYear: args.startYear,
        startMonth: args.startMonth,
      });
      if (!reextractResult.success) {
        await ctx.runMutation(api.mutations.setCronPaused, { paused: false });
        await ctx.runMutation(internal.mutations.clearReextractCanceled);
        return { success: false, error: reextractResult.error };
      }

      console.log("\n📊 Reconstruyendo agregados (watermark desde rawHourlyData/CloudWatch)...");
      await ctx.runAction(internal.cloudwatch.rebuildAggregatesFromRaw);

      console.log("▶️  Reactivando cron...");
      await ctx.runMutation(api.mutations.setCronPaused, { paused: false });
      await ctx.runMutation(internal.mutations.clearReextractCanceled);

      return { success: true };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("❌ Error:", errMsg);
      await ctx.runMutation(api.mutations.setCronPaused, { paused: false });
      await ctx.runMutation(internal.mutations.clearReextractCanceled);
      return { success: false, error: errMsg };
    }
  },
});

/** Re-extrae desde CloudWatch y reconstruye agregados. Pausa el cron durante el proceso. */
export const runFullReextractAndRebuild = action({
  handler: async (ctx): Promise<{ success: boolean; error?: string }> => {
    try {
      await ctx.runMutation(internal.mutations.clearReextractCanceled);
      console.log("⏸️  Pausando cron...");
      await ctx.runMutation(api.mutations.setCronPaused, { paused: true });

      const reextractResult = await ctx.runAction(internal.cloudwatch.fullReextractFromCloudWatch, {});
      if (!reextractResult.success) {
        await ctx.runMutation(api.mutations.setCronPaused, { paused: false });
        await ctx.runMutation(internal.mutations.clearReextractCanceled);
        return { success: false, error: reextractResult.error };
      }

      console.log("\n📊 Reconstruyendo agregados (watermark desde rawHourlyData/CloudWatch)...");
      await ctx.runAction(internal.cloudwatch.rebuildAggregatesFromRaw);

      console.log("▶️  Reactivando cron...");
      await ctx.runMutation(api.mutations.setCronPaused, { paused: false });
      await ctx.runMutation(internal.mutations.clearReextractCanceled);

      return { success: true };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("❌ Error:", errMsg);
      await ctx.runMutation(api.mutations.setCronPaused, { paused: false });
      await ctx.runMutation(internal.mutations.clearReextractCanceled);
      return { success: false, error: errMsg };
    }
  },
});

// ============ VALIDACIÓN DE CALIDAD: CloudWatch diario vs raw agregado por día ============

/** Extrae CloudWatch por AÑO, agrega a totales diarios, y compara con rawHourlyData agrupado por día. */
export const runDailyValidationFromCloudWatch = action({
  handler: async (
    ctx
  ): Promise<{
    success: boolean;
    error?: string;
    comparisons?: Array<{
      date: string;
      cloudwatchEvents: number;
      rawEvents: number;
      match: boolean;
      diff: number;
    }>;
    summary?: {
      totalDays: number;
      matched: number;
      mismatched: number;
      missingInRaw: number;
      missingInCloudWatch: number;
    };
  }> => {
    try {
      const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      const awsRegion = process.env.AWS_REGION || "us-east-1";
      const logGroup =
        process.env.CLOUDWATCH_LOG_GROUP ||
        "/aws/vendedlogs/states/PaymentProcessStateMachineLogs/master";

      if (!awsAccessKeyId || !awsSecretAccessKey) {
        throw new Error("AWS credentials not configured.");
      }

      const client = new CloudWatchLogsClient({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey,
        },
      });

      const now = new Date();
      const mexicoNow = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      const endYear = mexicoNow.getUTCFullYear();
      const endMonth = mexicoNow.getUTCMonth() + 1;
      const endDay = mexicoNow.getUTCDate();

      console.log("========================================");
      console.log("Validación de calidad: CloudWatch diario vs raw");
      console.log("Por AÑO: 2024-01-01 hasta hoy");
      console.log("========================================\n");

      // 1. Extraer CloudWatch por año y agregar a totales diarios
      const cloudWatchDaily = new Map<string, number>();
      for (let y = 2024; y <= endYear; y++) {
        const isCurrentYear = y === endYear;
        const { startUTC, endUTC } = getDateRangeForYear(
          y,
          isCurrentYear ? endMonth : undefined,
          isCurrentYear ? endDay : undefined
        );
        console.log(`  CloudWatch ${y}...`);

        const results = await executeCloudWatchQuery(
          client,
          logGroup,
          startUTC.getTime(),
          endUTC.getTime()
        );

        if (results.length > 0) {
          const rows = processResultsForMonth(results);
          for (const r of rows) {
            const key = `${r.year}-${r.month}-${r.day}`;
            cloudWatchDaily.set(key, (cloudWatchDaily.get(key) ?? 0) + r.events);
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // 2. Agregar rawHourlyData por día (paginado)
      const rawDaily = new Map<string, number>();
      let nextCursor: string | null = null;
      do {
        const result = (await ctx.runQuery(
          internal.queries.getRawHourlyDataPage,
          { cursor: nextCursor }
        )) as {
          page: Array<{ year: number; month: number; day: number; hour: number; events: number }>;
          isDone: boolean;
          continueCursor: string;
        };
        for (const r of result.page) {
          const key = `${r.year}-${r.month}-${r.day}`;
          rawDaily.set(key, (rawDaily.get(key) ?? 0) + r.events);
        }
        nextCursor = result.isDone ? null : (result.continueCursor as string);
      } while (nextCursor !== null);

      // 3. Comparar día por día
      const comparisons: Array<{
        date: string;
        cloudwatchEvents: number;
        rawEvents: number;
        match: boolean;
        diff: number;
      }> = [];

      let matched = 0;
      let mismatched = 0;
      let missingInRaw = 0;
      let missingInCloudWatch = 0;

      for (const { year, month, day } of iterateDays(2024, 1, 1, endYear, endMonth, endDay)) {
        const key = `${year}-${month}-${day}`;
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const cw = cloudWatchDaily.get(key) ?? 0;
        const raw = rawDaily.get(key) ?? 0;

        if (cw > 0 && raw === 0) missingInRaw++;
        if (cw === 0 && raw > 0) missingInCloudWatch++;
        const diff = cw - raw;
        const match = diff === 0;
        if (match) matched++;
        else mismatched++;

        comparisons.push({
          date: dateStr,
          cloudwatchEvents: cw,
          rawEvents: raw,
          match,
          diff,
        });
      }

      const summary = {
        totalDays: comparisons.length,
        matched,
        mismatched,
        missingInRaw,
        missingInCloudWatch,
      };

      console.log("\n✅ Validación completada");
      console.log(`  Total días: ${summary.totalDays}`);
      console.log(`  Coinciden: ${summary.matched}`);
      console.log(`  Diferencias: ${summary.mismatched}`);
      if (summary.mismatched > 0) {
        const diffs = comparisons.filter((c) => !c.match);
        console.log(`  Primeras diferencias:`, diffs.slice(0, 10));
      }

      return {
        success: true,
        comparisons,
        summary,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("❌ Error en validación:", errMsg);
      return { success: false, error: errMsg };
    }
  },
});
