import winston from 'winston';
import 'winston-daily-rotate-file';
import { NODE_ENV, APP_NAME } from '../../../config/app.js';

export default function requestLogger(req, res, next) {
  if (NODE_ENV === 'production') {
    const start = new Date();
    const oldSend = res.send;
    const logData = { appName: APP_NAME, response: { code: 200 } };
    // Capture the response body
    res.send = (...args) => {
      try {
        logData.response = {
          code: res.statusCode,
          body: JSON.parse(args[0]),
        };
      } catch (error) {
        if (typeof args[0] === 'string') {
          logData.response = {
            code: res.statusCode,
            body: args[0],
          };
        } else {
          logData.response = {
            code: res.statusCode,
            body: {},
          };
        }
      }

      oldSend.apply(res, args);
    };

    res.on('finish', () => {
      const { headers } = req;
      delete headers.authorization;

      logData.meta = {
        headers,
        ip: req.ip.replace('::ffff:', ''),
        body: req.body,
        query: req.query,
        params: req.params,
        httpVersion: req.httpVersion,
        url: req.originalUrl,
        method: req.method,
        responseTime: new Date() - start,
      };

      const httpLogger = winston.createLogger({
        levels: winston.config.syslog.levels,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
        transports: [
          new winston.transports.DailyRotateFile({ filename: './storage/logs/http-logs-%DATE%.log' }),
        ],
      });

      if (logData.response.code >= 500) {
        httpLogger.error(logData);
      } else if (logData.response.code >= 400) {
        httpLogger.warning(logData);
      } else {
        httpLogger.info(logData);
      }
    });
  } else {
    const start = new Date();
    const oldSend = res.send;
    let respCode = 200;

    res.send = (...args) => {
      respCode = res.statusCode;
      oldSend.apply(res, args);
    };

    res.on('finish', () => {
      const message = `[${respCode}] ${req.method} ${req.originalUrl} ${Date.now() - start}ms`;
      if (respCode >= 500) {
        logger.error(message);
      } else if (respCode >= 400) {
        logger.warning(message);
      } else {
        logger.info(message);
      }
    });
  }

  next();
}
