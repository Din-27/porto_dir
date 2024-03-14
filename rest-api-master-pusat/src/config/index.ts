import dotenv from 'dotenv';

dotenv.config();

const configuration = {
	APP_NAME: process.env.APP_NAME,
	NODE_ENV: process.env.NODE_ENV ?? 'development',
	APP_PORT_HTTP: process.env.APP_PORT_HTTP,
	DB_HOST_MYSQL: process.env.DB_HOST_MYSQL,
	DB_NAME_MYSQL: process.env.DB_NAME_MYSQL,
	DB_USER_MYSQL: process.env.DB_USER_MYSQL,
	DB_PORT_MYSQL: process.env.DB_PORT_MYSQL,
	DB_PASS_MYSQL: process.env.DB_PASS_MYSQL,
	APP_SECRET_KEY: process.env.APP_SECRET_KEY || 'secret',
	RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
	RABBITMQ_EXCHANGE: process.env.RABBITMQ_EXCHANGE || 'noExchange'
};

export default configuration;
