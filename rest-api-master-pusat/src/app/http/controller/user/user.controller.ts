import { Exception, ExpressType, TRequestFunction } from '@knittotextile/knitto-core-backend';
import UserRepository from '../../../../repositories/User.repository';
import { connectionMysql } from '../../../../config/dbConnection';
import { UserDto } from './user.dto';
import { UserEntity } from '../../../../entity/User.entity';
import CreateCredentialJWT from '../../../../services/CreateCredentialJWT';
import DecodedCredentialJWT from '../../../../services/DecodedCredentialJWT';

const LoginController: TRequestFunction = async (req: ExpressType.Request) => {
	const { username, password } = req.body as UserDto;
	if (username === undefined || password === undefined) throw new Exception.InvalidParameterException('Method tidak sesuai');

	const checkUser: UserEntity<string> = await connectionMysql.raw('SELECT * FROM user WHERE username = ? and password=md5(?) LIMIT 1', [username, password])
		.then(res => res[0]);
	if (checkUser) {
		try {
			const token = await new CreateCredentialJWT(checkUser.id_user).generateToken();
			return {
				result: {
					user: {
						id_user: checkUser.id_user,
						username: checkUser.username,
						nama: checkUser.nama,
						input: checkUser.level === 'IMPLEMENTOR' ? 'enable' : 'disable'
					},
					token
				}
			};
		} catch (error) {
			console.log(error);
			throw new Exception.NotAuthorizationException('User not authorized');
		}
	} else {
		throw new Exception.NotFoundException('User not found');
	}
};

const checkAccessUserController: TRequestFunction = async (req: ExpressType.Request) => {
	try {
		const UserDecode = JSON.parse(DecodedCredentialJWT(req));
		const idUser = UserDecode.id_user as number;
		const UserRepo = new UserRepository(connectionMysql);

		const check = await UserRepo.getBy({ idUser });
		if (check.level !== 'IMPLEMENTOR') {
			return {
				message: 'sukses',
				result: 'disable'
			};
		}

		return {
			message: 'sukses',
			result: 'enable'
		};
	} catch (error) {
		throw new Exception.NotAuthorizationException('User not authorized');
	}
};

export { LoginController, checkAccessUserController };
