import { OptionalType } from '../types/listenerQueue';

interface History<T> {
	kapasitas_potong_default: T
	kapasitas_potong_adjust: T
	shift?: T
	jml_tim_cabang?: T
	jml_operator_tim?: T
	jml_operator_tidak_masuk: T
	jml_timbangan: T
	jml_timbangan_rusak: T
}

export type HistoryAdjustEntity<T extends string | number | symbol> = History<T> & OptionalType<T>;
