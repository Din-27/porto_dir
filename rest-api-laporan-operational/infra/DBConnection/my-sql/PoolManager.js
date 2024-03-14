// mysql2@3.2.0
// eslint-disable-next-line import/no-unresolved
import mysql2 from 'mysql2/promise';
import { mysqlConnections } from '../../../config/dbConnections.js';
import logger from '../../Logger/logger.js';

class PoolManager {
  static instance = null;

  connections = [];

  constructor() {
    Object.keys(mysqlConnections).forEach((dbName) => {
      if (Object.prototype.hasOwnProperty.call(mysqlConnections, dbName)) {
        this.connections[dbName] = mysql2.createPool(mysqlConnections[dbName]);
      }
    });
    logger.info('[PoolManager] DB poll is initialized');
  }

  /**
     *
     * @returns {PoolManager}
     */
  static getInstance() {
    if (PoolManager.instance === null) {
      PoolManager.instance = new PoolManager();
    }

    return PoolManager.instance;
  }

  /**
     *
     * @param {string} connName
     * @returns {Promise<mysql2.PoolConnection>}
     */
  async getConnection(connName) {
    if (this.connections[connName] === undefined) {
      throw new Error(`Database pool for "${connName}" is not initialized.`);
    }

    try {
      const conn = await this.connections[connName].getConnection();
      return conn;
    } catch (error) {
      logger.error({ stack: error.stack, msg: error.message });
      return null;
    }
  }
}

export default PoolManager.getInstance();
