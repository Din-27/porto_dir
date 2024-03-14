const { auth } = require("../auth/auth");
const { uploadFile, uploadFilePiket } = require("../conn/tabel");
const router = require("express").Router();
const { handleInsertExcelData, getExcelData, getHistoryData, handleEksportExcelData, checkWarna } = require("../service/master_data_sku");
const { login } = require("../service/login");
const { handleButtonTambahListOpsiTransferStok, getTahap, getNomorTahap, getHistory, handleDeleteListtransferStok, getList, updateStatusUser } = require("../service/opsi_transfer_stok");
const { importFile, getExcelDataPiket, handleEksportExcelDataPiket, getHistoryDataPiket } = require("../service/master_data_piket");
const { handleSimpanNomorTahapPadaArea, nonaktifkanArea, displayHistoryPemasangan, getNomorArea, getNomorTahapPemasangan } = require("../service/pemasangan_kain_sortir_tahap");

router.post('/login', login)

/**
 * MASTER DATA SKU
 */
router.post('/import_master', [auth, uploadFile('excel')], handleInsertExcelData)
router.get('/get_import_master', getExcelData)
router.get('/get_history_import_master', getHistoryData)
router.get('/ekspor_master', handleEksportExcelData)
// router.get('/auth_ganti_cabang', auth, handleDecodedToken)
router.post('/warna', uploadFile('excel'), checkWarna)

/**
 * OPSI_TRANSFER STOK
 */

router.get('/opsitfstok/tahap', getTahap)
router.get('/opsitfstok/nomortahap/:tahap', getNomorTahap)
router.post('/opsitfstok/tambah_list_opsi', auth, handleButtonTambahListOpsiTransferStok)
router.get('/opsitfstok/history', auth, getHistory)
router.delete('/opsitfstok/delete_list', auth, handleDeleteListtransferStok)
router.get('/opsitfstok/lists', auth, getList)
router.patch('/opsitfstok/update_sts_user', auth, updateStatusUser)

/**
 * MASTER DATA PIKET
 */
router.post('/import_master_piket', [auth, uploadFilePiket('excel_piket')], importFile)
router.get('/get_import_master_piket', getExcelDataPiket)
router.get('/ekspor_master_piket', handleEksportExcelDataPiket)
router.get('/get_history_import_master_piket', getHistoryDataPiket)

/**
 * PEMASANGAN KAIN SORTIR TAHAP
 */
router.get('/get-history-pemasangan', displayHistoryPemasangan)
router.post('/simpan', auth, handleSimpanNomorTahapPadaArea)
router.get('/get-noarea-pemasangan', auth, getNomorArea)

module.exports = router;