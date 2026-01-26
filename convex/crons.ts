import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Ejecutar extracción de CloudWatch cada 5 minutos
crons.interval(
  "fetch-cloudwatch-data",
  { minutes: 5 },
  internal.cloudwatch.fetchAndUpdateData
);

export default crons;
