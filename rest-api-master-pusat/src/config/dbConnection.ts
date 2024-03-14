import { MySqlConnector } from '@knittotextile/knitto-core-backend';
import configuration from '.';

export const connectionMysql = new MySqlConnector({
	host: configuration.DB_HOST_MYSQL,
	database: configuration.DB_NAME_MYSQL,
	port: Number(configuration.DB_PORT_MYSQL),
	user: configuration.DB_USER_MYSQL,
	password: configuration.DB_PASS_MYSQL
});
