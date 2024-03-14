import { MasterPusatDto } from './MasterPusat.dto';
import { MasterCabangDto } from './MasterCabang.dto';
import { connectionMysql } from '../../../../config/dbConnection';
import DecodedCredentialJWT from '../../../../services/DecodedCredentialJWT';
import { HistoryAdjustEntity } from '../../../../entity/HistoryAdjust.entity';
import KonstantaRepository from '../../../../repositories/Konstanta.repository';
import HistoryAdjustRepository from '../../../../repositories/HistoryAdjust.repository';
import { HistoryPermissionEntity } from '../../../../entity/HistoryPermission.entity';
import { Exception, ExpressType, TRequestFunction } from '@knittotextile/knitto-core-backend';
import { FormulaNilaiKapasitasCabangPerhariAdjust, FormulaNilaiKapasitasCabangPerhariDefault, Hitung } from '../../../../libs/helpers/formulaAdjust';
import HistoryPermissionRepository from '../../../../repositories/HistoryPermission.repository';
import { ExportToExcelWithLowMemory, FolderExportExcel } from '../../../../libs/helpers/excelHandler';

const GetHistoryEditMasterCabangController: ExpressType.Response = async (req: ExpressType.Request, res: ExpressType.Response) => {
	try {
		let excel: string;
		let result: HistoryPermissionEntity<string>;
		const { search, download } = req.query;
		const historyRepo = new HistoryPermissionRepository(connectionMysql);
		if (!search) {
			result = await historyRepo.getAll();
		} else {
			result = await historyRepo.getById(search as string);
		}
		if (result.length > 0 && download) {
			const sheet1 = result.map((item) => {
				return {
					'Tanggal Edit': item.tanggal,
					'Konstanta': item.jenis,
					'Nilai Konstanta': item.after,
					'User': item.nama
				};
			});
			excel = await ExportToExcelWithLowMemory({
				datafile: sheet1,
				filename: 'History Edit Master Cabang'
			});
			return res.redirect(process.env.MYURL + excel);
		}
		return res.status(200).send({ message: 'sukses', result, excel });
	} catch (error) {
		console.log(error);
		return res.status(200).send({ message: 'Error service', result: String(error) });
	}
};

const GetMasterCabangController: TRequestFunction = async () => {
	try {
		const konstantaRepo = new KonstantaRepository(connectionMysql);
		const result = await konstantaRepo.getAll();
		return { message: 'sukses', result };
	} catch (error) {
		throw new Exception.InvalidParameterException(String(error));
	}
};

const SaveMasterCabangController: TRequestFunction = async (req: ExpressType.Request) => {
	try {
		const { nama } = req.body as MasterCabangDto;
		const UserDecode = JSON.parse(DecodedCredentialJWT(req));
		const idUser = UserDecode.id_user;
		await connectionMysql.transaction(async (conn) => {
			const KonstantaRepo = new KonstantaRepository(conn);
			const HistoryAdjustRepo = new HistoryAdjustRepository(conn);
			const historyRepo = new HistoryPermissionRepository(conn);
			const checkTimbangan = await KonstantaRepo.getById('JML TIMBANGAN');
			if (checkTimbangan && checkTimbangan.data !== req.body.jml_timbangan) {
				req.body.kapasitas_potong_default = FormulaNilaiKapasitasCabangPerhariDefault(req.body as Hitung);
			}
			for (const item of Object.keys(req.body as any[])) {
				const data = req.body[item];
				const jenis = item.replace(/_/gm, ' ').toUpperCase();
				if (jenis !== 'NAMA' && data !== '') {
					const checkData = await KonstantaRepo.getById(jenis);
					await historyRepo.insert({
						jenis: checkData.jenis,
						before: checkData.data,
						after: data,
						id_user: idUser,
						nama
					});
					if (!checkData) {
						await KonstantaRepo.insert({ jenis, data });
					} else {
						await KonstantaRepo.update({ jenis, data });
					}
				}
			}
			if (req.body.shift || req.body.jml_operator_tidak_masuk || req.body.jml_timbangan_rusak) {
				const getData: any = await KonstantaRepo.getAll();
				const getValue = (param: any) => getData.filter((x: { jenis: any }) => x.jenis === param.replace(/_/gm, ' ').toUpperCase())[0].data;
				const data = req.body;

				await HistoryAdjustRepo.insert({
					kapasitas_potong_default: data?.kapasitas_potong_default || getValue('kapasitas_potong_default'),
					kapasitas_potong_adjust: data?.kapasitas_potong_adjust || getValue('kapasitas_potong_adjust'),
					shift: data?.shift || getValue('shift'),
					jml_tim_cabang: data.jml_tim_cabang,
					jml_operator_tim: data.jml_operator_tim,
					jml_operator_tidak_masuk: data?.jml_operator_tidak_masuk || getValue('jml_operator_tidak_masuk'),
					jml_timbangan: data.jml_timbangan,
					jml_timbangan_rusak: data?.jml_timbangan_rusak || getValue('jml_timbangan_rusak')
				});
			}
		});
		return { message: 'sukses', result: 'Save has been success' };
	} catch (error) {
		console.log(error);
		throw new Exception.InvalidParameterException(String(error));
	}
};

const SaveMasterPusatInCabangController: TRequestFunction = async (req: ExpressType.Request) => {
	const { nama } = req.body;
	try {
		const UserDecode = JSON.parse(DecodedCredentialJWT(req));
		const idUser = UserDecode.id_user;
		await connectionMysql.transaction(async (conn) => {
			const KonstantaRepo = new KonstantaRepository(conn);
			const HistoryMasterPusatRepo = new HistoryPermissionRepository(conn);
			for (const item of Object.keys(req.body as MasterPusatDto)) {
				const data = req.body[item];
				const jenis = item.replace(/_/gm, ' ').toUpperCase();
				if (jenis !== 'NAMA' && data !== '') {
					const checkData = await KonstantaRepo.getById(jenis);
					await HistoryMasterPusatRepo.insert({
						jenis: checkData.jenis,
						before: checkData.data,
						after: data,
						id_user: idUser,
						status: 'true',
						nama
					});
					if (!checkData) {
						await KonstantaRepo.insert({ jenis, data });
					} else {
						await KonstantaRepo.update({ jenis, data });
					}
				}
			}
		});
		return { message: 'sukses', result: 'Save has been success' };
	} catch (error) {
		console.log(error);
		throw new Exception.InvalidParameterException(String(error));
	}
};

const GetHistoryAdjustController: ExpressType.Response = async (req: ExpressType.Request, res: ExpressType.Response) => {
	try {
		let excel: string;
		let result: HistoryAdjustEntity<string>;
		const { search, download } = req.query;
		console.log(download, search);
		const historyRepo = new HistoryAdjustRepository(connectionMysql);
		if (!search) {
			result = await historyRepo.getAll();
		} else {
			result = await historyRepo.getById(search as string);
		}
		if (result.length > 0 && download) {
			const sheet1 = result.map((item) => {
				return {
					'Tanggal Adjust': item.created_at,
					'Kapasitas Potong Cabang Per Hari (default)': item.kapasitas_potong_default,
					'Kapasitas Potong Cabang Per Hari (adjust)': item.kapasitas_potong_adjust,
					'Shift': item.shift,
					'Jumlah Tim Per-Cabang': item.jml_tim_cabang,
					'Jumlah Operator Per-Tim': item.jml_operator_tim,
					'Jumlah Operator Tidak Masuk': item.jml_operator_tidak_masuk,
					'Jumlah Timbangan': item.jml_timbangan,
					'Jumlah Timbangan Rusak': item.jml_timbangan_rusak
				};
			});
			excel = await ExportToExcelWithLowMemory({
				datafile: sheet1,
				filename: 'History Adjust Master Cabang'
			});
			return res.download(FolderExportExcel + excel, (error: any) => {
				if (error) throw error;
				console.log('sukses');
			});
		}
		return res.status(200).send({ message: 'sukses', result, excel });
	} catch (error) {
		console.log(error);
		return res.status(500).send({ message: 'Error service', result: String(error) });
	}
};

const HitungController: TRequestFunction = async (req: ExpressType.Request) => {
	try {
		let value = FormulaNilaiKapasitasCabangPerhariDefault(req.body as Hitung);
		const { sesi } = req.params;
		if (sesi === 'adjust') {
			value = FormulaNilaiKapasitasCabangPerhariAdjust(req.body as Hitung);
		}
		return { message: 'sukses', result: value };
	} catch (error) {
		throw new Exception.InvalidParameterException(String(error));
	}
};

const DownloadFile = async (req: ExpressType.Request, res: ExpressType.Response) => {
	try {
		const { filename } = req.query;
		return res.download(FolderExportExcel + filename, (error: any) => {
			if (error) throw error;
			console.log('sukses');
		});
	} catch (error) {
		console.log(error);
		return res.status(200).send({ message: 'Error service', result: String(error) });
	}
};

export {
	GetHistoryEditMasterCabangController,
	SaveMasterPusatInCabangController,
	GetHistoryAdjustController,
	SaveMasterCabangController,
	GetMasterCabangController,
	HitungController,
	DownloadFile
};
