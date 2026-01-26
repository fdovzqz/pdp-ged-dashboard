"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  CloudWatchLogsClient,
  StartQueryCommand,
  GetQueryResultsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

// Días de fin de semana por año (para determinar dayType)
const WEEKEND_DAYS: Record<number, number[]> = {
  2024: [6, 7, 13, 14, 20, 21, 27, 28],
  2025: [4, 5, 11, 12, 18, 19, 25, 26],
  2026: [3, 4, 10, 11, 17, 18, 24, 25, 31],
};

// Función helper para determinar si un día es fin de semana
function isWeekend(year: number, day: number): boolean {
  return WEEKEND_DAYS[year]?.includes(day) ?? false;
}

// Función para calcular rango de fechas en UTC considerando UTC-6 de México
function getDateRangeForDay(day: number, year = 2026, month = 0): { startUTC: Date; endUTC: Date } {
  // Día en México empieza a las 06:00 UTC del día N
  // Día en México termina a las 05:59:59.999 UTC del día N+1
  const startUTC = new Date(Date.UTC(year, month, day, 6, 0, 0, 0));
  const endUTC = new Date(Date.UTC(year, month, day + 1, 5, 59, 59, 999));
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

// Función para procesar resultados de CloudWatch
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
      // timestampValue is guaranteed to be string here
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

      // Obtener último día procesado desde la base de datos
      const processingControl = await ctx.runQuery(
        internal.queries.getProcessingControl
      );

      const lastCompleteDay: number = processingControl?.lastCompleteDay ?? 0;
      console.log(`Último día completo procesado: ${lastCompleteDay}`);

      // Obtener fecha actual en México (UTC-6)
      const now = new Date();
      const mexicoNow = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      const todayDay = mexicoNow.getUTCDate();
      const todayHour = mexicoNow.getUTCHours();
      const todayMonth = mexicoNow.getUTCMonth();
      const todayYear = mexicoNow.getUTCFullYear();

      console.log(
        `Fecha actual (México): ${todayYear}-${String(todayMonth + 1).padStart(2, "0")}-${String(todayDay).padStart(2, "0")} ${String(todayHour).padStart(2, "0")}:00`
      );

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

        if (isComplete) {
          // Día completo: insertar en dailyData
          await ctx.runMutation(internal.mutations.internalUpsertDailyData, {
            year: todayYear,
            day,
            events: dayTotal,
            isComplete: true,
          });

          // Actualizar distribución horaria
          const dayType = isWeekend(todayYear, day) ? "weekend" : "weekday";
          for (const [hour, events] of hourlyMap) {
            await ctx.runMutation(internal.mutations.incrementHourlyDistribution, {
              year: todayYear,
              dayType,
              hour,
              additionalEvents: events,
            });
          }

          lastCompleteDayProcessed = day;
          console.log(`✅ Día ${day} completo procesado: ${dayTotal} eventos`);
        } else {
          // Día incompleto: guardar para intradía
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

  console.log(`📊 Intradía actualizado: ${intradayData.length} horas con datos`);
}

// Action pública para trigger manual
export const manualFetch = action({
  handler: async (ctx): Promise<FetchResult> => {
    return await ctx.runAction(internal.cloudwatch.fetchAndUpdateData);
  },
});
