import winston from 'winston';
import { dashboard } from './dashboard.js';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, module, ...metadata }) => {
  // Update Dashboard if enabled
  if (dashboard) {
    dashboard.log(module as string || 'General', message as string, metadata);
  }

  let msg = `${timestamp} [${level}]${module ? ` [${module}]` : ''}: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp(),
    json()
  ),
  defaultMeta: { service: 'agent-stack' },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});
