import Ioredis from 'ioredis';
import ModelsDataPengeluaran from '../models/dataPengeluaran.js';
import { redisConnection } from '../config/dbConnections.js';

export default class DataPengeluaranService extends ModelsDataPengeluaran {
  #key = 'data_monitor_operasional';

  constructor(io) {
    super();
    this.io = io;
    this.client = new Ioredis(`${redisConnection.url}`);
  }

  async Service() {
    const DETIK_PERMILISECOND = 1000;
    const { dataArrayPertama, dataArrayKedua } = await this.MainProcessing();
    // console.log(dataArrayPertama);
    setInterval(() => {
      this.io.emit('data_pengeluaran', JSON.stringify({
        order_lebih_dari_52: dataArrayPertama,
        order_kurang_dari_52: dataArrayKedua,
      }));
    }, DETIK_PERMILISECOND);
  }

  async MainProcessing() {
    const order_lebih_dari_52 = await this.findAll({ where: '> 52' });
    const order_kurang_dari_52 = await this.findAll({ where: '<= 52' });

    const datasMerged = [order_lebih_dari_52, order_kurang_dari_52];
    const results = await this.cachingData({ datas: datasMerged });
    for (let index = 0, l = results.length; index < l; index += 1) {
      const dataPerItem = results[index];
      // console.log(dataPerItem);
      await this.DataProcessingMachine(dataPerItem);
    }
    const [dataArrayPertama, dataArrayKedua] = results;
    return {
      dataArrayPertama,
      dataArrayKedua,
    };
  }

  async DataProcessingMachine(datas) {
    // return console.log(datas);
    for (let index = 0, l = datas.length; index < l; index += 1) {
      const item = datas[index];
      if (item.no_order.slice(0, 2) !== 'KT') {
        const data = await this.findDataProperty({ no_order: item.no_order });
        item.jml_potong = data.length;
      } else {
        const dataKatalog = await this.findKatalogProperty({ no_order: item.no_order });
        item.jml_potong = dataKatalog.length;
        item.berat = dataKatalog[0].berat;
      }
    }
  }

  async cachingData({ datas }) {
    let results;
    const cacheResults = await this.client.get(this.#key);
    const loopNameSistem = datas === cacheResults;
    // console.log(cacheResults);

    if (cacheResults) {
      if (loopNameSistem) {
        results = JSON.parse(cacheResults);
      } else {
        await this.client.del(this.#key);
        await this.client.set(this.#key, JSON.stringify(datas));
        results = datas;
      }
      // console.log('masuk');
    } else {
      results = datas;
      if (results.length === 0) {
        return 'API returned an empty array';
      }
      await this.client.set(this.#key, JSON.stringify(datas));
      // console.log('masuk else');
    }
    return results;
  }
}
