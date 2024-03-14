import { MasterPusatDto } from './MasterPusat.dto';
import { API } from '../../../../libs/helpers/axiosHandler';
import { connectionMysql } from '../../../../config/dbConnection';
import DecodedCredentialJWT from '../../../../services/DecodedCredentialJWT';
import KonstantaRepository from '../../../../repositories/Konstanta.repository';
import { HistoryPermissionEntity } from '../../../../entity/HistoryPermission.entity';
import { Exception, ExpressType, TRequestFunction } from '@knittotextile/knitto-core-backend';
import HistoryPermissionRepository from '../../../../repositories/HistoryPermission.repository';
import { ExportToExcelWithLowMemory, FolderExportExcel } from '../../../../libs/helpers/excelHandler.js';

const GetHistoryEditMasterPusatController = async (req: ExpressType.Request, res: ExpressType.Response) => {
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
			const sheet1 = result.map((item: any) => {
				return {
					'Tanggal Edit': item.tanggal,
					'Konstanta': item.jenis,
					'Nilai Konstanta': item.after,
					'User': item.nama
				};
			});
			excel = await ExportToExcelWithLowMemory({
				datafile: sheet1,
				filename: 'History Edit Master Pusat'
			});
			return res.download(FolderExportExcel + excel, (error: any) => {
				if (error) throw error;
				console.log('sukses');
			});
		}
		return res.status(200).send({ message: 'sukses', result });
	} catch (error) {
		console.log(error);
		return res.status(200).send({ message: 'Error service', result: String(error) });
	}
};

const GetMasterPusatController: TRequestFunction = async () => {
	try {
		const konstantaRepo = new KonstantaRepository(connectionMysql);
		const result = await konstantaRepo.getAll();
		return { message: 'sukses', result };
	} catch (error) {
		throw new Exception.InvalidParameterException(String(error));
	}
};

const SaveMasterPusatController: TRequestFunction = async (req: ExpressType.Request) => {
	try {
		const { nama } = req.body;
		const UserDecode = JSON.parse(DecodedCredentialJWT(req));
		const idUser = UserDecode.id_user;
		await connectionMysql.transaction(async (conn) => {
			const KonstantaRepo = new KonstantaRepository(conn);
			const HistoryMasterPusatRepo = new HistoryPermissionRepository(conn);
			for (const item of Object.keys(req.body as MasterPusatDto)) {
				const data = req.body[item];
				const jenis = item.replace(/_/gm, ' ').toUpperCase();
				const checkData = await KonstantaRepo.getById(jenis);
				if (jenis !== 'NAMA' && data !== '') {
					await HistoryMasterPusatRepo.insert({
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
			await API({ url: '/pusat/save', body: req.body });
		});
		return { message: 'sukses', result: 'Save has been success' };
	} catch (error) {
		console.log(error);
		throw new Exception.InvalidParameterException(String(error));
	}
};

export { GetHistoryEditMasterPusatController, GetMasterPusatController, SaveMasterPusatController };
