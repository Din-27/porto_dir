// mongodb@5.8.1
// eslint-disable-next-line import/no-unresolved
import { MongoClient } from 'mongodb';
import { mongoConnections } from '../../../config/dbConnections.js';

class PoolManager {
  static instance = null;

  connections = [];

  constructor() {
    /** init pooling coonection */
    const keys = Object.keys(mongoConnections);
    for (let i = 0; i < keys.length; i += 1) {
      this.connections[keys[i]] = new MongoClient(
        mongoConnections[keys[i]],
        {
          connectTimeoutMS: 10000,
          waitQueueTimeoutMS: 5000,
          maxConnecting: 20,
        },
      );
    }
    logger.info('[PoolManager] Mongo poll is initialized');
  }

  /**
    * @returns { PoolManager }
    */
  static getInstance() {
    if (PoolManager.instance === null) {
      PoolManager.instance = new PoolManager();
    }

    return PoolManager.instance;
  }

  /* eslint-disable */
  /**
    *
    * @param {String} connName
    * @returns { Promise<import("mongodb").MongoClient}
    */
  async getConnection(connName) {
    if (this.connections[connName] === undefined) {
      throw new Error(`Database mongodb pool for "${connName}" is not initialized.`);
    }

    try {
      return await this.connections[connName].connect();
    } catch (error) {
      logger.error({ stack: error.stack, msg: error.message });
      return null;
    }
  }
  /* eslint-enable */
}

export default PoolManager.getInstance();
