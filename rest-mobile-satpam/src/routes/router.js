const router = require("express").Router();
const { auth } = require("../../auth/auth");
const { login } = require("../controllers/login_mobile_satpam");
const partial = require("../controllers/partial_mobile_satpam");
const customer = require("../controllers/customer_mobile_satpam");
const retur_kain = require("../controllers/retur_kain_mobile_satpam");
const pengeluaran_po = require("../controllers/konfirmasi_pengeluaraan_po");
const history_barang_keluar = require("../controllers/history_barang_keluaran");
const pembatalan_kirim = require("../controllers/pembatalan_kirim_mobile_satpam");
const pengeluaran_bs_segel = require("../controllers/konfirmasi_pengeluaran_bs_segel");
const pengeluaran_transfer_stok = require("../controllers/konfirmasi_pengeluaran_transfer_stok");
const pengeluaran_ekspedisi = require("../controllers/konfirmasi_pengeluaran_ekspedisi");
const kode_pengambilan = require("../controllers/histori_input_kode");
const scan_pengeluaran = require("../controllers/scanpengeluaransatpam");
const todocetak = require("../controllers/cetak");
const { dumpError, queryDB } = require("../../config/conn/tabel");
const response = require("../../config/res/res");
const { FetchNoRoll } = require("../controllers/validasi_faktur_asli");
const { default: rateLimit } = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 4000, // 15 minutes
  limit: 1, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers,
  message: {
    "status": 200,
    "values": {
      "status": "SUKSES",
      "pesan": "Data berhasil di muat"
    }
  }
})

//healthcheck
router.get("/", async (_req, res, _next) => {
  const healthcheck = {
    uptime: process.uptime(),
    responsetime: process.hrtime(),
    message: "OK",
    status: "Online",
    timestamp: Date.now(),
  };
  try {
    res.status(200).send(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    healthcheck.status = "Offline";
    res.status(200).send(healthcheck);
  }
});

router.get("/kode_cabang", async (req, res) => {
  try {
    const data = await queryDB(`select kode_roll, kode_order from data_cabang`);
    return response.ok(data.rows, 200, res);
  } catch (e) {
    dumpError(e);
    console.error(e);
    return response.ok({ status: "GAGAL", pesan: `Terjadi Kesalahan!. Error : ${e.message}` }, 200, res);
  }
});

router.post("/login", login);
router.get("/check_muat/:no_mobil", auth, pengeluaran_ekspedisi.check_muat);
router.post("/selesai_muat", [auth, limiter], pengeluaran_ekspedisi.selesai_muat);
router.get("/get-no-kendaraan", pengeluaran_ekspedisi.get_no_kendaraan);
router.get("/get-ekspedisi-register", pengeluaran_ekspedisi.get_ekspedisi);
router.get("/tampilkan-semua/:no_order", pengeluaran_ekspedisi.tampilkan_semua);
router.get("/ambil-dari-data-lama", pengeluaran_ekspedisi.ambil_dari_data_lama);
router.post("/ambil-dari-data-lama-action", pengeluaran_ekspedisi.ambil_dari_data_lama_action);

// scan satpam
router.post("/verifikasi-manual", auth, scan_pengeluaran.scanbarang);
router.post("/handleback-pengeluaran", auth, scan_pengeluaran.handleBack);

router.get("/data-per-ekspedisi", pengeluaran_ekspedisi.data_order_per_ekspedisi);
router.get("/get-data-order/:nama_ekspedisi", pengeluaran_ekspedisi.get_data_order);
router.get("/kendaraan-di-lokasi", pengeluaran_ekspedisi.kendaraan_di_lokasi);
router.post("/get-data-order-detail", pengeluaran_ekspedisi.get_data_order_byno_order);
router.delete("/delete-pengeluaran-muat", pengeluaran_ekspedisi.delete_pengeluaran_muat);
router.get("/get-no-kendaraan/:no_mobil", pengeluaran_ekspedisi.get_no_kendaraan_by_nomor);
router.get("/tampilkan-belum-di-scan/:no_order", pengeluaran_ekspedisi.tampilkan_belum_di_scan);
router.get("/get-data-sudah-scan/:no_kendaraan", pengeluaran_ekspedisi.check_scan_no_kendaraan);
router.delete("/delete-kendaraan/:no_kendaraan", pengeluaran_ekspedisi.delete_kendaraan_dilokasi);
router.get("/check-delete-kendaraan/:no_kendaraan", pengeluaran_ekspedisi.checkDeleteKendaraanDilokasi);
router.get("/get-ekspedisi-register/:nama_ekspedisi", pengeluaran_ekspedisi.get_angkutan_by_name);
router.get("/get-transaksi-muat/:no_mobil", pengeluaran_ekspedisi.get_transaksi_muat_by_nomor_mobil);
router.get("/data-per-ekspedisi/:ekspedisi", pengeluaran_ekspedisi.data_order_per_ekspedisi_by_ekspedisi);
router.post("/registrasi-pengeluaran-muat-order", auth, pengeluaran_ekspedisi.registrasi_kendaraan_masuk);
router.post("/verifikasi-data-order-perekspedisi", auth, pengeluaran_ekspedisi.verifikasi_data_order_per_ekspedisi);

router.get("/get-data-list-customer/:no_order", customer.get_list_data_customer);
// router.get("/list-customer-untuk-diverifikasi/:no_penjualan", customer.list_customer_untuk_diverifikasi);
router.post("/list-customer-untuk-diverifikasi", customer.list_customer_untuk_diverifikasi);


router.post("/get-data-order-no-penjualan", auth, customer.verifikasi_nomor_penjualan);
router.get("/get-data-order-verifikasi/:kode_verifikasi", auth, customer.verifikasi_kode_verifikasi);

router.post("/scan-retur", auth, retur_kain.scan_retur_kain);
router.get("/master-retur-kain", retur_kain.list_return_kain);
router.get("/get-partial", partial.pengeluaran_muat_order_partial);
router.get("/get-data-list-partial/:no_order", partial.get_list_data_partial);
router.get("/handle-plus-muat-order/:no_order", partial.handlePlusMuatOrder);
router.get("/detail-retur-kain/:no_retur", retur_kain.list_return_kain_by_nomor);
router.get("/selesai-retur-kain/:no_retur", retur_kain.selesai_scan_retur);

router.post("/scan-bs-segel", auth, pengeluaran_bs_segel.handle_scan_bs_segel);
router.get("/get-data-pengeluaran", pengeluaran_bs_segel.get_data_pengeluaran);
router.post("/batal-scan-bs-segel", auth, pengeluaran_bs_segel.handle_scan_bs_segel_batal);
router.get("/get-list-data-pengeluaran", pengeluaran_bs_segel.get_list_pengeluaran_bs_segel);
router.get("/get-data-pengeluaran/:no_pengeluaran", pengeluaran_bs_segel.get_data_pengeluaran_detail);
router.get("/get-list-data-pengeluaran/:no_pengeluaran", pengeluaran_bs_segel.get_detail_list_pengeluaran_bs_segel);

router.post("/selesai_pengeluaran_stok", auth, pengeluaran_transfer_stok.handleSelesaiStok);
router.post("/verifikasi_manual_stok", auth, pengeluaran_transfer_stok.verifikasi_kode_manual_stok);
router.post("/verifikasi_manual_stok_v3", auth, pengeluaran_transfer_stok.verifikasi_kode_manual_stok_v3);
router.get("/get-list-pengeluaran-stok", pengeluaran_transfer_stok.get_list_pengeluaran_transfer_stok);
router.get("/get-data-hasil-scan", pengeluaran_transfer_stok.get_list_pengeluaran_transfer_stok_hasil_scan);
router.get("/get-data-hasil-scan-v3", pengeluaran_transfer_stok.get_list_pengeluaran_transfer_stok_hasil_scan_v3);
router.get("/rincian_pengeluaran_stok/:no_pengeluaran", pengeluaran_transfer_stok.rincian_pengeluaran_transfer_stok);
router.get("/rincian_pengeluaran_stok_v3/:no_pengeluaran", pengeluaran_transfer_stok.rincian_pengeluaran_transfer_stok_v3);
router.get("/check_pengeluaran_stok/:no_pengeluaran", pengeluaran_transfer_stok.checkSelesaiStok);
router.get("/get-data-hasil-scan/:no_transfer", pengeluaran_transfer_stok.get_list_pengeluaran_transfer_stok_hasil_scan_rincian);

// router.get('/get_data_list_po', get_data_list_po_khusus)
router.post("/verifikasi-manual1", auth, pengeluaran_ekspedisi.verifikasi_manual)
router.post("/scan-po", auth, pengeluaran_po.verifikasi_barang_pengeluaran_po);
router.get("/get_data_list_po/:no_pengeluaran", auth, pengeluaran_po.get_data_list_po_by_no_pengeluaraan_v2);

router.post("/scan-batal-kirim", auth, pembatalan_kirim.scan_batal_kirim);
router.get("/data-list-pembatalan-muat", pembatalan_kirim.list_pembatalan_muat);
router.get("/data-list-pembatalan-muat/:no_muat", pembatalan_kirim.detail_pembatalan_muat);
router.get("/search-data-list-pembatalan-muat/:search", pembatalan_kirim.search_list_pembatalan_muat);
router.get("/data-list-pembatalan-muat-order/:no_order", pembatalan_kirim.detail_pembatalan_muat_order);

//
router.post("/nama_satpam", history_barang_keluar.get_nama_satpam);
router.post("/history_pengeluaran_barang", history_barang_keluar.history_barang_keluar);
router.post("/get-no-pengeluaran", history_barang_keluar.get_data_cetak_pengeluaran_barang);
router.get("/semua-histori-kode-pengambilan", kode_pengambilan.semua_histori_kode_pengambilan);
router.get("/semua-histori-kode-pengambilan1", kode_pengambilan.semua_histori_kode_pengambilan1);
router.post("/cetak_history_pengeluaran_barang", history_barang_keluar.cetak_pengeluaran_barang);
router.post("/cetak_ulang_history_pengeluaran_barang", history_barang_keluar.cetak_ulang_pengeluaran_barang);

//
// router.get("/test", auth);
router.get('/back-scan-customer/:no_order', auth, customer.back_scan_customer)

router.post('/mobileapp/cetak/cetaksj', auth, todocetak.cetak_sj)

router.get('/noroll/:no_order', FetchNoRoll)

module.exports = router;
