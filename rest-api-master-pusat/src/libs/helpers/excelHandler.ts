import path from 'path';
import ExcelJS from 'exceljs';
import { KapitalisasiKata } from './capitalWords';

export const FolderExportExcel = path.join(__dirname.replace('\\src\\libs\\helpers', '') + '/storage/excel/');

type Props = Record<string, any>;
const Processor = (date: any) => ('0' + date).slice(-2);

const ExportToExcelWithLowMemory = async (props: Props): Promise<string> => {
	const { datafile, filename } = props;
	const tanggal = new Date();
	const tahun = Processor(tanggal.getFullYear());
	const bulan = Processor(tanggal.getMonth() + 1);
	const hari = Processor(tanggal.getDate());
	const jam = Processor(tanggal.getHours());
	const menit = Processor(tanggal.getMinutes());
	const detik = Processor(tanggal.getSeconds());
	const tgl = `${hari}${bulan}${tahun}_${jam}${menit}${detik}`;
	const namaexcel = filename + ' ' + tgl + '.XLSX';
	const folderexcel = FolderExportExcel;

	const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
		filename: folderexcel + namaexcel,
		useStyles: true,
		useSharedStrings: true
	});
	const worksheet = workbook.addWorksheet(filename as string);

	const aa = Object.keys(datafile[0] as object);

	const judul = [];
	for (let k = 0; k < aa.length; k++) {
		const bb = KapitalisasiKata(aa[k]);
		judul.push({ header: bb, key: aa[k], width: 20 });
	}
	worksheet.columns = judul;
	let count = 0;
	for (const item of datafile) {
		count += 1;
		if (count % 10000 === 0 || count === datafile.length - 1) {
			console.log('add cell value ', filename, count, datafile.length);
			const memoryUsage = process.memoryUsage();
			console.log(`Heap Used: ${memoryUsage.heapUsed / 1024 / 1024} MB ||  ${memoryUsage.heapTotal / 1024 / 1024} MB`);
		}

		worksheet.addRow(item).commit();
	};

	await workbook.commit();
	return namaexcel;
};

export { ExportToExcelWithLowMemory };
