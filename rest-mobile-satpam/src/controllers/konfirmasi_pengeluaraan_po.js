const query = require('../utils/query')
const response = require("../../config/res/res");
const { queryDB, dumpError, decodedToken } = require("../../config/conn/tabel");

// exports.get_data_list_po_by_no_pengeluaraan = async (req, res) => {
//     try {
//         let cek_nopengeluaran, checkData, no_order, getDataPO;
//         const { no_pengeluaran } = req.params;
//         const { id } = decodedToken(req);
//         if (!no_pengeluaran) {
//             return response.ok(
//                 { status: "GAGAL", pesan: "Nomor pengeluaran tidak boleh kosong 1" },
//                 200,
//                 res
//             );
//         }
//         // if (no_pengeluaran.slice(0, 2) !== 'KL') {
//         //     const getNoPengeluaran = await queryDB(`SELECT dp.no_pengeluaran, pd.no_roll FROM perincian_detailpengeluarankain pd
//         //     JOIN detail_pengeluarankain dp USING(no_detail) where no_roll=?`, [no_pengeluaran])
//         //     if (getNoPengeluaran.rows.length > 0) {
//         //         cek_nopengeluaran = getNoPengeluaran.rows[0].no_pengeluaran
//         //     } else {
//         //         return response.ok({ status: 'GAGAL', pesan: 'Nomor roll tersebut tidak terdaftar pada penjualan po' }, 200, res)
//         //     }
//         // } else {
//         if (no_pengeluaran.length > 11) {
//             const checkDataNgebal = await queryDB(
//                 `select * from data_ngebal_po where no_ngebal=?`,
//                 [no_pengeluaran]
//             );
//             if (checkDataNgebal.rows.length > 0) {
//                 cek_nopengeluaran = checkDataNgebal.rows[0].no_order;
//             } else {
//                 return response.ok(
//                     {
//                         status: "GAGAL",
//                         pesan: "Nomor bal tersebut tidak terdaftar pada bal po",
//                     },
//                     200,
//                     res
//                 );
//             }
//         } else {
//             cek_nopengeluaran = no_pengeluaran;
//         }
//         // }
//         const checkDataPacking = await queryDB(
//             `SELECT * FROM a_datapacking_po where no_pengeluaran=?`,
//             [cek_nopengeluaran]
//         );
//         if (checkDataPacking.rows.length > 0) {
//             jenis_packing = checkDataPacking.rows[0].jenis_packing;
//         } else {
//             return response.ok(
//                 { status: "GAGAL", pesan: "Data tidak terdaftar pada jenis packing" },
//                 200,
//                 res
//             );
//         }
//         if (jenis_packing === "DI BAL") {
//             checkData = await queryDB(
//                 `select * from data_ngebal_po join detail_ngebal_po using(no_ngebal) where no_ngebal=? 
//             or no_packing_roll=?`,
//                 [no_pengeluaran, no_pengeluaran]
//             );
//         } else {
//             checkData = await queryDB(
//                 `select dp.no_pengeluaran as no_order, pd.no_roll from perincian_detailpengeluarankain pd 
//             join detail_pengeluarankain dp using(no_detail) where dp.no_pengeluaran=?`,
//                 [cek_nopengeluaran]
//             );
//         }
//         if (checkData.rows.length === 0) {
//             if (jenis_packing === "DI BAL") {
//                 return response.ok(
//                     {
//                         status: "GAGAL",
//                         pesan: "No tersebut tidak ada di data selesai bal!",
//                     },
//                     200,
//                     res
//                 );
//             } else {
//                 return response.ok(
//                     {
//                         status: "GAGAL",
//                         pesan: "No tersebut tidak ada di data penjualan po!",
//                     },
//                     200,
//                     res
//                 );
//             }
//         } else {
//             no_order = checkData.rows[0].no_order;
//             console.log(no_order);
//             const checkPengeluaranSatpam = await queryDB(
//                 `select * from pengeluaran_satpam_po where no_order=?`,
//                 [no_order]
//             );
//             if (checkPengeluaranSatpam.rows.length !== 0) {
//                 if (checkPengeluaranSatpam.rows[0].status === 1) {
//                     return response.ok(
//                         { status: "GAGAL", pesan: "PO tersebut sudah di kirim!" },
//                         200,
//                         res
//                     );
//                 }
//             }
//             if (jenis_packing === "DI BAL") {
//                 const getPengeluaranKain = await queryDB(
//                     query.getPengeluaranKainPengeluaranPo,
//                     [no_order]
//                 );
//                 const filtering = getPengeluaranKain.rows.map((x) => x.no_bal === "-");
//                 if (filtering) {
//                     return response.ok(
//                         { status: "GAGAL", pesan: "PO tersebut belum selesai di bal" },
//                         200,
//                         res
//                     );
//                 }
//             }
//             if (jenis_packing === "DI BAL") {
//                 getDataPO = await queryDB(
//                     query.getDataPoPengeluaranPo1,
//                     [no_order]
//                 );
//             } else {
//                 getDataPO = await queryDB(
//                     query.getDataPoPengeluaranPo2,
//                     [no_order]
//                 );
//             }
//             const checkStatusPekerjaan = await queryDB(
//                 `select * from  status_pekerjaan 
//             where jenis_pekerjaan='NGEBAL' and id_karyawan=? and no_order=? and status=0`,
//                 [id, no_order]
//             );
//             if (checkStatusPekerjaan.rows.length === 0) {
//                 await queryDB(`insert into status_pekerjaan values(0,?,'NGEBAL',?,0)`, [no_order, id,]).then();
//             }
//             const result = {
//                 customer: getDataPO.rows[0].nama,
//                 no_order: getDataPO.rows[0].no_pengeluaran,
//                 detail: getDataPO.rows,
//             };
//             return response.ok({ status: "SUKSES", pesan: result }, 200, res);
//         }
//     } catch (e) {
//         dumpError(e);
//         console.error(e);
//         return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
//     }
// };

exports.verifikasi_barang_pengeluaran_po = async (req, res) => {
    try {
        let roll
        const { nomor } = req.body;
        const { id } = decodedToken(req);
        let cek_nopengeluaran, jenis_packing, no_order_bal, no_packing, no, jmlpotong, berat

        if (!nomor) {
            return response.ok(
                { status: "GAGAL", pesan: "Nomor pengeluaran tidak boleh kosong !" },
                200,
                res
            );
        }

        if (nomor.slice(0, 2) !== 'KL') {
            roll = true
        }
        if (roll) {
            const get_no_pengeluaran = await queryDB(`SELECT dp.no_pengeluaran, pd.no_roll 
                FROM perincian_detailpengeluarankain pd JOIN detail_pengeluarankain dp USING(no_detail) where no_roll=?`,
                [nomor])
            cek_nopengeluaran = get_no_pengeluaran.rows[0]?.no_pengeluaran
            if (get_no_pengeluaran.rows.length === 0) {
                return response.ok({
                    status: 'GAGAL',
                    pesan: 'Nomor roll tersebut tidak terdaftar pada penjualan po'
                }, 200, res)
            }
        } else {
            const checkDataNgebal = await queryDB(
                `select * from data_ngebal_po where no_ngebal=?`,
                [nomor]
            );
            cek_nopengeluaran = checkDataNgebal.rows[0]?.no_order
            if (checkDataNgebal.rows.length === 0) {
                return response.ok(
                    {
                        status: "GAGAL",
                        pesan: "Nomor bal tersebut tidak terdaftar pada bal po",
                    },
                    200,
                    res
                );
            }
        }

        const checkStatusPekerjaan1 = await queryDB(
            `select * from  status_pekerjaan 
        where jenis_pekerjaan='NGEBAL' and no_order=? and status=0`,
            [id, nomor]
        );
        if (checkStatusPekerjaan1.rows.length === 0) {
            await queryDB(`update status_pekerjaan set status=1 where jenis_pekerjaan='NGEBAL' and no_order=?`, [nomor]).then();
        }
        const checkDataPacking = await queryDB(
            `SELECT * FROM a_datapacking_po where no_pengeluaran=?`,
            [cek_nopengeluaran]
        );
        if (checkDataPacking.rows.length > 0) {
            jenis_packing = checkDataPacking.rows[0].jenis_packing;
        }
        if (jenis_packing === 'DI BAL') {
            const getNoBal = await queryDB(`SELECT * FROM detail_ngebal_po where no_packing_roll=?`, [nomor])
            no_bal_scan = getNoBal.rows[0]?.no_ngebal
            if (getNoBal.rows.length > 0) {
                return response.ok(
                    { status: "GAGAL", pesan: "Nomor roll tersebut tidak terdaftar pada data" },
                    200,
                    res
                );
            }
        }

        if (jenis_packing === 'DI BAL') {
            data = await queryDB(`select * from data_ngebal_po join detail_ngebal_po using(no_ngebal) where  no_ngebal=?`,
                [nomor])
        } else {
            data = await queryDB(`select dp.no_pengeluaran as no_order, pd.no_roll from perincian_detailpengeluarankain pd 
            join detail_pengeluarankain dp using(no_detail) where dp.no_pengeluaran=?`,
                [cek_nopengeluaran])
        }
        console.log(data.rows[0]?.no_order);
        no_order_bal = data.rows[0]?.no_order
        if (jenis_packing === "DI BAL") {
            getDataPO = await queryDB(
                query.getDataPoPengeluaranPo1,
                [no_order_bal]
            );
        } else {
            getDataPO = await queryDB(
                query.getDataPoPengeluaranPo2,
                [no_order_bal]
            );
        }
        jmlpotong = getDataPO.rows[0]?.jml_potong
        berat = getDataPO.rows[0]?.berat
        const checkPengeluaranSatpam = await queryDB(`select * from pengeluaran_satpam_po where no_order=?`, [no_order_bal])
        if (checkPengeluaranSatpam.rows.length === 0) {
            await queryDB(`insert into pengeluaran_satpam_po values(0,?,now(),?,0)`,
                [no_order_bal, id])
        }

        const getNoPengeluaranSatpam = await queryDB(`select no from pengeluaran_satpam_po where no_order=?`, [no_order_bal])
        no = getNoPengeluaranSatpam.rows[0]?.no
        const detailPengeluaranSatpam = await queryDB(`select * from detail_pengeluaransatpam_po 
            where no_transaksi=? and no_pengeluaran=?`, [nomor, no])
        if (detailPengeluaranSatpam.rows.length === 0) {
            await queryDB(`insert into detail_pengeluaransatpam_po values(0,?,?,?, ?, ?,0)`,
                [no, nomor, jmlpotong, berat, jenis_packing])
        }
        if ((getDataPO.rows.filter(x => x.stsscan === 'Sudah di scan').length + 1) === getDataPO.rows.length) {
            await queryDB(`update pengeluaran_satpam_po set status=1 where no_order=?`, [no_order_bal])
        }
        return response.ok(
            { status: "SUKSES", pesan: "Data berhasil di scan" },
            200,
            res
        );

    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};


exports.get_data_list_po_by_no_pengeluaraan_v2 = async (req, res) => {
    try {
        let cek_nopengeluaran, jenis_packing, noorder, roll = false
        const { no_pengeluaran } = req.params;
        const { id } = decodedToken(req);

        if (no_pengeluaran.slice(0, 2) !== 'KL') {
            roll = true
        }
        if (roll) {
            const get_no_pengeluaran = await queryDB(`SELECT dp.no_pengeluaran, pd.no_roll 
                FROM perincian_detailpengeluarankain pd JOIN detail_pengeluarankain dp USING(no_detail) where no_roll=?`,
                [no_pengeluaran])
            cek_nopengeluaran = get_no_pengeluaran.rows[0]?.no_pengeluaran
            if (get_no_pengeluaran.rows.length === 0) {
                return response.ok({
                    status: 'GAGAL',
                    pesan: 'Nomor roll tersebut tidak terdaftar pada penjualan po'
                }, 200, res)
            }
        } else {
            const checkDataNgebal = await queryDB(
                `select * from data_ngebal_po where no_ngebal=?`,
                [no_pengeluaran]
            );
            cek_nopengeluaran = checkDataNgebal.rows[0]?.no_order
            if (checkDataNgebal.rows.length === 0) {
                return response.ok(
                    {
                        status: "GAGAL",
                        pesan: "Nomor bal tersebut tidak terdaftar pada bal po",
                    },
                    200,
                    res
                );
            }
        }


        const checkDataPacking = await queryDB(
            `SELECT * FROM a_datapacking_po where no_pengeluaran=?`,
            [cek_nopengeluaran]
        );
        if (checkDataPacking.rows.length > 0) {
            jenis_packing = checkDataPacking.rows[0].jenis_packing;
        } else if (checkDataPacking.rows.length === 0) {
            return response.ok(
                { status: "GAGAL", pesan: "Data tidak terdaftar pada jenis packing" },
                200,
                res
            );
        }

        let data
        if (jenis_packing === 'DI BAL') {
            data = await queryDB(`select * from data_ngebal_po join detail_ngebal_po using(no_ngebal) where  no_ngebal=?`,
                [no_pengeluaran])
        } else {
            data = await queryDB(`select dp.no_pengeluaran as no_order, pd.no_roll from perincian_detailpengeluarankain pd 
            join detail_pengeluarankain dp using(no_detail) where dp.no_pengeluaran=?`,
                [cek_nopengeluaran])
        }

        if (data.rows.length === 0) {
            if (jenis_packing === 'DI BAL') {
                return response.ok(
                    { status: "GAGAL", pesan: "No tersebut tidak ada di data selsai bal!" },
                    200,
                    res
                );
            } else {
                return response.ok(
                    { status: "GAGAL", pesan: "No tersebut tidak ada di data penjualan po!" },
                    200,
                    res
                );
            }
        } else {
            noorder = data.rows[0].no_order
            const get_pengeluaran = await queryDB(`select * from pengeluaran_satpam_po where no_order=? and status=1`,
                [noorder])
            console.log(get_pengeluaran.rows);
            if (get_pengeluaran.rows.length > 0) {
                return response.ok(
                    { status: "GAGAL", pesan: "PO tersebut sudah di kirim!" },
                    200,
                    res
                );
            }
            if (jenis_packing === 'DI BAL') {
                const get_pengeluaran = await queryDB(`SELECT IFNULL(RIGHT(dn.no_ngebal,3),''-'') AS nobal 
                FROM pengeluaran_kain pk JOIN detail_pengeluarankain dr USING(no_pengeluaran) 
                JOIN perincian_detailpengeluarankain pp USING(no_detail) 
                LEFT JOIN detail_ngebal_po dn ON dn.no_packing_roll=pp.no_roll  
                WHERE pk.no_pengeluaran=?`,
                    [noorder])
                for (let i = 0; i < get_pengeluaran.rows.length; i++) {
                    if (get_pengeluaran.rows[i].nobal === '-') {
                        return response.ok(
                            { status: "GAGAL", pesan: "PO tersebut belum selesai di bal" },
                            200,
                            res
                        );
                    }
                }
            }
        }
        if (jenis_packing === "DI BAL") {
            getDataPO = await queryDB(
                query.getDataPoPengeluaranPo1,
                [noorder]
            );
        } else {
            getDataPO = await queryDB(
                query.getDataPoPengeluaranPo2,
                [noorder]
            );
        }
        const checkStatusPekerjaan = await queryDB(
            `select * from  status_pekerjaan 
                        where jenis_pekerjaan='NGEBAL' and id_karyawan=? and no_order=? and status=0`,
            [id, noorder]
        );
        if (checkStatusPekerjaan.rows.length === 0) {
            await queryDB(`insert into status_pekerjaan values(0,?,'NGEBAL',?,0)`, [noorder, id,]).then();
        }
        const result = {
            customer: getDataPO.rows[0].nama,
            no_order: getDataPO.rows[0].no_pengeluaran,
            detail: getDataPO.rows,
        };
        return response.ok({ status: "SUKSES", pesan: result }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e }, 200, res);
    }
};