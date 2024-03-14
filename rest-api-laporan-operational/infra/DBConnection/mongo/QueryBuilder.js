import QueryParser from './QueryParser.js';
/**
 * @typedef {import('./DriverAdapter.js').default} DriverAdapter
 */
export default class QueryBuilder extends QueryParser {
  collection = null;

  /**
   * @type {DriverAdapter}
   */
  #driver = null;

  /**
   *
   * @param {Object} opts
   * @param { string } opts.collection
   * @param {DriverAdapter} opts.driver
   */
  constructor({ collection = null, driver } = {}) {
    super();
    this.collection = collection;
    this.#driver = driver;
  }

  // =========== ACTION AREA =======================
  async find() {
    const data = await this.#driver.raw(async (con, session) => {
      const exec = await con.collection(this.collection)
        .findOne(this.query.$match, {
          session,
          projection: this.$projection,
          sort: this.sort,
        });

      return exec;
    });

    return data;
  }

  async insert(data) {
    const res = await this.#driver.raw(async (conn, session) => {
      const exec = conn.collection(this.collection)
        .insertOne(data, { session });

      return exec;
    });

    return res;
  }

  async insertMany(data) {
    const res = await this.raw(async (conn, session) => {
      const exec = conn.collection(this.collection)
        .insertMany(data, { session });

      return exec;
    });

    return res;
  }

  async delete() {
    const res = await this.#driver.raw(async (con, session) => {
      const exec = await con.collection(this.collection)
        .deleteOne(this.query.$match, { session });

      return exec;
    });

    return res;
  }

  async update(data) {
    const res = await this.#driver.raw(async (con, session) => {
      const exec = await con.collection(this.collection)
        .updateOne(this.query.$match, { $set: data }, { session });

      return exec;
    });

    return res;
  }

  async updateRaw(data) {
    const res = await this.#driver.raw(async (con, session) => {
      const exec = await con.collection(this.collection)
        .updateOne(this.query.$match, data, { session });

      return exec;
    });

    return res;
  }

  async updateMany(data) {
    const res = await this.#driver.raw(async (con, session) => {
      const exec = await con.collection(this.collection)
        .updateMany(this.query.$match, { $set: data }, { session });

      return exec;
    });

    return res;
  }

  async get() {
    const res = await this.#driver.raw(async (con, session) => {
      const exec = await con.collection(this.collection)
        .find(this.query.$match, {
          session,
          projection: this.projection,
          sort: this.sort,
        })
        .toArray();

      return exec;
    });

    return res;
  }

  createObjectId(id) {
    return this.#driver.createObjectId(id);
  }

  table(collection) {
    this.collection = collection;

    return this;
  }

  /**
    *
    * @param { function(import("mongodb").Db,
    *   import("mongodb").ClientSession): Promise<any> } cb
    * @returns {Promise<any>}
    */
  async raw(cb) {
    return this.#driver.raw(cb);
  }

  async begin(isolationLevel = null) {
    return this.#driver.begin(isolationLevel);
  }

  async commit() {
    return this.#driver.commit();
  }

  async rollback() {
    return this.#driver.rollback();
  }
}
