const day = new Date(Date.now()).getDay();
const waktuPotongKainPer1Timbang = 1.9;
const jmlJamOperToko = day === 6 ? 6 : 8;

export interface Hitung {
	kapasitas_potong_default: string
	jml_operator_tidak_masuk: string
	jml_timbangan_rusak: string
	jml_operator_pertim: string
	jml_tim_cabang: string
	jml_timbangan: string
}

export const FormulaNilaiKapasitasCabangPerhariAdjust = (data: Hitung) => {
	let kpsPotongCabangPerhariAdjust: number = 0;
	let vPengurangKpsPotongOperator: number = 0;
	let vPengurangKpsPotongTimbangan: number = 0;
	const kapasitasCabangPotongDefault = Number(data.kapasitas_potong_default);
	const jmlOperatorTakMasuk = Number(data.jml_operator_tidak_masuk);
	const jmlTimbanganRusak = Number(data.jml_timbangan_rusak);

	if (jmlOperatorTakMasuk !== 0) {
		console.log(1);
		vPengurangKpsPotongOperator = Math.round(kapasitasCabangPotongDefault / Number(data.jml_tim_cabang) * (jmlOperatorTakMasuk / Number(data.jml_operator_pertim)));
	} else if (jmlTimbanganRusak !== 0) {
		console.log(2);
		vPengurangKpsPotongTimbangan = Math.round((jmlJamOperToko * 60 / waktuPotongKainPer1Timbang) * jmlTimbanganRusak);
	}
	kpsPotongCabangPerhariAdjust = kapasitasCabangPotongDefault - vPengurangKpsPotongTimbangan;

	if (jmlOperatorTakMasuk !== 0 && jmlTimbanganRusak !== 0) {
		console.log(3);
		kpsPotongCabangPerhariAdjust = vPengurangKpsPotongOperator + vPengurangKpsPotongTimbangan;
	}
	return kpsPotongCabangPerhariAdjust;
};

export const FormulaNilaiKapasitasCabangPerhariDefault = (data: Hitung) => {
	const jmlTimbanganPercabang = Number(data.jml_timbangan);
	return Math.round((jmlJamOperToko * 60 / waktuPotongKainPer1Timbang) * jmlTimbanganPercabang);
};
