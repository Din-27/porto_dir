export interface EventMessageData {
	id: number // ?: epoch number
	eventName: string
	data: any
};

export type OptionalType<T extends string | number | symbol> = Record<T, any>;
