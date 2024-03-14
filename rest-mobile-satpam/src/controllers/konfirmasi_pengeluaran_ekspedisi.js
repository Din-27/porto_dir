const response = require("../../config/res/res");
const { verifikasiKainManual } = require("../utils");
const {
    queryDB,
    dumpError,
    starttransaction,
    commit,
    rollback,
    decodedToken,
} = require("../../config/conn/tabel");
const {
    transaksi_muat1,
    transaksi_muat2,
    transaksi_muat0,
    tampilkanBelumScanBarang,
    tampilkanSemuaListBarang,
    qMuat1,
    qMuat2,
    transaksi_muatCheckTemp1,
    transaksi_muatCheckTemp2,
    tampilkanSemuaListBarangBatalKirim,
    validationOrdeGabung2VerifikasiKodeVerifikasi,
} = require("../utils/query");

exports.get_no_kendaraan = async (req, res) => {
    try {
        const getNoMobil = await queryDB(
            `SELECT no_mobil, angkutan, supir FROM temp_datamuat WHERE STATUS=0`
        );
        response.ok({ status: "SUKSES", pesan: getNoMobil.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.get_no_kendaraan_by_nomor = async (req, res) => {
    const { no_mobil } = req.params;
    try {
        const getData = await queryDB(
            `select no_mobil, concat(angkutan, ' - ', supir) as keterangan from temp_datamuat where no_mobil=?`,
            [no_mobil]
        );
        response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.get_transaksi_muat = async (req, res) => {
    let getData;
    try {
        getData = await queryDB(transaksi_muat0);
        response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.get_transaksi_muat_by_nomor_mobil = async (req, res) => {
    let getData, pesan = '', order, order_gabung
    const { no_mobil } = req.params;
    try {
        const checkTempDataMuat = await queryDB(`select * from temp_datamuat where no_mobil=?`, [no_mobil])
        if (checkTempDataMuat.rows.length > 0) {
            getData = await queryDB(transaksi_muat1, [no_mobil, no_mobil]);
        } else {
            getData = await queryDB(transaksi_muat2, [no_mobil, no_mobil]);
        }
        for (let i = 0; i < getData.rows.length; i++) {
            const item = getData.rows[i]
            const no_order = item.no_order
            const get_sj = await queryDB(`SELECT no_sj FROM penjualan_kainstok
            JOIN relasi_orderdanpenjualan ON(no_pengeluaran=no_penjualan)
            WHERE no_order=?`, [no_order])
            item.no_sj = get_sj.rows[0]?.no_sj || ''
        }

        for (let i = 0; i < getData.rows.length; i++) {
            getData.rows[i].pesan_gabung = ""
            const validationOrderGabung = await queryDB(
                `select * from  a_group_order ago 
                  LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS asal ON asal.no_order=ago.no_order_asal 
                  LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS gabung ON gabung.no_order=ago.no_order_gabung 
                  where no_order_asal=? AND gabung.no_order IS NULL AND asal.no_order IS NULL`,
                [getData.rows[i].no_order]
            );
            if (validationOrderGabung.rows.length > 0) {
                order_gabung = validationOrderGabung.rows[0].no_order_gabung
                getData.rows[i].pesan_gabung = `Order ini digabung dengan order ${order_gabung}`
            }

            const validationOrderGabung2 = await queryDB(validationOrdeGabung2VerifikasiKodeVerifikasi, [getData.rows[i].no_order]);
            if (validationOrderGabung2.rows.length > 0) {
                order_gabung = validationOrderGabung2.rows[0].no_order_asal
                getData.rows[i].pesan_gabung = `Order ini digabung dengan order ${order_gabung}`
            }
            console.log(getData.rows[i].no_order);
        }
        response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.get_data_order = async (req, res) => {
    try {
        const { nama_ekspedisi } = req.params;
        // const data = await queryDB(`
        // SELECT op.no_order, nama, (CASE WHEN (IFNULL(o.status,0) = 0) THEN 'PACKING'
        // WHEN (IFNULL(o.status,0) = 1) THEN 'PENGEBALAN' WHEN (IFNULL(o.status,0) = 2) THEN 'SIAP KIRIM' WHEN (IFNULL(o.status,0) = 4)
        // THEN 'SIAP KIRIM' END) AS sts
        // FROM order_pembelian op LEFT JOIN order_sudahdikirim os USING(no_order)
        // LEFT JOIN temp_pengeluaran tp USING(no_order) LEFT JOIN order_siappacking osp USING(no_order)
        // JOIN customer c USING(id_customer) JOIN relasi_orderdanpenjualan rod ON(op.no_order=rod.no_order)
        // JOIN penjualan_kainstok pk ON(rod.no_penjualan=pk.no_pengeluaran) JOIN order_siappacking o ON(op.no_order=o.no_order)
        // WHERE os.no_order IS NULL AND tp.no_order IS NULL AND op.status=1
        // AND osp.status<>0 AND osp.status<>1 and op.exspedisi=?
        // `, [nama_ekspedisi])
        const data = await queryDB(
            `select vo.no_order, nama, sts from v_ordermenunggukirim vo join order_pembelian op using(no_order)
        where sts='SIAP KIRIM' and op.exspedisi=?`,
            [nama_ekspedisi]
        );
        console.log("ini query 1");
        return response.ok({ status: "SUKSES", pesan: data.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.get_data_order_byno_order = async (req, res) => {
    try {
        let dataDetail
        const { nama_ekspedisi, no_order } = req.body;
        const data = await queryDB(
            `SELECT op.no_order, nama, jenis_packing FROM order_pembelian op LEFT JOIN order_sudahdikirim os USING(no_order)
        left join temp_pengeluaran tp USING(no_order) LEFT JOIN order_siappacking osp USING(no_order) 
        join customer c using(id_customer) join relasi_orderdanpenjualan rod on(op.no_order=rod.no_order) 
        join penjualan_kainstok pk on(rod.no_penjualan=pk.no_pengeluaran)
        where os.no_order is null and tp.no_order is null and op.status=1 
        AND osp.status<>0 AND osp.status<>1 and op.exspedisi=? and op.no_order=?`,
            [nama_ekspedisi, no_order]
        );
        if (no_order.slice(0, 2) === 'KT')
            dataDetail = await queryDB(`SELECT dp.no_penjualan AS no_order,dp.id_balpenjualan AS notransaksi,
                SUM(dpc.status) AS jml_potong,0.00 AS berat,'DIBAL' AS jenis_packing, IF(tp.no_transaksi IS NULL,
                'Belum di Scan','Sudah di scan') AS stsscan, '-' as lokasi
                FROM a_master_packingkatalog dp
                JOIN a_packing_katalog dpc ON dpc.no_packing=dp.id_balpenjualan
                LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan
                WHERE dp.no_penjualan=?`, [no_order])
        else
            dataDetail = await queryDB(tampilkanBelumScanBarang, [
                no_order,
                no_order,
                no_order,
            ]);
        return response.ok(
            {
                status: "SUKSES",
                pesan: { data: data.rows, detail: dataDetail.rows },
            },
            200,
            res
        );
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.tampilkan_semua = async (req, res) => {
    try {
        let nama_customer, getData
        const { no_order } = req.params;
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


        if (no_order?.slice(0, 2) === "KT") {
            const getnamacustomer = await queryDB(`SELECT id_customer,nama FROM s_penjualan_katalog op join customer c using(id_customer)  where no_penjualan=?`, [no_order]);
            console.log("no order nya", no_order);
            nama_customer = getnamacustomer.rows[0]?.nama;
            checkangkutan = await queryDB(`select ekspedisi as angkutan from s_penjualan_katalog where no_order=?`, [no_order]);
        } else {
            const getnamacustomer = await queryDB(`SELECT id_customer,nama FROM order_pembelian op join customer c using(id_customer)  where no_order=?`, [no_order]);
            console.log("no order nya", no_order);
            nama_customer = getnamacustomer.rows[0]?.nama;
            checkangkutan = await queryDB(`select exspedisi as angkutan from order_pembelian where no_order=?`, [no_order]);
        }
        const validationOrderGabung = await queryDB(
            `select * from  a_group_order ago 
              LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS asal ON asal.no_order=ago.no_order_asal 
              LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS gabung ON gabung.no_order=ago.no_order_gabung 
              where no_order_asal=? AND gabung.no_order IS NULL AND asal.no_order IS NULL`,
            [no_order]
        );
        let order_gabung
        if (validationOrderGabung.rows.length > 0) {
            order_gabung = validationOrderGabung.rows[0].no_order_gabung
        }
        const validationOrderGabung2 = await queryDB(validationOrdeGabung2VerifikasiKodeVerifikasi, [no_order]);
        if (validationOrderGabung2.rows.length > 0) {
            order_gabung = validationOrderGabung2.rows[0].no_order_asal
        }
        // 

        const no_sj = await queryDB(`SELECT no_sj FROM penjualan_kainstok
        JOIN relasi_orderdanpenjualan ON(no_pengeluaran=no_penjualan)
        WHERE no_order=?`, [no_order])
        const pakcing = await queryDB(`select * from order_pembelian where no_order=?`, [no_order]);

        const data = {
            nama_customer: nama_customer,
            no_order: no_order,
            jenis_packing: pakcing.rows[0]?.jenis_packing || '',
            no_sj: no_sj.rows[0]?.no_sj || '',
            ekspedisi: checkangkutan.rows[0]?.angkutan || '',
            detail_roll: getData.rows.map(x => {
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
            }),
        }
        if (order_gabung) {
            data.pesan_order_gabung = `Order ini di gabung dengan order ${order_gabung}`
        }
        console.log(getData.rows, 'ini QUERY')
        return response.ok({ status: "SUKSES", pesan: data }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.tampilkan_belum_di_scan = async (req, res) => {
    try {
        let data
        const { no_order } = req.params;
        if (no_order.slice(0, 2) === 'KT')
            data = await queryDB(`SELECT dp.no_penjualan AS no_order,dp.id_balpenjualan AS notransaksi,
                SUM(dpc.status) AS jml_potong,0.00 AS berat,'DIBAL' AS jenis_packing, IF(tp.no_transaksi IS NULL,
                'Belum di Scan','Sudah di scan') AS stsscan, '-' as lokasi
                FROM a_master_packingkatalog dp
                JOIN a_packing_katalog dpc ON dpc.no_packing=dp.id_balpenjualan
                LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan
                WHERE dp.no_penjualan=?`, [no_order])
        else
            data = await queryDB(tampilkanBelumScanBarang, [
                no_order,
                no_order,
                no_order,
            ]);

        return response.ok({ status: "SUKSES", pesan: data.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.verifikasi_manual = async (req, res) => {
    try {
        verifikasiKainManual({ req, res });
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.check_scan_no_kendaraan = async (req, res) => {
    try {
        const { no_kendaraan } = req.params;
        let getQmuat;
        const checkNoKendaraan = await queryDB(
            `select * from temp_datamuat where no_mobil=?`,
            [no_kendaraan]
        );
        if (checkNoKendaraan.rows.length > 0) {
            getQmuat = await queryDB(qMuat1, [no_kendaraan, no_kendaraan]);
        } else {
            getQmuat = await queryDB(qMuat2, [no_kendaraan]);
        }
        return response.ok({ status: "SUKSES", pesan: getQmuat.rows }, 200, res);
    } catch (e) {
        console.error(e);
        return response.ok(
            {
                status: "GAGAL",
                pesan: `Terjadi Kesalahan!. Error : ${JSON.stringify(e)}`,
            },
            200,
            res
        );
    }
};

exports.data_order_per_ekspedisi = async (req, res) => {
    try {
        const getList = await queryDB(
            `SELECT DISTINCT(exspedisi) AS exspedisi FROM v_siapkirim ORDER BY exspedisi`
        );

        return response.ok({ status: "SUKSES", pesan: getList.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.data_order_per_ekspedisi_by_ekspedisi = async (req, res) => {
    try {
        const { ekspedisi } = req.params;
        // const getList2 = await queryDB(`SELECT * FROM v_siapkirim where no_order=?`, [no_order])
        const getList = await queryDB(
            `SELECT * FROM v_siapkirim where exspedisi=?`,
            [ekspedisi]
        );
        return response.ok({ status: "SUKSES", pesan: getList.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};


exports.checkDeleteKendaraanDilokasi = async (req, res) => {
    try {
        const { no_kendaraan } = req.params
        const check = await queryDB(`select * from temp_muat where no_mobil=?`, [no_kendaraan])
        if (check.rows.length > 0) {
            return response.ok(
                { status: "GAGAL", pesan: 'Data tidak bisa di batalkan karena sudah ada orderan yang di muat untuk mobil tersebut!' },
                200,
                res
            );
        }
        return response.ok(
            { status: "SUKSES", pesan: 'Sukses' },
            200,
            res
        );
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
}

exports.delete_kendaraan_dilokasi = async (req, res) => {
    try {
        const { no_kendaraan } = req.params;
        await queryDB(`delete from temp_datamuat where no_mobil=?`, [no_kendaraan]).then();
        return response.ok(
            { status: "SUKSES", pesan: "berhasil menghapus kendaraan" },
            200,
            res
        );
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.delete_pengeluaran_muat = async (req, res) => {
    try {
        let no_muat;
        const { no_kendaraan, no_order } = req.body;
        if (!no_order) {
            return response.ok(
                { status: "GAGAL", pesan: "nomor order tidak boleh kosong !" },
                200,
                res
            );
        }
        if (!no_kendaraan) {
            return response.ok(
                { status: "GAGAL", pesan: "nomor kendaraan tidak boleh kosong !" },
                200,
                res
            );
        }
        const validationMuatOrder = await queryDB(
            `SELECT * FROM muat_orderan mo join detail_muat dm using(no_muat) 
        left join ongkir ok ON ok.no_transaksi=dm.no_pengeluaran JOIN user u ON u.id_user=mo.id_user  
        WHERE mo.status=0 AND ongkir > 0 and no_mobil=? GROUP BY no_muat`,
            [no_kendaraan]
        );
        if (validationMuatOrder.rows.length > 0) {
            no_muat = validationMuatOrder.rows[0].no_muat;
            const checkDetailMuat = await queryDB(
                `select * from detail_muat where no_pengeluaran=?`,
                [no_order]
            );
            if (checkDetailMuat.rows.length > 0) {
                await queryDB(`delete from detail_muat where no_pengeluaran=?`, [no_order]).then();
            }
            const checkMuatOrderan = await queryDB(
                `select * from muat_orderan where no_muat=?`,
                [no_muat]
            );
            if (checkMuatOrderan.rows.length === 0) {
                await queryDB(`delete from muat_orderan where where no_muat=?`, [no_muat]).then();
            }
            const checkTempPengeluaran = await queryDB(
                `select * from temp_pengeluaran where no_order=?`,
                [no_order]
            );
            if (checkTempPengeluaran.rows.length > 0) {
                await queryDB(`delete from temp_pengeluaran where no_order=?`, [no_order]).then();
            }
            const checkTempMuat2 = await queryDB(
                `select * from temp_muat where no_order=?`,
                [no_order]
            );
            if (checkTempMuat2.rows.length > 0) {
                await queryDB(`delete from temp_muat where no_order=?`, [no_order]).then();
            }
        } else {
            const checkTempPengeluaran = await queryDB(
                `SELECT * FROM temp_pengeluaran WHERE no_order=?`,
                [no_order]
            );
            if (checkTempPengeluaran.rows.length > 0) {
                await queryDB(`delete from temp_pengeluaran where no_order=?`, [no_order]).then();
            }
            const checkTempMuat = await queryDB(
                `select * from temp_muat where no_order=?`,
                [no_order]
            );
            if (checkTempMuat.rows.length > 0) {
                await queryDB(`delete from temp_muat where no_order=?`, [no_order]).then();
            }
        }
        return response.ok(
            { status: "SUKSES", pesan: "muat berhasil dihapus" },
            200,
            res
        );
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
}

exports.selesai_muat = async (req, res) => {
    try {
        const { no_kendaraan } = req.body;
        const { id } = decodedToken(req);
        let no_muat, no_order, supir, angkutan, no_urut, getData;

        const res2 = await queryDB(transaksi_muat1, [no_kendaraan, no_kendaraan]);
        getData = res2;

        if (getData.rows.length === 0) {
            getData = await queryDB(transaksi_muat2, [no_kendaraan, no_kendaraan]);
        }

        if (getData.rows.length === 0) {
            return response.ok({ status: 'GAGAL', pesan: 'Tidak ada data untuk di selesaikan !' }, 200, res);
        }

        const res3 = await queryDB(
            `SELECT * FROM muat_orderan mo join detail_muat dm using(no_muat) 
          left join ongkir ok ON ok.no_transaksi=dm.no_pengeluaran JOIN user u ON u.id_user=mo.id_user  
          WHERE mo.status=0 AND ongkir > 0 and no_mobil=? GROUP BY no_muat`,
            [no_kendaraan]
        );

        if (res3.rows.length > 0) {
            console.log('data > 0');
            no_muat = res3.rows[0].no_muat;
            ongkir = 0;
            const getDataCheck = [];
            console.log(no_muat, no_order, 'rows nya');

            const res4 = await queryDB(`select * from detail_muat where no_muat=?`, [no_muat]);
            let respon = res4.rows;

            for (let i = 0; i < respon.length; i++) {
                const y = respon[i];
                const getData = await queryDB(tampilkanBelumScanBarang, [
                    y.no_order,
                    y.no_order,
                    y.no_order,
                ]);
                getDataCheck.push(getData.rows.length);

                if (getData.rows.length === 0) {
                    await queryDB(`update detail_muat set status=0 where no_pengeluaran=?`, [y.no_order]);
                    const _isRes = await queryDB(`SELECT * FROM order_sudahdikirim  WHERE no_order=?`, [y.no_order]);

                    if (_isRes.rows.length > 0) {
                        const checkData = await queryDB(`select * from order_sudahdikirim where no_order=?`, [y.no_order]);

                        if (checkData.rows.length === 0) {
                            await queryDB(`insert into order_sudahdikirim  values(?,now())`, [y.no_order]);
                        }
                        console.log(no_order);
                    }
                }
            }

            await Promise.all(getDataCheck);

            console.log(getDataCheck.length, getDataCheck);

            if (getDataCheck.filter((x) => x > 0).length > 0) {
                return response.ok({ status: 'GAGAL', pesan: 'Ada order yang belum selesai di scan, silahkan cek kembali!' }, 200, res);
            }

            await queryDB(`select * from temp_datamuat where no_mobil=?`, [no_kendaraan])
                .then(async (checkDataTemp) => {
                    if (checkDataTemp.rows.length > 0) {
                        await queryDB(`delete from temp_datamuat where no_mobil=?`, [no_kendaraan]);
                    }
                })


            await queryDB(`select * from temp_muat where no_mobil=?`, [no_kendaraan])
                .then(async (checkTempMuat) => {
                    if (checkTempMuat.rows.length > 0) {
                        await queryDB(`delete from temp_muat where no_mobil=?`, [no_kendaraan]);
                    }
                })
        } else {
            const getDataCheck = [];
            console.log('data === 0');
            const componentData = await queryDB(`select * from temp_datamuat where no_mobil=?`, [no_kendaraan]);

            if (componentData.rows.length === 0) {
                return response.ok({ status: 'GAGAL', pesan: 'Data sudah di muat, mohon untuk refresh !' }, 200, res);
            }

            supir = componentData.rows[0].supir;
            angkutan = componentData.rows[0].angkutan;

            console.log('=======================================================================');
            console.log(req.body, 'body');

            queryDB(`CALL buatnomormuat_tes(@out_msg);SELECT @out_msg AS no_muat`)
                .then(async (res1) => {
                    const generateNoMuat = res1.rows[1][0].no_muat;
                    queryDB(`insert into muat_orderan values(?,?,?,now(),?,0,?)`, [generateNoMuat, no_kendaraan, supir, id, angkutan])
                        .then(() => {
                            queryDB(`insert into muat_temp values(?,?,?,now(),?,0,?)`, [generateNoMuat, no_kendaraan, supir, id, angkutan])
                                .then(async () => {
                                    const resultRows = await queryDB('select * from temp_muat where no_mobil=?', [no_kendaraan]);
                                    let respon;
                                    // = result.rows
                                    respon = resultRows.rows;

                                    for (let i = 0; i < respon.length; i++) {
                                        const x = respon[i];
                                        const getData = await queryDB(tampilkanBelumScanBarang, [x.no_order, x.no_order, x.no_order]);
                                        getDataCheck.push(getData.rows.length);

                                        if (getData.rows.length === 0) {
                                            const res = await queryDB(`select * from  detail_muat where no_pengeluaran=?`, [x.no_order]);

                                            if (res.rows.length === 0) {
                                                await queryDB(`insert into detail_muat values(0,?,?,0)`, [generateNoMuat, x.no_order]);
                                                await queryDB(`insert into a_cek_muat values(0,?,?,1)`, [generateNoMuat, x.no_order]);

                                                const changeOngkir = await queryDB(`select * from ongkir where no_transaksi=(select no_penjualan from relasi_orderdanpenjualan where no_order=?)`, [x.no_order]);

                                                if (changeOngkir.rows.length > 0) ongkir = changeOngkir.rows[0].ongkir;

                                                const getMaxNourut = await queryDB(`SELECT IFNULL(MAX(no_urut),0) + 1 AS no_urut FROM a_nourut_muat WHERE no_muat=?`, [generateNoMuat]);
                                                no_urut = getMaxNourut.rows[0].no_urut;

                                                await queryDB(`insert into a_nourut_muat values(0,?, ?, ?)`, [parseInt(no_urut), generateNoMuat, x.no_order]);

                                                const checkOrder = await queryDB(`select * from order_sudahdikirim where no_order=?`, [x.no_order]);

                                                if (checkOrder.rows.length === 0) {
                                                    await queryDB(`insert into order_sudahdikirim  values(?,now())`, [x.no_order]);
                                                }
                                            }
                                        }
                                    }

                                    if (getDataCheck.filter((x) => x > 0).length > 0) {
                                        return response.ok({ status: 'GAGAL', pesan: 'Ada order yang belum selesai di scan, silahkan cek kembali!' }, 200, res);
                                    }

                                    await queryDB(`select * from temp_datamuat where no_mobil=?`, [no_kendaraan])
                                        .then(async (checkDataTemp) => {
                                            if (checkDataTemp.rows.length > 0) {
                                                await queryDB(`delete from temp_datamuat where no_mobil=?`, [no_kendaraan]);
                                            }
                                        })

                                    await queryDB(`select * from temp_muat where no_mobil=?`, [no_kendaraan])
                                        .then(async (checkTempMuat) => {
                                            if (checkTempMuat.rows.length > 0) {
                                                await queryDB(`delete from temp_muat where no_mobil=?`, [no_kendaraan]);
                                            }
                                        })

                                });
                        });


                })
        }
        return response.ok({ status: 'SUKSES', pesan: 'Data berhasil di muat' }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: 'GAGAL', pesan: e.message }, 200, res);
    }

};

exports.get_ekspedisi = async (req, res) => {
    try {
        const getData = await queryDB(`SELECT 'DIKIRIM TOKO' AS nama UNION (SELECT nama FROM ekspedisi ) 
        ORDER BY FIELD(nama,'DIKIRIM TOKO') DESC,nama ASC`);
        return response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.check_muat = async (req, res) => {
    try {
        const { no_mobil } = req.params
        const getNoMobil = await queryDB(`select no_mobil from temp_datamuat where no_mobil=?`, [no_mobil])
        if (getNoMobil.rows.length === 0) {
            return response.ok({ status: "GAGAL", pesan: "Nomor Mobil Tidak Terdaftar" }, 200, res);
        }
        return response.ok({ status: "SUKSES", pesan: 'Sukses' }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};


exports.get_angkutan_by_name = async (req, res) => {
    try {
        const { nama_ekspedisi } = req.params;
        const getData = await queryDB(`SELECT nama FROM ekspedisi WHERE nama=?`, [nama_ekspedisi,]);
        res.cookie("nama_angk");
        return response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.registrasi_kendaraan_masuk = async (req, res) => {
    try {
        const { no_mobil, supir, angkutan } = req.body;
        if (!angkutan) {
            return response.ok(
                { status: "GAGAL", pesan: "nama angkutan tidak boleh kosong !" },
                200,
                res
            );
        }
        if (!supir) {
            return response.ok(
                { status: "GAGAL", pesan: "nama supir tidak boleh kosong !" },
                200,
                res
            );
        }
        if (!no_mobil) {
            return response.ok(
                { status: "GAGAL", pesan: "nomor kendaraan tidak boleh kosong !" },
                200,
                res
            );
        }
        const validasiMuatMobil = await queryDB(
            `SELECT * FROM muat_orderan mo JOIN user u ON u.id_user=mo.id_user
        LEFT JOIN (SELECT no_muat,SUM(ongkir) AS ongkir FROM detail_muat dm  JOIN ongkir ok ON ok.no_transaksi=dm.no_pengeluaran GROUP BY no_muat)
        AS ok ON ok.no_muat=mo.no_muat WHERE mo.status=0 AND ongkir > 0 and no_mobil=?`,
            [no_mobil]
        );
        if (validasiMuatMobil.rows.length > 0) {
            return response.ok(
                {
                    status: "GAGAL",
                    pesan: `Data muat untuk mobil ${no_mobil} sudah di selesaikan dan belum di print oleh admin pengiriman`,
                },
                200,
                res
            );
        }
        const validation = await queryDB(
            `select * from temp_datamuat where no_mobil=?`,
            [no_mobil]
        );
        if (validation.rows.length > 0) {
            return response.ok(
                { status: "GAGAL", pesan: `Data muat untuk mobil ${no_mobil} sudah di buat` },
                200,
                res
            );
        }
        const validation2 = await queryDB(
            `select * from muat_orderan where no_mobil=? and status=0`,
            [no_mobil]
        );
        if (validation2.rows.length > 0) {
            return response.ok(
                { status: "GAGAL", pesan: `Data muat untuk mobil ${no_mobil} sudah di buat` },
                200,
                res
            );
        }
        const validasiRegisterMobil = await queryDB(
            `select * from temp_datamuat where no_mobil=? and status=0`,
            [no_mobil]
        );
        if (validasiRegisterMobil.rows.length > 0) {
            return response.ok(
                {
                    status: "GAGAL",
                    pesan: `Data muat untuk mobil ${no_mobil} sudah di buat`,
                },
                200,
                res
            );
        }
        await queryDB(`insert into temp_datamuat values(0,?,?,?,now(),0)`, [no_mobil, supir, angkutan,]).then();
        return response.ok(
            { status: "SUKSES", pesan: "Data berhasil disimpan !" },
            200,
            res
        );
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.ambil_dari_data_lama = async (req, res) => {
    try {
        const getData =
            await queryDB(`SELECT no_mobil,supir,angkutan FROM muat_orderan 
        GROUP BY CONCAT(no_mobil,supir,angkutan) ORDER BY FIELD(angkutan,'DIKIRIM TOKO') DESC`);
        return response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.ambil_dari_data_lama_action = async (req, res) => {
    try {
        const { no_mobil, supir, angkutan } = req.body
        const validation = await queryDB(`SELECT * FROM temp_datamuat WHERE no_mobil=? AND STATUS=0`, [no_mobil])
        if (validation.rows.length > 0) {
            return response.ok(
                {
                    status: "GAGAL",
                    pesan: `Data muat untuk mobil ${no_mobil} sudah di buat`,
                },
                200,
                res
            );
        }
        await queryDB(`insert into temp_datamuat values(0,?,?,?,now(),0)`, [no_mobil, supir, angkutan,]).then();
        return response.ok({ status: "SUKSES", pesan: 'sukses' }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.kendaraan_di_lokasi = async (req, res) => {
    try {
        const { search } = req.params;
        //SELECT no_mobil, angkutan, supir FROM temp_datamuat WHERE STATUS=0
        const getData =
            await queryDB(`SELECT no_mobil,supir,angkutan FROM temp_datamuat WHERE status=0`);
        return response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.verifikasi_data_order_per_ekspedisi = async (req, res) => {
    try {
        const { id } = decodedToken(req);
        const { nomor, kode_verifikasi } = req.body;
        let information,
            noOrder,
            temp,
            resCustomer,
            customer,
            id_customer,
            no_order,
            admin,
            statusData,
            no_penjualan,
            no_faktur,
            jml_order,
            jml_order1,
            jml_order2,
            result_jumlah,
            result,
            status = 'manual';
        noOrder = nomor;
        const kode = parseInt(kode_verifikasi.slice(1))
        console.log(kode)
        if (status?.match(/manual/gm)) {
            if (!kode) {
                return response.ok(
                    { status: "GAGAL", pesan: "Kode verifikasi harus diisi !" },
                    200,
                    res
                );
            }
            const getInformation = await queryDB(
                `SELECT * FROM order_pembelian op JOIN customer c USING(id_customer)
            JOIN a_kodeverifikasi ak USING(no_order)
            WHERE ak.kode=? and no_order=?`,
                [kode, noOrder]
            );
            information = getInformation.rows;
            console.log([kode, information[0]?.kode])
            if (information.length === 0) {
                return response.ok(
                    {
                        status: "GAGAL",
                        pesan: "Kode verifikasi tidak terdaftar di database!",
                    },
                    200,
                    res
                );
            } else {
                if (kode !== information[0].kode) {
                    return response.ok(
                        { status: "GAGAL", pesan: "Kode Verifikasi Salah !" },
                        200,
                        res
                    );
                }
                noOrder = information[0].no_order;
            }
        }
        temp = noOrder?.slice(0, 2);
        const validationOngkir = await queryDB(
            `select * from ongkir where no_transaksi=? and ongkir > 0`,
            [noOrder]
        );
        if (validationOngkir.rows.length > 0) {
            return response.ok(
                {
                    status: "GAGAL",
                    pesan: "Barang ini harus dikeluarkan lewat muat kain!",
                },
                200,
                res
            );
        }
        await queryDB(`insert into a_orderditunggu values(null, ?, ?, ?,now())`, [noOrder, kode, id,]).then();
        const validationAccPerubahan = await queryDB(
            `select * from a_acc_perubahanexspedisi where no_order=?`,
            [noOrder]
        );
        if (validationAccPerubahan.rows.length > 0) {
            const validasiEkspedisi = await queryDB(
                `SELECT * FROM a_acc_perubahanexspedisi where no_order=?
            AND tanggal < (SELECT MAX(tanggal) FROM a_histori_cetakfakturasli WHERE no_order = ? GROUP BY no_order)`,
                [noOrder, noOrder]
            );
            if (validasiEkspedisi.rows.length === 0) {
                return response.ok(
                    {
                        status: "GAGAL",
                        pesan: "Exspedisi belum di sesuai dengan acc admin!",
                    },
                    200,
                    res
                );
            }
        }
        if (temp !== "KT") {
            await queryDB(`insert into n_notifikasi values(0,now(),'4DIGIT','TAKE ORDER',?,'','','',0) `, [noOrder]).then();
            resCustomer = await queryDB(
                `select o.*,c.*,u.nama as admin,nkd.kode AS kode_customer from order_pembelian o join customer c using(id_customer)
            join n_kodeunik_6digit nkd using(id_customer) join user u on o.id_karyawan=u.id_user where no_order=?`,
                [noOrder]
            );
            statusData = "-";
        } else {
            resCustomer = await queryDB(
                `SELECT spk.*,c.*,IFNULL(u.username,'''') AS admin,nkd.kode AS kode_customer  FROM s_penjualan_katalog spk
            JOIN customer c USING(id_customer) left JOIN n_kodeunik_6digit nkd USING(id_customer)
            LEFT JOIN a_userorder_katalog USING(no_penjualan) LEFT JOIN user u USING(id_user)
            where no_penjualan=?`,
                [noOrder]
            );
            statusData = "-";
        }
        if (temp === "KT") {
            const validationPenjualan = await queryDB(
                `select * from s_penjualan_katalog where no_penjualan=?`,
                [noOrder]
            );
            if (validationPenjualan.rows[0].jenis === "ONLINE") {
                const getStatus = await queryDB(
                    `select * from konfirmasi_pembayaran where no_order=? and (status_verifikasi='SUDAH DI VERIFIKASI' or status_verifikasi='SUDAH DI VERIFIKASI SATPAM')`,
                    [noOrder]
                );
                if (getStatus.rows.length === 0) {
                    statusData =
                        "Pembayaran belum terverifikasi, silahkan hubungi kepala toko untuk melakukan konfirmasi";
                }
            }
            no_order = noOrder;
        } else {
            console.log(noOrder);
            const validationOrderPembelian = await queryDB(
                `select * from order_pembelian where no_order=?`,
                [noOrder]
            );
            if (
                validationOrderPembelian.rows[0]?.jenis === "ONLINE" &&
                validationOrderPembelian.rows[0]?.jenis !== "DI BAYAR DI TOKO"
            ) {
                const getKonfirmasi = await queryDB(
                    `select * from konfirmasi_pembayaran where no_order=? and (status_verifikasi='SUDAH DI VERIFIKASI' or status_verifikasi='SUDAH DI VERIFIKASI SATPAM')`,
                    [noOrder]
                );
                if (getKonfirmasi.rows.length === 0) {
                    statusData =
                        "Admin belum melakukan pencetakan faktur untuk order tersebut, silahkan hubungi admin";
                } else {
                    no_penjualan = getKonfirmasi.rows[0].no_penjualan;
                    const getStatus = await queryDB(
                        `SELECT * FROM penjualan_kainstok WHERE no_pengeluaran=? AND status='1'`,
                        [no_penjualan]
                    );
                    if (getStatus.rows.length === 0) {
                        statusData =
                            "Admin belum melakukan pencetakan faktur untuk order tersebut, silahkan hubungi admin";
                    }
                }
            }
            no_order = noOrder;
            no_faktur = no_penjualan;
        }
        const getNoOrderValidation = await queryDB(
            `select no_order from order_sudahdikirim where no_order=?`,
            [noOrder]
        );
        if (getNoOrderValidation.rows.length > 0) {
            statusData = "Data order tersebut sudah selesai dikeluarkan oleh satpam";
        }
        const validationPackingKatalog = await queryDB(
            `select * from a_master_packingkatalog dp join a_packing_katalog dpc ON dpc.no_packing=dp.id_balpenjualan where dp.no_penjualan=?`,
            [noOrder]
        );
        if (validationPackingKatalog.rows.length === 0 && temp === "KT") {
            statusData = "Order tersebut belum di bal";
        }
        if (temp === "KT") {
            resCustomer = await queryDB(
                `select *, '-' as tanggal_lunas from  s_penjualan_katalog spk join customer c USING(id_customer)
            join n_kodeunik_6digit nkd using(id_customer) where no_penjualan=?`,
                [noOrder]
            );
            no_penjualan = "-";
        } else {
            resCustomer = await queryDB(
                `select *, '-' as tanggal_lunas from order_pembelian op join customer c USING(id_customer)
            join n_kodeunik_6digit nkd using(id_customer) where no_order=?`,
                [noOrder]
            );
        }
        const validationOrderGabung = await queryDB(
            `select * from  a_group_order ago 
            LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS asal ON asal.no_order=ago.no_order_asal 
            LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS gabung ON gabung.no_order=ago.no_order_gabung 
            where no_order_asal=? AND gabung.no_order IS NULL AND asal.no_order IS NULL`,
            [noOrder]
        );
        if (validationOrderGabung.rows.length > 0) {
            return response.ok(
                { status: "GAGAL", pesan: "Order ini di gabung dengan order" },
                200,
                res
            );
        } else {
            const validationOrderGabung2 = await queryDB(
                `select * from  a_group_order ago
            LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS asal ON asal.no_order=ago.no_order_asal
            LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS gabung ON gabung.no_order=ago.no_order_gabung
            where no_order_gabung=? AND gabung.no_order IS NULL AND asal.no_order IS NULL`,
                [noOrder]
            );
            if (validationOrderGabung2.rows.length > 0) {
                return response.ok(
                    { status: "GAGAL", pesan: "Order ini di gabung dengan order" },
                    200,
                    res
                );
            }
        }
        if (noOrder?.includes("KT")) {
            const getAdminKatalog = await queryDB(
                `select * from a_userorder_katalog join user using(id_user) where no_penjualan=?`,
                [no_order]
            );
            admin = getAdminKatalog.rows[0].nama;
        } else {
            const getAdmin = await queryDB(
                `select * from order_pembelian op join user on(op.id_karyawan=user.id_user) where no_order=?`,
                [no_order]
            );
            admin = getAdmin.rows[0]?.nama;
        }
        const list_barang = await queryDB(tampilkanSemuaListBarang, [
            noOrder,
            noOrder,
            noOrder,
        ]);
        const progressOrder = await queryDB(
            `SELECT cek_statusprogressorder(?) AS progress_order`,
            [noOrder]
        );
        if (temp === "KT") {
            jml_order2 = await queryDB(
                `SELECT CONCAT(COUNT(sdp.qty), ' of ', COUNT(apk.status)) AS jumlah_rollan, '-' as jumlah_kgan 
                FROM s_detail_penjualankatalog sdp 
                LEFT JOIN a_packing_katalog apk ON(sdp.no_detail=apk.no_detailpenjualan)
                WHERE sdp.no_penjualan=?`,
                [noOrder]
            );
            result_jumlah = jml_order2.rows;
            getTanggalOrder = await queryDB(
                `select tanggal from s_penjualan_katalog where no_penjualan=?`,
                [no_order]
            );
            getTanggalLunas = await queryDB(
                `select tanggal_edit as tanggal_lunas from s_historipenjualan_katalog where no_penjualan=?`,
                [noOrder]
            );
        } else {
            getTanggalOrder = await queryDB(
                `SELECT op.no_order, IFNULL(op.tanggal, spk.tanggal) AS tanggal_order FROM order_pembelian op 
                LEFT JOIN s_penjualan_katalog spk ON(op.no_order=spk.no_order) WHERE op.no_order=?`,
                [no_order]
            );
            getTanggalLunas = await queryDB(
                `select * from v_nprogresorder where no_order=?`,
                [noOrder]
            );
            jml_order = await queryDB(
                `(SELECT CONCAT(COUNT(data_awal), ' of ', COUNT(data_akhir)) AS jumlah_rollan,
                (SELECT CONCAT(COUNT(data_awal), ' of ', COUNT(data_akhir)) AS jumlah_kgan
                FROM (SELECT op.no_order AS data_awal, dtn.no_packing_roll AS data_akhir 
                FROM order_pembelian op JOIN detail_order dor ON(op.no_order=dor.no_order) 
                JOIN perincian_order po USING(no_detail)
                LEFT JOIN detail_packingkain dpk ON(po.no_roll=dpk.no_roll) 
                LEFT JOIN detail_ngebal dtn ON(dpk.no_packing=dtn.no_packing_roll)
                WHERE jenis_packing<>'LANGSUNG KIRIM' AND dor.jenis_quantity='KGAN' AND op.no_order=?) AS data1) as jumlah_kgan
                FROM (SELECT op.no_order AS data_awal, dtn.no_packing_roll AS data_akhir 
                FROM order_pembelian op JOIN detail_order dor ON(op.no_order=dor.no_order) JOIN perincian_order po USING(no_detail)
                LEFT JOIN detail_ngebal dtn ON(po.no_roll=dtn.no_packing_roll)
                WHERE jenis_packing<>'LANGSUNG KIRIM' AND dor.jenis_quantity='ROLLAN' AND op.no_order=?) AS data1)`,
                [noOrder, noOrder]
            );
            result_jumlah = jml_order.rows;
            if (
                jml_order.rows[0].jumlah_rollan === "0 of 0" &&
                jml_order.rows[0].jumlah_kgan === "0 of 0"
            ) {
                jml_order1 = await queryDB(
                    `(SELECT CONCAT(COUNT(data_awal), ' of ', COUNT(data_akhir)) AS jumlah_rollan, (
                    SELECT CONCAT(COUNT(data_awal), ' of ', COUNT(data_akhir)) AS jumlah_kgan
                    FROM (SELECT dor.no_order AS data_awal, po.no_roll AS data_akhir  FROM order_pembelian op JOIN detail_order dor 
                    ON(op.no_order=dor.no_order) JOIN perincian_order po ON(dor.no_detail=po.no_detail)
                    LEFT JOIN detail_packingkain dpk ON(po.no_roll=dpk.no_roll) 
                    WHERE jenis_packing<>'LANGSUNG KIRIM' AND dor.jenis_quantity='KGAN' AND op.no_order=?) AS data2) AS jumlah_kgan
                    FROM (SELECT dor.no_order AS data_awal, po.no_roll AS data_akhir  FROM order_pembelian op JOIN detail_order dor 
                    ON(op.no_order=dor.no_order) JOIN perincian_order po ON(dor.no_detail=po.no_detail)
                    WHERE jenis_packing<>'LANGSUNG KIRIM' AND dor.jenis_quantity='ROLLAN' AND po.status=2 AND op.no_order=?) AS data1)`,
                    [noOrder, noOrder]
                );
                result_jumlah = jml_order1.rows;
            }
        }
        let itemResCustomer = resCustomer.rows[0]?.ekspedisi

        const data = {
            admin: admin ? admin : "",
            status: statusData,
            no_order: noOrder ? noOrder : "",
            ekspedisi:
                itemResCustomer?.ekspedisi || itemResCustomer?.exspedisi
                    ? itemResCustomer?.ekspedisi || itemResCustomer.exspedisi
                    : "",
            customer: itemResCustomer?.nama ? itemResCustomer.nama : "",
            no_faktur: no_penjualan ? no_penjualan : "",
            id_customer: itemResCustomer?.id_customer
                ? resCustomer.rows[0].id_customer
                : "",
            tanggal_order: getTanggalOrder.rows[0]?.tanggal_order
                ? getTanggalOrder.rows[0].tanggal_order
                : getTanggalOrder.rows[0]?.tanggal
                    ? getTanggalOrder.rows[0]?.tanggal
                    : "",
            tanggal_lunas: getTanggalLunas.rows[0]?.tanggal_lunas
                ? getTanggalLunas.rows[0]?.tanggal_lunas
                : "",
            progress_order: noOrder ? progressOrder.rows[0]?.progress_order : "",
            jml_order:
                temp === "KT"
                    ? Buffer.from(result_jumlah[0].jumlah_rollan).toString("latin1")
                    : noOrder
                        ? `${Buffer.from(result_jumlah[0].jumlah_kgan).toString(
                            "latin1"
                        )}(KGAN)    ${Buffer.from(result_jumlah[0].jumlah_rollan).toString(
                            "latin1"
                        )}(ROLLAN)`
                        : "",
            detail_barang: list_barang.rows ? list_barang.rows : [],
        };
        return response.ok({ status: "SUKSES", pesan: data }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};
