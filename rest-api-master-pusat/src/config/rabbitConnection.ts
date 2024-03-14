import { RabbitAdapter } from '@knittotextile/knitto-core-backend';
import configuration from '.';

export const rabbitConnection = new RabbitAdapter({
	connectionName: 'rabbit-connection',
	url: configuration.RABBITMQ_URL
});
