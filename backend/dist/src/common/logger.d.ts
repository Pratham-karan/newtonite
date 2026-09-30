import winston from 'winston';
/**
 * Structured logger — JSON in production, colorised text in development.
 * Never log passwords, tokens, or sensitive user data.
 */
declare const logger: winston.Logger;
export default logger;
