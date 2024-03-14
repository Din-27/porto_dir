// redis@4.6.8
// eslint-disable-next-line import/no-unresolved, import/no-extraneous-dependencies
import Ioredis from 'ioredis';
import { redisConnection } from '../../config/dbConnections.js';

class RedisConn {
  constructor() {
    this.client = new Ioredis(`${redisConnection.url}`);
  }

  async set(key, value) {
    // console.log(key, JSON.stringify(value));
    await this.client.set(key, JSON.stringify(value));
  }

  async get(key) {
    const result = await this.client.get(key);
    JSON.parse(result);
  }

  async delete(key) {
    await this.client.del(key);
  }

  async keys(pattern) {
    await this.client.keys(pattern);
  }

  async quit() {
    await this.client.quit();
  }
}

export default RedisConn;
