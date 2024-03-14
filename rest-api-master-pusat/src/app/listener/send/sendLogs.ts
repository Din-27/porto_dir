import configuration from '../../../config';
import { EventMessageData } from '../../../types/listenerQueue';
import { rabbitConnection } from '../../../config/rabbitConnection';
import { logger } from '@knittotextile/knitto-core-backend';

async function sendLogs(message: EventMessageData) {
	try {
		await rabbitConnection.publishMessage(message, { exchangeName: configuration.RABBITMQ_EXCHANGE, routingKey: message.eventName });
	} catch (err) {
		logger.error(err);
		throw err;
	}
}

export default sendLogs;
