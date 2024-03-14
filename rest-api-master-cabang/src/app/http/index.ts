import { ExpressServer } from '@knittotextile/knitto-core-backend';
import path from 'path';
import configuration from '../../config';

async function httpServer() {
	try {
		const server = new ExpressServer({
			routerPath: path.join(__dirname, '/routes'),
			port: configuration.APP_PORT_HTTP
		});

		await server.start();
	} catch (error) {
		console.error(error);
	}
}

export default httpServer;
