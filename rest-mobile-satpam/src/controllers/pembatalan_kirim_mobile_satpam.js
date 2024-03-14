const { scan_batal_kirim } = require("../utils");
const response = require("../../config/res/res");
const query = require("../utils/query");
const {
    queryDB,
    dumpError,
} = require("../../config/conn/tabel");

exports.search_list_pembatalan_muat = async (req, res) => {
    try {
        const { search } = req.params;
        const getMuat =
            await queryDB(`SELECT pu.no_muat,pu.tanggal AS tgl,ongkir,lain_lain,pu.catatan,u.nama AS pengeluar,supir,angkutan  
        FROM pengeluaran_uanguntukpengiriman pu JOIN user u ON u.id_user=pu.id_karyawan 
        JOIN muat_orderan mu ON mu.no_muat=pu.no_muat 
        WHERE pu.status=0 and pu.no_muat LIKE '%${search}%' OR supir LIKE '%${search}%' OR angkutan LIKE '%${search}%' AND pu.no NOT IN (SELECT no_pengeluaran FROM detail_pengeluaranongkir) ORDER BY pu.tanggal DESC`);
        return response.ok({ status: "SUKSES", pesan: getMuat.rows }, 200, res);
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

exports.list_pembatalan_muat = async (req, res) => {
    try {
        const getMuat =
            await queryDB(`SELECT pu.no_muat,pu.tanggal AS tgl,ongkir,lain_lain,pu.catatan,u.nama AS pengeluar,supir,angkutan  
        FROM pengeluaran_uanguntukpengiriman pu JOIN user u ON u.id_user=pu.id_karyawan 
        JOIN muat_orderan mu ON mu.no_muat=pu.no_muat 
        WHERE pu.status=0 AND pu.no NOT IN (SELECT no_pengeluaran FROM detail_pengeluaranongkir) ORDER BY pu.tanggal DESC`);
        return response.ok({ status: "SUKSES", pesan: getMuat.rows }, 200, res);
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

exports.detail_pembatalan_muat_order = async (req, res) => {
    try {
        let temp, jenis_pengiriman;
        const { no_order } = req.params;
        temp = no_order.match(/KT|kt/gm);
        if (temp) {
            jenis_pengiriman = await queryDB(
                query.jenisPengirimanPembatalanKirim1,
                [no_order]
            );
        } else {
            jenis_pengiriman = await queryDB(
                query.jenisPengirimanPembatalanKirim2,
                [no_order, no_order, no_order, no_order]
            );
        }
        const filterisasi = jenis_pengiriman.rows.filter((x) =>
            x.notransaksi !== null && x.no_order !== "ADA"
                ? (x.stsscan = "Belum di scan")
                : (x.stsscan = "Sudah di scan")
        );
        return response.ok(
            {
                status: "SUKSES",
                pesan: filterisasi.filter((x) => x.notransaksi !== null),
            },
            200,
            res
        );
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

exports.detail_pembatalan_muat = async (req, res) => {
    try {
        const { no_muat } = req.params;
        const getMuat = await queryDB(query.detailPembatalanMuat, [no_muat, no_muat]);
        return response.ok(
            { status: "SUKSES", pesan: getMuat.rows, no_muat: no_muat },
            200,
            res
        );
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

exports.scan_batal_kirim_non_manual = async (req, res) => {
    try {
        scan_batal_kirim({ req, res });
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

exports.scan_batal_kirim = async (req, res) => {
    try {
        let no_roll;
        const { nomor, kode_verifikasi, status } = req.body;
        no_roll = nomor;
        if (status?.match(/manual/gm)) {
            if (kode_verifikasi === "") {
                return response.ok(
                    { status: "GAGAL", pesan: "Kode Verifikasi Harus diisi !" },
                    200,
                    res
                );
            }
        }
        if (no_roll === "") {
            return response.ok(
                { status: "GAGAL", pesan: "No Roll harus diisi!" },
                200,
                res
            );
        }
        scan_batal_kirim({ req, res });
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