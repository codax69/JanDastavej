import pino from 'pino';

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
  timestamp: pino.stdTimeFunctions.isoTime,
});
