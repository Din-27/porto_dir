import { IsString } from 'class-validator';

export class MasterPusatDto {
	@IsString()
		periode_max_gabung_order: string;

	@IsString()
		kapasitas_max_meja_kain_siap_timbang: string;

	@IsString()
		min_jml_kain_dikerjakan_multi_user: string;

	@IsString()
		periode_max_gabung_retur: string;

	@IsString()
		faktur_sementara: string;

	@IsString()
		faktur_asli: string;

	@IsString()
		surat_jalan: string;
};
