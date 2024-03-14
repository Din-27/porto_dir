import { IsString } from 'class-validator';

export class MasterCabangDto {
	@IsString()
		barcode_hasil_sisa_potong: string;

	@IsString()
		kapasitas_gudang: string;

	@IsString()
		jml_tim_percabang: string;

	@IsString()
		jml_operator_pertim: string;

	@IsString()
		jml_timbangan: string;

	@IsString()
		nama: string;

	@IsString()
		shift: string;

	@IsString()
		jml_tim_cabang: string;

	@IsString()
		jml_operator_tim: string;

	@IsString()
		jml_operator_tidak_masuk: string;

	@IsString()
		jml_timbangan_rusak: string;
};
