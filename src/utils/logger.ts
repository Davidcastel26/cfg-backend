import pino from 'pino';

const level = process.env.LOG_LEVEL ?? 'info';

export const logger = pino({
  level,
  base: { service: 'cfg-backend' },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: { paths: ['req.headers.authorization', 'req.headers.cookie', '*.password'], remove: true },
  formatters: { level: (label) => ({ level: label }) },
});
