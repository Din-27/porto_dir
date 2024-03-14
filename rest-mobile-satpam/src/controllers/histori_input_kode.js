const response = require("../../config/res/res");
const { queryDB, dumpError } = require("../../config/conn/tabel");

exports.semua_histori_kode_pengambilan = async (req, res) => {
    try {
        const { filter } = req.query;

        let option = 'where status_scan=?'
        console.log(filter.replace('}', ''))

        if (filter === 'Semua') {
            option = ``
        }
        console.log(option)
        const getData =
            await queryDB(`select * from (
            SELECT ao.no_order,no_penjualan,DATE(MIN(ao.tanggal)) AS tanggal_input,TIME(MIN(ao.tanggal)) AS jam_input,
            IF(tp.no_order IS NOT NULL,DATE(MAX(ao.tanggal)),NULL) AS tgl_pertama_scan,
            IF(tp.no_order IS NOT NULL,TIME(MAX(ao.tanggal)),NULL) AS jam_pertama_scan,
            DATE(ro.tanggal) AS tgl_terakhir_scan,TIME(ro.tanggal) AS jam_terakhir_scan,
            (SELECT nama FROM pengeluaran_satpam JOIN muliaabadi_baru.user USING(id_user) WHERE no_order=ao.no_order ORDER BY tanggal ASC LIMIT 1) AS user_scan,
             IF(ro.no_order IS NOT NULL,'Seluruh Kain',IF(tp.no_order IS NOT NULL,'Sebagian','Hanya Input Kode')) AS status_scan      
            FROM a_orderditunggu ao JOIN relasi_orderdanpenjualan ron ON ron.no_order=ao.no_order
            LEFT JOIN order_sudahdikirim ro ON ro.no_order=ao.no_order
            LEFT JOIN temp_pengeluaran tp ON tp.no_order=ao.no_order
            GROUP BY no_order) as data
            ${option}
            order by tanggal_input desc limit 100`, [filter.replace('}', '')]);

        return response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        return response.ok(
            { status: "Ada kesalahan sistem silahkan coba lagi!", pesan: e.message },
            200,
            res
        );
    }
};

exports.semua_histori_kode_pengambilan1 = async (req, res) => {
    try {
        const { no_order, tanggal } = req.query;
        let option = ``
        if (no_order) {
            console.log(no_order);
            option = `where no_order='${no_order}'`
        }
        if (tanggal) {
            console.log(tanggal.split('@'));
            const date = tanggal.split('@')
            option = `where tanggal_input between '${date[0]}' and '${date[1]}'`
        }

        const getData =
            await queryDB(`select * from (
            SELECT ao.no_order,no_penjualan,DATE(MIN(ao.tanggal)) AS tanggal_input,TIME(MIN(ao.tanggal)) AS jam_input,
            IF(tp.no_order IS NOT NULL,DATE(MAX(ao.tanggal)),NULL) AS tgl_pertama_scan,
            IF(tp.no_order IS NOT NULL,TIME(MAX(ao.tanggal)),NULL) AS jam_pertama_scan,
            DATE(ro.tanggal) AS tgl_terakhir_scan,TIME(ro.tanggal) AS jam_terakhir_scan,
            (SELECT nama FROM pengeluaran_satpam JOIN muliaabadi_baru.user USING(id_user) WHERE no_order=ao.no_order ORDER BY tanggal ASC LIMIT 1) AS user_scan,
             IF(ro.no_order IS NOT NULL,'Seluruh Kain',IF(tp.no_order IS NOT NULL,'Sebagian','Hanya Input Kode')) AS status_scan      
            FROM a_orderditunggu ao JOIN relasi_orderdanpenjualan ron ON ron.no_order=ao.no_order
            LEFT JOIN order_sudahdikirim ro ON ro.no_order=ao.no_order
            LEFT JOIN temp_pengeluaran tp ON tp.no_order=ao.no_order
            GROUP BY no_order) as data
            ${option} 
            order by tanggal_input desc limit 100`);

        return response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        return response.ok(
            { status: "Ada kesalahan sistem silahkan coba lagi!", pesan: e.message },
            200,
            res
        );
    }
};