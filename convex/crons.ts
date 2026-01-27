import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Ejecutar extracción de CloudWatch con intervalo base de 1 minuto.
// La lógica interna ajusta efectivamente a 1 min (9:00-21:00)
// o 5 min (21:00-9:00) según el horario de México.
crons.interval(
  "fetch-cloudwatch-data",
  { minutes: 1 },
  internal.cloudwatch.fetchAndUpdateData
);

export default crons;
