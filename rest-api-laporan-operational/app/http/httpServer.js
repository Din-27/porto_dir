import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import { routerLoader } from '../../helpers/expressHelper.js';
import { APP_PORT } from '../../config/app.js';
import { sendErrorResponse } from '../../helpers/sendResponse.js';
import requestLogger from './middleware/requestLogger.js';
import DataPengeluaranService from '../../services/dataPengeluaran.js';

const server = http.createServer(express());
const io = new Server(server, { cors: { origin: '*' } });

const timeoutMs = 15000;
class HttpServer {
  constructor() {
    this.app = express();
    this.SocketService = new DataPengeluaranService(io);
  }

  async start() {
    const port = APP_PORT;

    this.app.use(cors());
    this.app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
    this.app.use(bodyParser.json({ limit: '50mb' }));

    // http logger
    this.#setupHttpLogger();
    this.app.use(await routerLoader('app/http/routers'));
    this.SocketService.Service();

    // Middleware to set a global request timeout
    this.app.use((req, res, next) => {
      const timeoutId = setTimeout(() => {
        res.status(408).json({ error: 'Request Timeout' });
      }, timeoutMs);

      req.on('end', () => { clearTimeout(timeoutId); });

      next();
    });

    // 404
    this.app.use((req, res) => {
      mySendResponse(res, {
        status: 404,
        message: 'Not Found',
      });
    });

    // setup error handler
    this.#setupErrorhandler();
    server.listen(port, () => {
      logger.info(`http-server running in port ${port}`);
    });
  }

  #setupHttpLogger() {
    this.app.use(requestLogger);
    logger.info('[http-server] set http logger');
  }

  #setupErrorhandler() {
    // eslint-disable-next-line no-unused-vars
    this.app.use((err, req, res, next) => {
      myDumpErr(err);
      sendErrorResponse(res, err);
    });
  }
}

export default new HttpServer();
