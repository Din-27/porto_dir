import { OptionalType } from '../types/listenerQueue';

interface History<T> {
	jenis: T
	before: T
	after: T
	id_user: number
	nama?: T
	status?: T
}

export type HistoryPermissionEntity<T extends string | number | symbol> = History<T> & OptionalType<T>;
