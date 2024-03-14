const { ResponseErrorService, ResponseError } = require("../../helpers/Response");
const response = require("../../config/res/res");
const { queryDB } = require("../../config/conn/tabel");
const { tampilkanSemuaListBarang, tampilkanSemuaListBarangBatalKirim } = require("../utils/query");

const checkKodeVerifikasi = async (props) => {
    let result = 'sukses', dataArr = [], kode = []
    const { kode_verifikasi, nomor } = props
    if (!kode_verifikasi) {
        result = "Kode verifikasi harus diisi !"
    }
    const getDataNgebal = await queryDB(
        `select  kode_verifikasi from data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal where dp.no_ngebal=?`,
        [nomor]
    );
    // const checkRelasiOrderDanPenjualan = await queryDB(`SELECT no_order,kv.kode_verifikasi FROM relasi_orderdanpenjualan 
    // JOIN kode_verifikasipenjualan kv USING(no_penjualan)
    // JOIN data_ngebal dp USING(no_order)
    // WHERE dp.no_ngebal=?`, [nomor])
    const checkPacking = await queryDB(
        `select kode_verifikasi from data_packingkain dp JOIN detail_packingkain dpc
       ON dpc.no_packing=dp.no_packing where dp.no_packing=?`,
        [nomor]
    );
    const checkDataNgebal = await queryDB(
        `select kode_verifikasi from data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal where no_packing_roll=?`,
        [nomor]
    );
    const checkPerincianOrder = await queryDB(
        `SELECT pp.kode AS kode_verifikasi FROM perincian_order pr JOIN detail_order USING(no_Detail) 
    JOIN order_pembelian op USING(no_order) LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=pr.no_roll 
    LEFT JOIN perincian_penerimaanstok pp ON pp.no_roll=pr.no_roll
    WHERE pp.no_roll=? AND jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL`,
        [nomor]
    );
    dataArr = [getDataNgebal, checkPacking, checkDataNgebal, checkPerincianOrder]
    for (let i = 0; i < dataArr.length; i++) {
        kode.push(dataArr[i]?.rows[0]?.kode_verifikasi)
    }
    const filterKode = kode.filter(x => x !== undefined)
    console.log(`${kode_verifikasi}`, `${filterKode[0]}`)
    if (filterKode.length > 0) {
        if (parseFloat(kode_verifikasi) !== parseFloat(filterKode[0])) {
            console.log(parseFloat(kode_verifikasi) !== parseFloat(filterKode[0]))
            result = "kode verifikasi salah !"
        }
    }
    console.log(result)
    return result
}


exports.FetchNoRoll = async (req, res) => {
    try {
        let getData
        const { no_order } = req.params;
        // return console.log(req.params);
        if (no_order.slice(0, 2) === 'KT')
            getData = await queryDB(`SELECT dp.no_penjualan AS no_order,dp.id_balpenjualan AS notransaksi,
            SUM(dpc.status) AS jml_potong,0.00 AS berat,'DIBAL' AS jenis_packing, IF(tp.no_transaksi IS NULL,
            'Belum di Scan','Sudah di scan') AS stsscan, '-' as lokasi
            FROM a_master_packingkatalog dp
            JOIN a_packing_katalog dpc ON dpc.no_packing=dp.id_balpenjualan
            LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan
            WHERE dp.no_penjualan=?`, [no_order])
        else {
            getData = await queryDB(tampilkanSemuaListBarang, [
                no_order,
                no_order,
                no_order,
            ]);
            if (getData.rows.length === 0) {
                getData = await queryDB(tampilkanSemuaListBarangBatalKirim, [
                    no_order,
                    no_order,
                    no_order,
                ]);
            }
        }
        return response.ok(getData.rows.map(x => x.notransaksi), 200, res)
    } catch (error) {
        console.log(error);
        return ResponseErrorService(res)
    }
}

exports.ValidasiFakturAsli = async (req, res) => {
    try {
        const { no_penjualan, kode } = req.body

        if (kode) {
            if (!no_penjualan && !kode) {
                return ResponseError('No Penjualan dan Kode Verifikasi Kosong', res)
            }
            if (!no_penjualan) {
                return ResponseError('No Penjualan masih kosong', res)
            }
            if (!kode) {
                return ResponseError('Kode verifikasi masih kosong', res)
            }
            const checkKode = await queryDB(`SELECT * FROM kode_verifikasipenjualan 
            WHERE SUBSTR(no_penjualan, -3)=? AND kode_verifikasi=?`,
                [no_penjualan, kode])
            if (checkKode.rows.length === 0) {
                return ResponseError('No penjualan dan kode verifikasi tidak sesuai', res);
            }
        }

        const getNoOrder = await queryDB(`select * from relasi_orderdanpenjualan where no_penjualan=?`, [checkKode.rows[0].no_penjualan]);
        const checkFakturAsli = await queryDB(`select * from a_histori_cetakfakturasli where no_order=?`, [getNoOrder.rows[0].no_order])

        if (checkFakturAsli.rows.length === 0) {
            return ResponseError('Faktur asli tidak sesuai dengan data order')
        }
        return response.ok('SUKSES', 200, res)
    } catch (error) {
        console.log(error);
        return ResponseErrorService(res)
    }
}

exports.ValidasiNoRoll = async (req, res) => {
    try {
        const { nama_customer, no_order, ekspedisi, no_roll, kode } = req.body
        if (!no_roll) {
            return ResponseError('No Penjualan masih kosong', res)
        }
        if (kode) {
            if (!no_roll && !kode) {
                return ResponseError('No Penjualan dan Kode Verifikasi Kosong', res)
            }
            if (!kode) {
                return ResponseError('Kode verifikasi masih kosong', res)
            }
            const checkKode = await checkKodeVerifikasi({ nomor: no_roll, kode_verifikasi: kode })
            if (checkKode !== 'sukses') {
                return ResponseError('Kode verifikasi tidak sesuai', res)
            }
        }
        const data = await queryDB(`SELECT nama, no_roll, no_order,exspedisi FROM order_pembelian 
        JOIN customer USING(id_customer) 
        JOIN detail_order od USING(no_order) 
        JOIN perincian_order USING(no_detail)
        WHERE no_roll=? and no_order=? and ekspedisi=? and nama=? `,
            [no_roll, no_order, ekspedisi, nama_customer])
        if (data.rows.length === 0) {
            return ResponseError('No Roll tidak sesuai dengan Data Order yg dipilih', res)
        }
    } catch (error) {
        console.log(error);
        return ResponseErrorService(res)
    }
}