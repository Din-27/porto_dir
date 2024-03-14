import winston from 'winston';
import 'winston-daily-rotate-file';
import util from 'util';
import { APP_NAME } from '../../config/app.js';

let loggerCfg;
if (process.env.NODE_ENV !== 'production') {
  const colors = {
    info: '\x1b[36m',
    debug: '\x1b[37m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
  };

  const consoleFormat = winston.format.printf(({ level, message }) => {
    let msg = message;

    if (typeof message === 'object') {
      msg = util.inspect(message, false, null, false);
    }
    const color = colors[level];

    return `${color} [${level.toUpperCase()}] ${msg} \x1b[0m`;
  });

  loggerCfg = winston.createLogger({
    levels: winston.config.syslog.levels,
    format: winston.format.combine(consoleFormat),
    transports: [
      new winston.transports.Console(),
    ],
  });
} else {
  loggerCfg = winston.createLogger({
    levels: winston.config.syslog.levels,
    defaultMeta: { appName: APP_NAME },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.DailyRotateFile({ filename: './storage/logs/app-%DATE%.log' }),
    ],
  });
}

const logger = loggerCfg;
export default logger;
