import pino from 'pino';

// Pretty formatted logs by default for high readability.
// Use LOG_FORMAT=json in production environments with centralized log aggregators (e.g. Datadog, CloudWatch).
const isJson = process.env.LOG_FORMAT === 'json';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'req.body.password',
      'req.body.answers',
      'answers',
      '*.answers',
      'password',
    ],
    remove: true,
  },
  ...(isJson
    ? {
        timestamp: pino.stdTimeFunctions.isoTime,
      }
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname,req,res,responseTime',
            singleLine: true,
            errorLikeObjectKeys: ['err', 'error'],
          },
        },
      }),
});

export default logger;
