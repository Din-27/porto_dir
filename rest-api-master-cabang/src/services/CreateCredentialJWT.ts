import configuration from '../config';
import jwt from 'jsonwebtoken';
import { connectionMysql } from '../config/dbConnection';
import { UserEntity } from '../entity/User.entity';

export type TokenUser = {
	id_user: string
	nama: string
	username: string
} | string;
class CreateCredentialJWT {
	constructor(private readonly id_user: string | number) { }

	async generateToken(): Promise<string | TokenUser | null> {
		const checkUser = await connectionMysql.raw<UserEntity<string[]>>('SELECT * FROM user WHERE id_user = ? LIMIT 1', [this.id_user]).then(res => res[0]);

		if (checkUser) {
			const token: TokenUser = jwt.sign({
				id_user: checkUser.id_user,
				nama: checkUser.nama,
				username: checkUser.username
			}, configuration.APP_SECRET_KEY, { expiresIn: '7d' });
			return token;
		} else {
			return null;
		}
	}
}

export default CreateCredentialJWT;
