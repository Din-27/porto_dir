const response = require("../../config/res/res");
const { queryDB, dumpError, decodedToken, starttransaction, commit, rollback } = require("../../config/conn/tabel");

exports.get_list_pengeluaran_transfer_stok = async (req, res) => {
    try {
        const getData =
            await queryDB(`SELECT no_pengeluaran, vpt.cabang, COUNT(dt.no_roll) AS jml, SUM(dt.berat) AS berat
            FROM v_pengeluaran_transferstok vpt
            LEFT JOIN pengeluaran_satpam_transfer pst USING(no_pengeluaran)
            JOIN (
            SELECT n.no_pengeluaran,p.no_roll,nama_kain,jenis_warna,p.berat,COUNT(p.no_roll) AS jumlah_potong,jenis_quantity AS jenis
            ,IF(dt.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan,n.keterangan
            FROM n_transfer_stok n JOIN detail_order d ON n.no_pengeluaran=d.no_order JOIN perincian_order p USING(no_detail) JOIN n_stok USING(no_roll)
            JOIN kain USING(id_kain) JOIN warna USING(id_warna)
            LEFT JOIN detail_pengeluaransatpam_transfer dt ON p.no_roll=dt.no_transaksi
            LEFT JOIN detail_ngebal vn ON p.no_roll=vn.no_packing_roll
            WHERE jenis_quantity='ROLLAN' AND vn.no_packing_roll IS NULL
            GROUP BY no_roll
            UNION
            SELECT n.no_pengeluaran,no_packing,'','',SUM(dpc.berat) AS berat,COUNT(no_roll),'PACKING' AS jenis
            ,IF(dt.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan,n.keterangan
            FROM n_transfer_stok n JOIN data_packingkain dp ON n.no_pengeluaran=dp.no_order JOIN detail_packingkain dpc USING(no_packing)
            LEFT JOIN detail_ngebal dn ON dp.no_packing=dn.no_packing_roll
            LEFT JOIN detail_pengeluaransatpam_transfer dt ON dp.no_packing=dt.no_transaksi
            WHERE dn.no_packing_roll IS NULL
            GROUP BY no_packing
            UNION
            SELECT n.no_pengeluaran,no_ngebal,'','',SUM(dpc.berat) AS berat,SUM(dpc.jml_potong),'BAL' AS jenis
            ,IF(dt.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan,n.keterangan
            FROM n_transfer_stok n JOIN data_ngebal dn ON n.no_pengeluaran=dn.no_order JOIN detail_ngebal dpc USING(no_ngebal)
            LEFT JOIN detail_pengeluaransatpam_transfer dt ON dn.no_ngebal=dt.no_transaksi
            GROUP BY no_ngebal) dt USING(no_pengeluaran)
            GROUP BY no_pengeluaran`);
        return response.ok(
            {
                status: "SUKSES",
                pesan: getData.rows.map(x => {
                    x.berat = x.berat.toFixed(2)
                    return x
                }),
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

exports.get_list_pengeluaran_transfer_stok_hasil_scan = async (req, res) => {
    try {
        const getData =
            await queryDB(`SELECT  n.no_pengeluaran,n.cabang,COUNT(no_roll) AS jml,
        SUM(berat) AS berat,IF(na.no_transfer IS NULL,'BELUM DI ACC','SUDAH DI ACC') AS STATUS,ps.tanggal,nama
        FROM n_transfer_stok n JOIN n_histori_transferstok_operator nt ON no_pengeluaran=no_transfer LEFT JOIN n_acc_transferstok na 
        ON n.no_pengeluaran=na.no_transfer JOIN pengeluaran_satpam_transfer ps USING(no_pengeluaran) JOIN user u ON ps.id_user=u.id_user
        WHERE n.status <> 0  GROUP BY no_pengeluaran ORDER BY tanggal DESC`);
        return response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
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
exports.get_list_pengeluaran_transfer_stok_hasil_scan_v3 = async (req, res) => {
    try {
        const getData =
            await queryDB(`SELECT n.no_pengeluaran,n.cabang,COUNT(v.no_roll) AS jml,CAST(SUM(v.berat) AS DECIMAL(15,2)) AS berat 
            ,IF(na.no_transfer IS NULL,'BELUM DI ACC','SUDAH DI ACC') AS STATUS,ps.tanggal,nama
            FROM (
            SELECT n.no_pengeluaran,p.no_roll,nama_kain,jenis_warna,p.berat,COUNT(p.no_roll) AS jumlah_potong,jenis_quantity AS jenis
            FROM n_transfer_stok n JOIN detail_order d ON n.no_pengeluaran=d.no_order JOIN perincian_order p USING(no_detail) JOIN n_stok USING(no_roll)
            JOIN kain USING(id_kain) JOIN warna USING(id_warna)
            LEFT JOIN detail_ngebal vn ON p.no_roll=vn.no_packing_roll
            WHERE n.status <> 0 AND jenis_quantity='ROLLAN'  AND vn.no_packing_roll IS NULL
            GROUP BY no_roll
            UNION
            SELECT n.no_pengeluaran,no_packing,'','',SUM(dpc.berat),COUNT(no_roll),'PACKING' AS jenis
            FROM n_transfer_stok n JOIN data_packingkain dp ON n.no_pengeluaran=dp.no_order JOIN detail_packingkain dpc USING(no_packing)
            LEFT JOIN detail_ngebal dn ON dp.no_packing=dn.no_packing_roll
            WHERE n.status <> 0 AND dn.no_packing_roll IS NULL 
            GROUP BY no_packing
            UNION
            SELECT n.no_pengeluaran,no_ngebal,'','',SUM(dpc.berat),SUM(dpc.jml_potong),'BAL' AS jenis
            FROM n_transfer_stok n JOIN data_ngebal dn ON n.no_pengeluaran=dn.no_order JOIN detail_ngebal dpc USING(no_ngebal)
            WHERE n.status <> 0 
            GROUP BY no_ngebal        
            ) AS v
            JOIN n_transfer_stok n USING(no_pengeluaran) JOIN pengeluaran_satpam_transfer ps USING(no_pengeluaran)
            JOIN user u ON ps.id_user=u.id_user
            LEFT JOIN n_acc_transferstok na ON n.no_pengeluaran=na.no_transfer
            WHERE n.status <> 0  GROUP BY no_pengeluaran ORDER BY tanggal DESC`);
        return response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
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

exports.get_list_pengeluaran_transfer_stok_hasil_scan_rincian = async (
    req,
    res
) => {
    try {
        const { no_transfer } = req.params;
        const getData = await queryDB(
            `SELECT nho.no_transfer AS no_pengeluaran,nho.no_roll,nho.berat,nama_kain,jenis_warna,
        IF(nhs.no_roll IS NOT NULL,1,0)AS sts, 
        IF(nhs.no_roll IS NOT NULL,'',IF(ntr.no_roll IS NOT NULL,'TIDAK DI TEMUKAN DI SATPAM','TIDAK DI TEMUKAN DI PENCARIAN')) AS keterangan 
        FROM n_histori_transferstok_operator nho JOIN perincian_penerimaanstok pps USING(no_roll) JOIN detail_penerimaanstok dp USING(no_detail) 
        JOIN kain k USING(id_kain) JOIN warna w USING(id_warna) LEFT JOIN n_histori_transferstok_satpam nhs ON nho.no_roll=nhs.no_roll 
        AND nho.no_transfer=nhs.no_transfer LEFT JOIN n_temp_rincian_transferstok ntr ON ntr.no_roll=nho.no_roll 
        AND ntr.no_transfer=nho.no_transfer where nho.no_transfer=?`,
            [no_transfer]
        );
        return response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
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

exports.verifikasi_kode_manual_stok = async (req, res) => {
    try {
        const { id } = decodedToken(req);
        const { nomor, kode_verifikasi, status } = req.body;
        const no_roll = nomor;
        if (status?.match(/manual/gm)) {
            if (!kode_verifikasi) {
                return response.ok(
                    { status: "GAGAL", pesan: `kode verifikasi tidak boleh kosong !` },
                    200,
                    res
                );
            }
        }
        const getNoTransfer = await queryDB(
            `select * from n_temp_rincian_transferstok where no_roll=?`,
            [no_roll]
        );
        if (getNoTransfer.rows.length === 0) {
            return response.ok(
                {
                    status: "GAGAL",
                    pesan: "Kain tersebut tidak terdaftar di list rincian transfer stok",
                },
                200,
                res
            );
        }
        const no_transfer = getNoTransfer.rows[0].no_transfer;
        const berat = getNoTransfer.rows[0].berat;

        const validationStok = await queryDB(
            `select n.no_pengeluaran,no_roll,nt.berat,if(dt.no_transaksi is null,'Belum di scan','Sudah di scan') as stsscan
        from n_transfer_stok n JOIN n_temp_rincian_transferstok nt ON n.no_pengeluaran=nt.no_transfer left 
        join detail_pengeluaransatpam_transfer dt on nt.no_roll=dt.no_transaksi 
        where n.no_pengeluaran=? and no_roll=?`,
            [no_transfer, no_roll]
        );

        if (validationStok.rows.length === 0) {
            return response.ok(
                {
                    status: "GAGAL",
                    pesan: "Kain tersebut tidak terdaftar di list transfer stok",
                },
                200,
                res
            );
        }
        const validationsPengeluaran = await queryDB(
            `select * from pengeluaran_satpam_transfer where no_pengeluaran=?`,
            [no_transfer]
        );
        if (validationsPengeluaran.rows.length === 0) {
            await queryDB(`insert into pengeluaran_satpam_transfer values(0, ?, now(), ?, 0)`, [no_transfer, id]).then();
        }
        const validationDetailPengeluaran = await queryDB(
            `select * from detail_pengeluaransatpam_transfer where no_transaksi=? and no_pengeluaran=?`,
            [no_roll, no_transfer]
        );
        console.log(validationDetailPengeluaran.rows.length, 'ini scan transfer stok');
        if (validationDetailPengeluaran.rows.length === 0) {
            await queryDB(`insert into detail_pengeluaransatpam_transfer values(0,?, ?, 1, ?, '', 0)`, [no_transfer, no_roll, berat]).then();
        }
        return response.ok(
            { status: "SUKSES", pesan: "Data sudah di scan" },
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

exports.verifikasi_kode_manual_stok_v3 = async (req, res) => {
    try {
        const { id } = decodedToken(req);
        const { nomor, kode_verifikasi, status, no_transfer } = req.body;
        const no_roll = nomor;
        if (status?.match(/manual/gm)) {
            if (!kode_verifikasi) {
                return response.ok(
                    { status: "GAGAL", pesan: `kode verifikasi tidak boleh kosong !` },
                    200,
                    res
                );
            }
        }

        const validationStok = await queryDB(
            `SELECT n.no_pengeluaran,p.no_roll,p.berat,ns.kode
            FROM n_transfer_stok n JOIN detail_order d ON n.no_pengeluaran=d.no_order JOIN perincian_order p USING(no_detail)
            JOIN n_stok ns using(no_roll)
            WHERE jenis_quantity='ROLLAN' AND no_order='${no_transfer}' AND no_roll='${no_roll}'
            UNION
            SELECT n.no_pengeluaran,no_packing,SUM(dpc.berat),ns.kode
            FROM n_transfer_stok n JOIN data_packingkain dp ON n.no_pengeluaran=dp.no_order JOIN detail_packingkain dpc USING(no_packing)
            JOIN n_stok ns using(no_roll)
            LEFT JOIN detail_ngebal dn ON dp.no_packing=dn.no_packing_roll
            WHERE dn.no_packing_roll IS NULL AND no_order='${no_transfer}' AND (no_roll='${no_roll}')
            HAVING no_pengeluaran IS NOT NULL
            UNION
            SELECT n.no_pengeluaran,no_packing,SUM(dpc.berat),dp.kode_verifikasi
            FROM n_transfer_stok n JOIN data_packingkain dp ON n.no_pengeluaran=dp.no_order JOIN detail_packingkain dpc USING(no_packing)
            JOIN n_stok ns using(no_roll)
            LEFT JOIN detail_ngebal dn ON dp.no_packing=dn.no_packing_roll
            WHERE dn.no_packing_roll IS NULL AND no_order='${no_transfer}' AND (no_packing='${no_roll}')
            HAVING no_pengeluaran IS NOT NULL
            UNION
            SELECT n.no_pengeluaran,no_ngebal,SUM(dpc.berat),IF(krs.no_karung IS NULL,dn.kode_verifikasi,krs.kode_verifikasi) 
            FROM n_transfer_stok n JOIN data_ngebal dn ON n.no_pengeluaran=dn.no_order JOIN detail_ngebal dpc USING(no_ngebal)
            LEFT JOIN (
                SELECT no_karung,kode_verifikasi FROM data_karung_sortir
                UNION
                SELECT no_karung,kode_verifikasi FROM data_karung_sortir_tahap2
                UNION
                SELECT no_karung,kode_verifikasi FROM data_karung_sortir_tahap3
            ) AS krs ON no_ngebal=krs.no_karung
            WHERE no_order='${no_transfer}' AND no_ngebal='${no_roll}'
            HAVING no_pengeluaran IS NOT NULL`,
            []
        );
        if (validationStok.rows.length === 0) {
            return response.ok(
                {
                    status: "GAGAL",
                    pesan: "Barang tersebut tidak ada di list transfer stok",
                },
                200,
                res
            );
        }

        if (status?.match(/manual/gm)) {
            if (validationStok.rows[0].kode != kode_verifikasi) {
                return response.ok({ status: "GAGAL", pesan: "Kode Verifikasi salah" }, 200, res)
            }
        }

        const notransaksi = validationStok.rows[0].no_roll
        const berat = validationStok.rows[0].berat;


        const validationsPengeluaran = await queryDB(
            `select * from pengeluaran_satpam_transfer where no_pengeluaran=?`,
            [no_transfer]
        );
        if (validationsPengeluaran.rows.length === 0) {
            await queryDB(`insert into pengeluaran_satpam_transfer values(0, ?, now(), ?, 0)`, [no_transfer, id]).then();
        }
        const validationDetailPengeluaran = await queryDB(
            `select * from detail_pengeluaransatpam_transfer where no_transaksi=? and no_pengeluaran=?`,
            [no_roll, no_transfer]
        );
        console.log(validationDetailPengeluaran.rows.length, 'ini scan transfer stok');
        if (validationDetailPengeluaran.rows.length === 0) {
            await queryDB(`insert into detail_pengeluaransatpam_transfer values(0,?, ?, 1, ?, '', 0)`, [no_transfer, notransaksi, berat]).then();
        }

        const checkScan = await queryDB(
            `SELECT * FROM (
            SELECT n.no_pengeluaran,p.no_roll,nama_kain,jenis_warna,p.berat,COUNT(p.no_roll) AS jumlah_potong,jenis_quantity AS jenis
            ,IF(dt.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan,n.keterangan
            FROM n_transfer_stok n JOIN detail_order d ON n.no_pengeluaran=d.no_order JOIN perincian_order p USING(no_detail) JOIN n_stok USING(no_roll)
            JOIN kain USING(id_kain) JOIN warna USING(id_warna)
            LEFT JOIN detail_pengeluaransatpam_transfer dt ON p.no_roll=dt.no_transaksi
            LEFT JOIN detail_ngebal vn ON p.no_roll=vn.no_packing_roll
            WHERE jenis_quantity='ROLLAN' AND d.no_order='${no_transfer}' AND vn.no_packing_roll IS NULL
            GROUP BY no_roll
            UNION
            SELECT n.no_pengeluaran,no_packing,'','',SUM(dpc.berat),COUNT(no_roll),'PACKING' AS jenis
            ,IF(dt.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan,n.keterangan
            FROM n_transfer_stok n JOIN data_packingkain dp ON n.no_pengeluaran=dp.no_order JOIN detail_packingkain dpc USING(no_packing)
            LEFT JOIN detail_ngebal dn ON dp.no_packing=dn.no_packing_roll
            LEFT JOIN detail_pengeluaransatpam_transfer dt ON dp.no_packing=dt.no_transaksi
            WHERE dn.no_packing_roll IS NULL AND no_order='${no_transfer}'
            GROUP BY no_packing
            UNION
            SELECT n.no_pengeluaran,no_ngebal,'','',SUM(dpc.berat),SUM(dpc.jml_potong),'BAL' AS jenis
            ,IF(dt.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan,n.keterangan
            FROM n_transfer_stok n JOIN data_ngebal dn ON n.no_pengeluaran=dn.no_order JOIN detail_ngebal dpc USING(no_ngebal)
            LEFT JOIN detail_pengeluaransatpam_transfer dt ON dn.no_ngebal=dt.no_transaksi
            WHERE no_order='${no_transfer}'
            GROUP BY no_ngebal
            )AS v WHERE stsscan='Belum di scan'`,
            []
        );
        if (checkScan.rows.length === 0) {
            return response.ok(
                { status: "SUKSES", pesan: "Seluruh barang sudah di scan" },
                200,
                res
            );
        }

        return response.ok(
            { status: "SUKSES", pesan: "Data sudah di scan" },
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

exports.rincian_pengeluaran_transfer_stok = async (req, res) => {
    try {
        const { no_pengeluaran } = req.params;
        const getDetail = await queryDB(
            `SELECT n.no_pengeluaran, pps.no_roll,nama_kain,jenis_warna,nt.berat,IF(dt.no_transaksi IS NULL,
        'Belum di scan','Sudah di scan') AS stsscan, n.keterangan 
        FROM n_transfer_stok n JOIN n_temp_rincian_transferstok nt ON n.no_pengeluaran=nt.no_transfer 
        JOIN perincian_penerimaanstok pps USING(no_roll) JOIN detail_penerimaanstok USING(no_detail) 
        JOIN kain USING(id_kain) JOIN warna USING(id_warna) 
        LEFT JOIN detail_pengeluaransatpam_transfer dt ON nt.no_roll=dt.no_transaksi WHERE n.no_pengeluaran=?`,
            [no_pengeluaran]
        );
        return response.ok({ status: "SUKSES", pesan: getDetail.rows }, 200, res);
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

exports.rincian_pengeluaran_transfer_stok_v3 = async (req, res) => {
    try {
        const { no_pengeluaran } = req.params;
        const getDetail = await queryDB(
            `SELECT n.no_pengeluaran,p.no_roll,nama_kain,jenis_warna,p.berat,COUNT(p.no_roll) AS jumlah_potong,jenis_quantity AS jenis
            ,IF(dt.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan,n.keterangan
            FROM n_transfer_stok n JOIN detail_order d ON n.no_pengeluaran=d.no_order JOIN perincian_order p USING(no_detail) JOIN n_stok USING(no_roll)
            JOIN kain USING(id_kain) JOIN warna USING(id_warna)
            LEFT JOIN detail_pengeluaransatpam_transfer dt ON p.no_roll=dt.no_transaksi
            LEFT JOIN detail_ngebal vn ON p.no_roll=vn.no_packing_roll
            WHERE jenis_quantity='ROLLAN' AND d.no_order='${no_pengeluaran}' AND vn.no_packing_roll IS NULL
            GROUP BY no_roll
            UNION
            SELECT n.no_pengeluaran,no_packing,'','',SUM(dpc.berat),COUNT(no_roll),'PACKING' AS jenis
            ,IF(dt.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan,n.keterangan
            FROM n_transfer_stok n JOIN data_packingkain dp ON n.no_pengeluaran=dp.no_order JOIN detail_packingkain dpc USING(no_packing)
            LEFT JOIN detail_ngebal dn ON dp.no_packing=dn.no_packing_roll
            LEFT JOIN detail_pengeluaransatpam_transfer dt ON dp.no_packing=dt.no_transaksi
            WHERE dn.no_packing_roll IS NULL AND no_order='${no_pengeluaran}'
            GROUP BY no_packing
            UNION
            SELECT n.no_pengeluaran,no_ngebal,'','',SUM(dpc.berat),SUM(dpc.jml_potong),'BAL' AS jenis
            ,IF(dt.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan,n.keterangan
            FROM n_transfer_stok n JOIN data_ngebal dn ON n.no_pengeluaran=dn.no_order JOIN detail_ngebal dpc USING(no_ngebal)
            LEFT JOIN detail_pengeluaransatpam_transfer dt ON dn.no_ngebal=dt.no_transaksi
            WHERE no_order='${no_pengeluaran}'
            GROUP BY no_ngebal`,
            []
        );
        return response.ok({
            status: "SUKSES", pesan: getDetail.rows.map(x => {
                x.berat = x.berat.toFixed(2)
                return x
            })
        }, 200, res);
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

exports.checkSelesaiStok = async (req, res) => {
    try {
        const { no_pengeluaran } = req.params;
        const getDetail = await queryDB(
            `SELECT n.no_pengeluaran, pps.no_roll,nama_kain,jenis_warna,nt.berat,IF(dt.no_transaksi IS NULL,
            'Belum di scan','Sudah di scan') AS stsscan, n.keterangan 
            FROM n_transfer_stok n JOIN n_temp_rincian_transferstok nt ON n.no_pengeluaran=nt.no_transfer 
            JOIN perincian_penerimaanstok pps USING(no_roll) JOIN detail_penerimaanstok USING(no_detail) 
            JOIN kain USING(id_kain) JOIN warna USING(id_warna) 
            LEFT JOIN detail_pengeluaransatpam_transfer dt ON nt.no_roll=dt.no_transaksi WHERE n.no_pengeluaran=?`,
            [no_pengeluaran])
        const checkScan = getDetail.rows.filter(x => x.stsscan.toLowerCase() === 'sudah di scan')
        const checkNotScan = getDetail.rows.filter(x => x.stsscan.toLowerCase() !== 'sudah di scan')
        if (checkScan.length !== getDetail.rows.length && checkNotScan.length > 0) {
            return response.ok({ status: "SUKSES", pesan: 'Kain belum di scan semua, apakah anda yakin akan menyelesaikan transaki tersebut ?' }, 200, res);
        }
        return response.ok({ status: "SUKSES", pesan: '' }, 200, res);
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

exports.handleSelesaiStok = async (req, res) => {
    try {
        const { id } = decodedToken(req)
        const { no_pengeluaran } = req.body;

        const getDetail = await queryDB(
            `SELECT n.no_pengeluaran, pps.no_roll,nama_kain,jenis_warna,nt.berat,IF(dt.no_transaksi IS NULL,
            'Belum di scan','Sudah di scan') AS stsscan, n.keterangan 
            FROM n_transfer_stok n JOIN n_temp_rincian_transferstok nt ON n.no_pengeluaran=nt.no_transfer 
            JOIN perincian_penerimaanstok pps USING(no_roll) JOIN detail_penerimaanstok USING(no_detail) 
            JOIN kain USING(id_kain) JOIN warna USING(id_warna) 
            LEFT JOIN detail_pengeluaransatpam_transfer dt ON nt.no_roll=dt.no_transaksi WHERE n.no_pengeluaran=?`,
            [no_pengeluaran])

        const data = await queryDB(`select n.no_pengeluaran,pps.no_roll,nama_kain,jenis_warna,nt.berat,if(dt.no_transaksi is null,'Belum di scan','Sudah di scan') as stsscan 
            from n_transfer_stok n JOIN n_temp_rincian_transferstok nt ON n.no_pengeluaran=nt.no_transfer
            JOIN perincian_penerimaanstok pps USING(no_roll) JOIN detail_penerimaanstok USING(no_detail) JOIN kain USING(id_kain) JOIN warna USING(id_warna)
            left join detail_pengeluaransatpam_transfer dt on nt.no_roll=dt.no_transaksi where n.no_pengeluaran=?`, [no_pengeluaran])

        for (let i = 0; i < getDetail.rows.length; i++) {
            const item = getDetail.rows[i]
            if (item.stsscan.toLowerCase() !== 'sudah di scan') {
                await queryDB(`delete from n_histori_transferstok_satpam where no_transfer=? and no_roll=?`, [item.no_pengeluaran, item.no_roll]).then()
            }
        }
        for (let i = 0; i < data.rows.length; i++) {
            const x = data.rows[i]
            if (x.stsscan.toLowerCase() !== 'sudah di scan') {
                await queryDB(`insert into lama_dilokasi(no_roll,no_lokasi,tanggal_simpan,id_karyawan,berat) values(?,'PJTF',now(),?,?) `, [x.no_roll, id, x.berat]).then()
                await queryDB(`update perincian_penerimaanstok set no_lokasi='PJTF' where no_roll=?`, [x.no_roll]).then()
            }
        }
        await queryDB(`update pengeluaran_satpam_transfer set status=1 where no_pengeluaran=?`, [no_pengeluaran]).then()
        await queryDB(`update n_transfer_stok set status=2 where no_pengeluaran=?`, [no_pengeluaran]).then()
        return response.ok(
            {
                status: "SUKSES", pesan: `Transfer Stok ${no_pengeluaran} sudah selesai`
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