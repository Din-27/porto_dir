import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config({path:'./../.env'});

// Update with your config settings.

const config: Record<string, Knex.Config> = {
	development: {
		client: 'mysql2',
		connection: {
			host: process.env.DB_HOST_MYSQL,
			port: Number(process.env.DB_PORT_MYSQL),
			user: process.env.DB_USER_MYSQL,
			password: process.env.DB_PASS_MYSQL,
			database: process.env.DB_NAME_MYSQL
		},
		migrations: {
			tableName: 'migrations'
		}
	},

	staging: {
		client: 'mysql2',
		connection: {
			host: process.env.DB_HOST_MYSQL,
			port: Number(process.env.DB_PORT_MYSQL),
			user: process.env.DB_USER_MYSQL,
			password: process.env.DB_PASS_MYSQL,
			database: process.env.DB_NAME_MYSQL
		},
		pool: {
			min: 2,
			max: 10
		},
		migrations: {
			tableName: 'migrations'
		}
	},

	production: {
		client: 'mysql2',
		connection: {
			host: process.env.DB_HOST_MYSQL,
			port: Number(process.env.DB_PORT_MYSQL),
			user: process.env.DB_USER_MYSQL,
			password: process.env.DB_PASS_MYSQL,
			database: process.env.DB_NAME_MYSQL
		},
		pool: {
			min: 2,
			max: 10
		},
		migrations: {
			tableName: 'migrations'
		}
	}

};

module.exports = config;
