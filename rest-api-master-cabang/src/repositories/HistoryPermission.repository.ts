import { EntityRepo } from '@knittotextile/knitto-core-backend';
import { HistoryPermissionEntity } from '../entity/HistoryPermission.entity';

export default class HistoryPermissionRepository extends EntityRepo<HistoryPermissionEntity<string>> {
	tableName = 'n_history_permession';
	async insert(data: HistoryPermissionEntity<string>): Promise<unknown> {
		const GET_NAMA_CABANG = await this.dbConnector.raw('SELECT nama_cabang AS `status` FROM data_cabang')
			.then(res => res[0].status);
		const cabang = data.status === 'true' ? GET_NAMA_CABANG : 'PUSAT';
		return await this.dbConnector.raw<HistoryPermissionEntity<string>>('insert into n_history_permession ' +
			'(tanggal, jenis, `before`, `after`, id_user, nama, cabang)' +
			'values(now(), ?, ?, ?, ?, ?, ?)', [data.jenis, data.before, data.after, data.id_user, data.nama, cabang]);
	}

	async getAll() {
		const data = await this.dbConnector.raw<HistoryPermissionEntity<string>>('SELECT n.*, u.nama FROM n_history_permession n JOIN user u USING(id_user) where cabang  <> "PUSAT"');
		return data;
	}

	async getById(jenis: string) {
		const data = await this.dbConnector
			.raw<HistoryPermissionEntity<string>>('SELECT n.*, u.nama FROM n_history_permession n JOIN user u USING(id_user) where jenis like ? and cabang  <> "PUSAT"', [`%${jenis}%`]);
		return data;
	}
};
