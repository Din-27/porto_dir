import { logger } from '@knittotextile/knitto-core-backend';
import { rabbitConnection } from '../../config/rabbitConnection';
import path from 'path';

async function listener() {
	try {
		await rabbitConnection.subscribe(path.join(__dirname, './listen'));
	} catch (err) {
		logger.error({ err });
		throw err;
	}
}

export default listener;
