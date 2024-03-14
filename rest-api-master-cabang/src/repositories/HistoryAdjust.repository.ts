import { EntityRepo } from '@knittotextile/knitto-core-backend';
import { HistoryAdjustEntity } from '../entity/HistoryAdjust.entity';

export default class HistoryAdjustRepository extends EntityRepo<HistoryAdjustEntity<string>> {
	tableName = 'history_adjust_cabang';
	async insert(data: HistoryAdjustEntity<string>): Promise<unknown> {
		return await super.insert(data);
	}

	async getAll() {
		const data = await this.dbConnector.raw<HistoryAdjustEntity<string>>('SELECT n.* FROM history_adjust_cabang n');
		return data;
	}

	async getById(search: string) {
		const _search = `%${search}%`;
		const data = await this.dbConnector
			.raw<HistoryAdjustEntity<string>>('SELECT n.* FROM history_adjust_cabang n where ' +
				'kapasitas_potong_default like ? or ' +
				'kapasitas_potong_adjust like ? or ' +
				'shift like ? or ' +
				'jml_tim_cabang like ? or ' +
				'jml_operator_tim like ? or ' +
				'jml_operator_tidak_masuk like ? or ' +
				'jml_timbangan_rusak like ? or ' +
				'jml_timbangan like ?', [_search, _search, _search, _search, _search, _search, _search, _search]);
		return data;
	}
};
