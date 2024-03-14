import { rabbitSubscribers } from '@knittotextile/knitto-core-backend';
import configuration from '../../../config';
const queueName = 'backendLogs';

const listenLogs = rabbitSubscribers();

listenLogs.add({
	exchangeName: configuration.RABBITMQ_EXCHANGE,
	queue: queueName,
	routingKey: 'user.created',
	prefetch: 1
}, async (msg) => {
	console.log(msg.data);
});

export default listenLogs;
