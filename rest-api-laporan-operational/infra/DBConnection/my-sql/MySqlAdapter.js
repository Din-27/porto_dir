// mysql2@3.2.0
import PoolManager from './PoolManager.js';

export default class MySqlAdapter {
  #dbName = '';

  #activeTrx = true;

  /**
     * @type {import("mysql2").PoolConnection}
     */
  #conn = null;

  constructor(dbName = 'default') {
    this.#dbName = dbName;
  }

  async query(sql, values = []) {
    try {
      const conn = await this.getConnection();
      const [rows] = await conn.execute(sql, values);

      if (!this.#activeTrx) await this.releaseConnection();

      return rows;
    } catch (error) {
      if (!this.#activeTrx) {
        await this.releaseConnection()
          .catch((err) => logger.error({ stack: err.stack, msg: err.message }));
      }

      throw error;
    }
  }

  async setRedis(sql, values = []) {
    try {
      const conn = await this.g();
      const [rows] = await conn.execute(sql, values);

      if (!this.#activeTrx) await this.releaseConnection();

      return rows;
    } catch (error) {
      if (!this.#activeTrx) {
        await this.releaseConnection()
          .catch((err) => logger.error({ stack: err.stack, msg: err.message }));
      }

      throw error;
    }
  }

  /**
     *
     * @returns {Promise<import("mysql2/promise.js").PoolConnection>}
     */
  async getConnection() {
    if (this.#conn == null) { this.#conn = await PoolManager.getConnection(this.#dbName); }

    return this.#conn;
  }

  async releaseConnection() {
    this.#conn.release();
    this.#conn = null;
    this.#activeTrx = false;
  }

  async begin() {
    if (this.#conn != null) {
      throw new Error('beginTransaction cannot be used simultaneously on an instance');
    }

    const conn = await this.getConnection();
    await conn.beginTransaction();
    this.#activeTrx = true;
  }

  async commit() {
    if (this.#conn == null) throw new Error('please use begin first');

    const conn = await this.getConnection();
    await conn.commit();
    await this.releaseConnection();
  }

  async rollback() {
    if (this.#conn == null) throw new Error('please use begin first');

    const conn = await this.getConnection();
    await conn.rollback();
    await this.releaseConnection();
  }
}
