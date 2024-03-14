import { EntityRepo } from '@knittotextile/knitto-core-backend';
import { UserEntity } from '../entity/User.entity';

export default class UserRepository extends EntityRepo<UserEntity<string>> {
	tableName = 'user';
	async insert(data: UserEntity<string>): Promise<unknown> {
		return await super.insert(data);
	}

	async getAll(param: { perPage: number, page: number }) {
		const { perPage, page } = param;

		const data = await this.dbConnector.basicPaginate({
			query: 'SELECT * FROM user',
			perPage,
			page
		});

		return data;
	}

	async getBy(
		{
			idUser,
			username,
			password
		}: {
			idUser?: number
			username?: string
			password?: string
		}
	) {
		let query = 'select * from user where id_user=?';
		let value: string[] | number[] = [idUser];
		if (!idUser) {
			query = 'select * from user where username=? and password=md5(?)';
			value = [username, password];
		}
		const data = await this.dbConnector.raw<UserEntity<string[]>>(query, value)
			.then(result => result[0]);
		return data;
	}
};
