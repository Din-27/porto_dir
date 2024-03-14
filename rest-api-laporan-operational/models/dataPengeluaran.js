// mysql2@3.2.0
import MySqlAdapter from '../infra/DBConnection/my-sql/MySqlAdapter.js';
import queryStorage from '../storage/queryStorage.js';

export default class DataPengeluaranModels extends MySqlAdapter {
  #querystr = '';

  constructor(querystr = queryStorage.queryFindAllDataPengeluaran) {
    super();
    this.#querystr = querystr;
  }

  async findAll({ where }) {
    let result;
    const data = await this.query(this.#querystr);
    if (where.includes('52')) {
      switch (where) {
        case '<= 52':
          result = data.filter((x) => x.berat <= 52);
          break;
        case '> 52':
          result = data.filter((x) => x.berat > 52);
          break;
        // no default
      }
    } else {
      result = data.filter((x) => x.no_order === where);
    }

    return result;
  }

  async findDataProperty({ no_order }) {
    const data = await this.query(
      queryStorage.queryJmlScanPropertyDataPengeluaran,
      [no_order, no_order, no_order],
    );
    return data;
  }

  async findKatalogProperty({ no_order }) {
    const data = await this.query(
      queryStorage.queryGetPropertyKatalog,
      [no_order],
    );
    return data;
  }
}
