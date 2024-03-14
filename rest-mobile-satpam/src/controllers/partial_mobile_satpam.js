const { dataPartial, tampilkanSemuaListBarang, tampilkanBelumScanBarang, tampilkanSemuaListBarangBatalKirim } = require("../utils/query");
const response = require("../../config/res/res");
const { queryDB, dumpError, GetError, decodedToken } = require("../../config/conn/tabel");
const { cetakSJ } = require("./cetak");

exports.pengeluaran_muat_order_partial = async (req, res) => {
    try {
        console.log(req.body)
        const getPartial = await queryDB(dataPartial);
        return response.ok({ status: "SUKSES", pesan: getPartial.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.get_list_data_partial = async (req, res) => {
    try {
        let data
        const { no_order } = req.params;
        if (no_order.slice(0, 2) === 'KT')
            data = await queryDB(`SELECT stk.nama_katalog AS jenis_kain, ''AS warna,dp.no_penjualan AS no_order,dp.id_balpenjualan AS notransaksi,
            SUM(dpc.status) AS jml_potong,0.00 AS berat,'DIBAL' AS jenis_packing, IF(tp.no_transaksi IS NULL,
            'Belum di Scan','Sudah di scan') AS stsscan, '-' AS lokasi
            FROM a_master_packingkatalog dp
            JOIN a_packing_katalog dpc ON dpc.no_packing=dp.id_balpenjualan
            LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan
            LEFT JOIN s_detail_penjualankatalog sdp ON(sdp.no_penjualan=dp.no_penjualan)
            LEFT JOIN s_tabel_katalog stk USING(id_katalog)
            WHERE dp.no_penjualan=?`, [no_order])
        else {
            data = await queryDB(tampilkanSemuaListBarang, [
                no_order,
                no_order,
                no_order,
            ]);
            if (data.rows.length === 0) {
                data = await queryDB(tampilkanSemuaListBarangBatalKirim, [
                    no_order,
                    no_order,
                    no_order,
                ]);
            }
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
exports.handlePlusMuatOrder = async function (req, res) {
    try {
        const { no_order } = req.params;
        const id_karyawan = decodedToken(req).id;

        console.log("==========handlePlusMuatOrder", id_karyawan, no_order)

        const getPartial = await queryDB(tampilkanSemuaListBarang, [
            no_order,
            no_order,
            no_order,
        ]);
        let vketerangan = ""
        if (getPartial.rows.findIndex(item => item.stsscan === "Belum di Scan") < 0) {
            vketerangan = await cetakSJ(id_karyawan, no_order)
        }

        response.ok({ message: vketerangan }, 200, res)

    } catch (e) {
        return response.ok({ status: "GAGAL", pesan: GetError(e) }, 200, res);
    }
}