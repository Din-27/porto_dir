const response = require("../../config/res/res");
const { queryDB, dumpError, decodedToken } = require("../../config/conn/tabel");
const { tampilkanSemuaListBarangCustomer, tampilkanSemuaListBarang, tampilkanSemuaListBarangBatalKirim } = require("../utils/query");
const { orderKain, orderKatalog, verifikasiKodeVerifikasi, kirim } = require("../utils");


exports.verifikasi_nomor_penjualan = async (req, res) => {
    try {
        const { jenis_order } = req.body;
        if (jenis_order === "Kain") {
            orderKain({ req, res });
        } else {
            orderKatalog({ req, res });
        }
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok(
            { status: "GAGAL", pesan: `Terjadi Kesalahan!. Error : ${e.message}` },
            200,
            res
        );
    }
};
// const checkHasBeenScan = await queryDB(query.tampilkanSemuaListBarangCustomer)

exports.verifikasi_kode_verifikasi = async (req, res) => {
    try {

        verifikasiKodeVerifikasi({ req, res });
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok(
            { status: "GAGAL", pesan: `Terjadi Kesalahan!. Error : ${e.message}` },
            200,
            res
        );
    }
};

exports.list_customer_untuk_diverifikasi = async (req, res) => {
    try {
        const { no_penjualan, kode_verifikasi } = req.body;
        console.log(req.body)
        const getData = await queryDB(`
        SELECT ro.no_penjualan as no_order, c.nama AS nama_customer FROM relasi_orderdanpenjualan ro 
        JOIN order_pembelian op USING(no_order) JOIN customer c USING(id_customer)
        JOIN kode_verifikasipenjualan kv ON(ro.no_penjualan=kv.no_penjualan)
        WHERE no_order not in (select no_order from order_sudahdikirim) and RIGHT(ro.no_penjualan, 3)=? AND kv.kode_Verifikasi=?
        union
        SELECT kv.no_penjualan,nama FROM kode_verifikasipenjualan kv JOIN s_penjualan_katalog pks 
        USING(no_penjualan)  JOIN customer c USING(id_customer) WHERE no_penjualan NOT IN (SELECT no_order FROM order_sudahdikirim) 
        AND  SUBSTR(kv.no_penjualan,LENGTH(kv.no_penjualan)-2,3)=? AND kode_verifikasi=? AND kv.status=0`, [no_penjualan, kode_verifikasi, no_penjualan, kode_verifikasi]);
        // AND kv.kode_Verifikasi=?
        return response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
}

exports.get_list_data_customer = async (req, res) => {
    try {
        let data
        const { no_order } = req.params;
        if (no_order.slice(0, 2) === 'KT') {
            data = await queryDB(`
            SELECT dp.no_penjualan AS no_order,dp.id_balpenjualan AS notransaksi,
            SUM(dpc.status) AS jml_potong,0.00 AS berat,'DIBAL' AS sts, 
            IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, '-' AS lokasi
            FROM a_master_packingkatalog dp                                                                                                                                                                                     
            JOIN a_packing_katalog dpc ON dpc.no_packing=dp.id_balpenjualan                                                                                                                                                    
            LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan                                                                                                                                               
            WHERE dp.no_penjualan=?`, [no_order])
        } else {
            data = await queryDB(tampilkanSemuaListBarangCustomer, [
                no_order,
                no_order,
                no_order,
            ]);
        }

        return response.ok({
            status: "SUKSES", pesan: data.rows.map(x => {
                return {
                    no_order: x.no_order,
                    notransaksi: x.notransaksi,
                    berat: x.berat,
                    jml_potong: x.jml_potong,
                    sts: x.sts,
                    stsscan: x.stsscan,
                    label: x.sts !== 'ROLLAN' ? `${x.sts} - JUMLAH POTONG: ${x.jml_potong}` : `${x.jenis_kain} - ${x.warna}`,
                    no_lokasi: x.lokasi
                }
            })
        }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.back_scan_customer = async (req, res) => {
    try {
        const { no_order } = req.params;
        const id_karyawan = decodedToken(req).id
        let getData
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
        const check = getData.rows.filter(x => x.stsscan !== 'Sudah di scan')
        const props = { no_order, id_karyawan, dataScan: getData }
        if (check.length === 0) {
            await kirim(props)
            return response.ok({ status: "SUKSES", pesan: 'scan terselesaikan' }, 200, res);
        }
        return response.ok({ status: "SUKSES", pesan: 'sukses' }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

