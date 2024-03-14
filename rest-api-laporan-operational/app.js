import dotenv from 'dotenv';

import httpServer from './app/http/httpServer.js';
import './helpers/global.js';

dotenv.config();

try {
  await httpServer.start();
} catch (error) {
  logger.error({ stack: error.stack, msg: error.message });
}
