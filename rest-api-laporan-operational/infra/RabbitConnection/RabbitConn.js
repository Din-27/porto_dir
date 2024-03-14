// amqlib ^0.10.3
// eslint-disable-next-line import/no-unresolved
import amqp from 'amqplib';

export default class RabbitConn {
  /**
     * @type { Promise<amqp.Connection> }
     */
  #connection;

  constructor(url) {
    Object.defineProperty(this, 'url', {
      value: url,
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }

  /**
     * create conenction to rabbit mq
     * @returns { Promise<amqp.Connection> }
     */
  async getConnection() {
    if (this.#connection == null) {
      await this.#connect();
    }

    return this.#connection;
  }

  async close() {
    if (this.#connection != null) {
      await this.#connection.close();
    }
  }

  async #connect() {
    try {
      this.#connection = await amqp.connect(this.url);

      this.#connection.on('error', (err) => {
        logger.error('Error when connect to RabbiMq');
        throw err;
      });

      this.#connection.on('connected', () => {
        logger.info('Success connected to Rabbit Mq');
      });
    } catch (err) {
      logger.error('Error connecting to RabbitMQ:', err);
    }
  }
}
