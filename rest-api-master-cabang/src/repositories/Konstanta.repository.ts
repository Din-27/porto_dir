import { EntityRepo } from '@knittotextile/knitto-core-backend';
import { KonstantaEntity } from '../entity/Konstanta.entity';

export default class KonstantaRepository extends EntityRepo<KonstantaEntity> {
	tableName = 'konstanta';
	async insert(data: KonstantaEntity): Promise<unknown> {
		return await super.insert(data);
	}

	async update(data: KonstantaEntity): Promise<unknown> {
		return await super.update(data, {
			jenis: data.jenis
		});
	}

	async getAll(): Promise<unknown> {
		const data = await this.dbConnector
			.raw<KonstantaEntity[]>('SELECT * FROM konstanta');
		return data;
	}

	async getById(jenis: string) {
		const data = await this.dbConnector
			.raw<KonstantaEntity[]>('SELECT * FROM konstanta where jenis=?', [jenis])
			.then(result => result[0]);
		return data;
	}
};
