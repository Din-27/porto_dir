const response = require("../../config/res/res");
const {
    queryDB,
    dumpError,
    rollback,
    decodedToken,
} = require("../../config/conn/tabel");

exports.list_return_kain = async (req, res) => {
    try {
        const getListReturnKain =
            await queryDB(`SELECT rp.no_retur,IFNULL(ars.status,'BELUM SCAN') AS sts 
        FROM retur_pembelianstok rp LEFT JOIN a_retursudah_scan ars USING(no_retur) 
        WHERE IFNULL(ars.status,'BELUM SCAN')<>'SELESAI' and tanggal > '2021-01-01' and rp.status=1`);
        return response.ok(
            { status: "SUKSES", pesan: getListReturnKain.rows },
            200,
            res
        );
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.list_return_kain_by_nomor = async (req, res) => {
    try {
        const { no_retur } = req.params;
        const getListReturnKain = await queryDB(
            `SELECT pd.no_roll, pd.berat, if(IFNULL(ads.no_roll,'kosong')='kosong', 'Belum di scan', 'Sudah di scan') AS sts
        FROM detail_returpembelianstok dr JOIN perincian_detailreturpenerimaanstok pd USING(no_detail)
        LEFT JOIN a_detailretursudah_scan ads ON CONCAT(ads.no_retur,ads.no_roll)=CONCAT(dr.no_retur,pd.no_roll)
        WHERE dr.no_retur=?`,
            [no_retur]
        );
        return response.ok(
            { status: "SUKSES", pesan: getListReturnKain.rows },
            200,
            res
        );
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.scan_retur_kain = async (req, res) => {
    try {
        const { id } = decodedToken(req);
        const { nomor, nomor_retur, kode_verifikasi, status } = req.body;
        if (!nomor) {
            return response.ok(
                { status: "GAGAL", pesan: "No Roll Harus diisi!" },
                200,
                res
            );
        }
        if (nomor_retur.slice(0, 2).toUpperCase() !== "RS") {
            return response.ok(
                { status: "GAGAL", pesan: "nomor ini hanya untuk retur kain !" },
                200,
                res
            );
        }
        if (status?.match(/manual/gm)) {
            if (!kode_verifikasi) {
                return response.ok(
                    { status: "GAGAL", pesan: "Kode verifikasi harus diisi !" },
                    200,
                    res
                );
            }
            const checkKode = await queryDB(
                `select * from perincian_penerimaanstok where no_roll=? and kode=?`,
                [nomor, kode_verifikasi]
            );
            if (checkKode.rows.length === 0) {
                return response.ok(
                    { status: "GAGAL", pesan: "Kode verifikasi salah!" },
                    200,
                    res
                );
            }
        }
        const validationNomorRetur = await queryDB(
            `SELECT * FROM retur_pembelianstok rp LEFT JOIN a_retursudah_scan ars USING(no_retur) 
        WHERE IFNULL(ars.status,'BELUM SCAN')<>'SELESAI' AND tanggal > '2021-01-01' AND rp.status=1 AND no_retur=?`,
            [nomor_retur]
        );
        if (validationNomorRetur.rows.length > 0) {
            const checkDataRetur = await queryDB(
                `select * from a_retursudah_scan where no_retur=?`,
                [nomor_retur]
            );
            if (checkDataRetur.rows.length === 0) {
                await queryDB(`insert into a_retursudah_scan values(0,?,'SEDANG DI SCAN')`, [nomor_retur]).then();
            }
            const checkData = await queryDB(
                `select * from a_detailretursudah_scan where no_retur=? and no_roll=?`,
                [nomor_retur, nomor]
            );
            if (checkData.rows.length === 0) {
                await queryDB(`insert into a_detailretursudah_scan values(null,?,?,now(), ?)`, [nomor_retur, nomor, id]).then();
            }
            return response.ok(
                { status: "SUKSES", pesan: "nomor retur berhasil di scan" },
                200,
                res
            );
        }
        return response.ok(
            { status: "GAGAL", pesan: "Roll yang di scan salah" },
            200,
            res
        );
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.selesai_scan_retur = async (req, res) => {
    const { no_retur } = req.params
    try {
        await queryDB(`update a_retursudah_scan set status='SELESAI' where no_retur=?`, [no_retur]).then()
        return response.ok({ status: "SUKSES", pesan: 'sukses' }, 200, res);
    } catch (error) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
}
