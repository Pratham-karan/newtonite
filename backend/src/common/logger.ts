import winston from 'winston';
import { config } from '../config';

/**
 * Structured logger — JSON in production, colorised text in development.
 * Never log passwords, tokens, or sensitive user data.
 */
const logger = winston.createLogger({
  level: config.isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    config.isProduction
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
            const rid = requestId ? ` [${requestId}]` : '';
            const extra = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level}${rid}: ${message}${extra}`;
          })
        )
  ),
  transports: [new winston.transports.Console()],
  // Suppress logs during tests to keep output clean
  silent: config.isTest,
});

export default logger;
