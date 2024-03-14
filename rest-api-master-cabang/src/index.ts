import { logger } from '@knittotextile/knitto-core-backend';
import httpServer from './app/http';
import listener from './app/listener';
import { connectionMysql } from './config/dbConnection';
// import { rabbitConnection } from './config/rabbitConnection';

async function startApp() {
	try {
		await httpServer();
		await connectionMysql.init();
		// await rabbitConnection.init();
		await listener();
	} catch (error) {
		logger.error(error);
		throw error;
	}
}

startApp();

export default startApp;
