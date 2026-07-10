import { PrismaClient } from '@prisma/client';
import os from 'os';

// Each cluster worker is a separate process with its own connection pool, so
// the naive per-process default (num_cpus * 2 + 1) multiplies out across
// workers and can blow past MySQL's default max_connections (151) under
// clustering. Divide a fixed total budget across the actual worker count
// instead, unless the operator has already set connection_limit explicitly.
function buildDatabaseUrl() {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl || baseUrl.includes('connection_limit=')) return baseUrl;

  const clusterEnabled = process.env.ENABLE_CLUSTER !== 'false';
  const numWorkers = clusterEnabled
    ? (parseInt(process.env.CLUSTER_WORKERS, 10) || os.cpus().length)
    : 1;

  const totalBudget = parseInt(process.env.DB_CONNECTION_LIMIT_TOTAL, 10) || 40;
  const perWorkerLimit = Math.max(2, Math.floor(totalBudget / numWorkers));

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}connection_limit=${perWorkerLimit}`;
}

const prisma = new PrismaClient({
  datasources: { db: { url: buildDatabaseUrl() } },
});

export default prisma;
