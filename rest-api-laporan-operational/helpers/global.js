import logger from '../infra/Logger/logger.js';
import sendResponse, { sendErrorResponse } from './sendResponse.js';

global.myDumpExit = (...data) => {
  for (let index = 0; index < data.length; index += 1) {
    logger.log(data[index]);
  }

  logger.info('Process exited from myDump function');
  process.exit(0);
};

global.myDumpErr = (err) => {
  if (typeof err === 'object') {
    if (err.message) {
      logger.error(`\nMessage: ${err.message}`);
    }

    if (err.stack) {
      logger.error('\nStacktrace:');
      logger.error('====================');
      logger.error(err.stack);
    }
  } else {
    logger.error(err);
  }
};

global.mySendResponse = sendResponse;
global.mySendErrorResponse = sendErrorResponse;
global.logger = logger;
