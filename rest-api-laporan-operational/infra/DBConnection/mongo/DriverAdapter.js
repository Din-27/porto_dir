// mongodb@5.8.1
// eslint-disable-next-line import/no-unresolved
import { ObjectId } from 'mongodb';
import PoolManager from './PoolManager.js';

export default class DriverAdapter {
  dbName = '';

  #activeTrx = null;

  #conn = null;

  runningQuery = 0;

  constructor(dbName = 'default') {
    this.dbName = dbName;
  }

  /**
   *
   * @returns { Promise<import("mongodb").MongoClient}
   */
  async getConnection() {
    if (this.#conn === null) {
      this.#conn = await PoolManager.getConnection(this.dbName);
    }

    return this.#conn;
  }

  async releaseConnection() {
    if (this.runningQuery > 1) return false;

    if (this.#activeTrx !== null) {
      await this.#activeTrx.endSession()
        .catch((err) => logger.error({ stack: err.stack, msg: err.message }));

      this.#activeTrx = null;
    }

    this.conn = null;
    return true;
  }

  /**
    *
    * @param { function(import("mongodb").Db,
    *   import("mongodb").ClientSession): Promise<any> } cb
    * @returns {Promise<any>}
    */
  async raw(cb) {
    try {
      this.runningQuery += 1;
      const conn = await this.getConnection();
      const session = this.#activeTrx;
      const data = await cb(conn.db(), session);

      if (this.#activeTrx === null) await this.releaseConnection();
      return data;
    } catch (error) {
      this.runningQuery -= 1;
      if (this.#activeTrx === null) {
        await this.releaseConnection()
          .catch((err) => logger.error({ stack: err.stack, msg: err.message }));
      }

      throw error;
    }
  }

  /* eslint-disable */
  createObjectId(id) {
    return new ObjectId(id);
  }

  async begin(isolationLevel = null) {
    if (this.#conn != null) {
      throw new Error('beginTransaction cannot be used simultaneously on an instance');
    }

    const conn = await this.getConnection();
    this.#activeTrx = conn.startSession();
    let isoLvl = { readConcern: { level: 'majority' } };

    if (isolationLevel !== null) isoLvl = isolationLevel;

    await this.#activeTrx.startTransaction(isoLvl);
  }

  async commit() {
    if (this.#conn == null || this.#activeTrx == null) {
      throw new Error('please use begin first');
    }

    await this.#activeTrx.commitTransaction();
    await this.releaseConnection();
  }

  async rollback() {
    if (this.#conn == null || this.#activeTrx == null) throw new Error('please use begin first');

    await this.#activeTrx.abortTransaction();
    await this.releaseConnection();
  }
}
