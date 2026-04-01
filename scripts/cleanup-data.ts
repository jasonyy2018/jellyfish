import { db } from "@jellyfish/db";

async function main() {
  const logsRetentionDays = Number(process.env.LOG_RETENTION_DAYS ?? 14);
  const metricsRetentionDays = Number(process.env.METRIC_RETENTION_DAYS ?? 14);

  const logsBefore = new Date(Date.now() - logsRetentionDays * 24 * 60 * 60 * 1000);
  const metricsBefore = new Date(Date.now() - metricsRetentionDays * 24 * 60 * 60 * 1000);

  const logs = await db.log.deleteMany({ where: { createdAt: { lt: logsBefore } } });
  const metrics = await db.metric.deleteMany({ where: { createdAt: { lt: metricsBefore } } });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ deletedLogs: logs.count, deletedMetrics: metrics.count }, null, 2));
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
