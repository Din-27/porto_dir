const _ = require("lodash");
const ping = require("ping");
const escpos = require("escpos");
const query = require('../utils/query')
escpos.Network = require("escpos-network");
const response = require("../../config/res/res");
const { queryDB, dumpError, decodedToken } = require("../../config/conn/tabel");
const device = new escpos.Network(process.env.IP_THERMAL);
const options = { encoding: "GB18030" /* default */ };
const printer = new escpos.Printer(device, options);
const { triggerPrint } = require("./../lib");


exports.get_nama_satpam = async (req, res) => {
    try {
        const { tanggal_awal, tanggal_akhir } = req.body;
        console.log(req.body)
        const dataSatpam = await queryDB(`CALL sp_get_histori_pengeluaran(?,?,'nama','','','')`, [tanggal_awal, tanggal_akhir])
        const dataOrder = await queryDB(`CALL sp_get_histori_pengeluaran(?,?,'noorder','','','')`, [tanggal_awal, tanggal_akhir])
        const dataPenjualan = await queryDB(`CALL sp_get_histori_pengeluaran(?,?,'nopenjualan','','','')`, [tanggal_awal, tanggal_akhir])

        const allData = {
            nama_satpam: dataSatpam.rows[0].map((x) => x.nama),
            nomor_order: dataOrder.rows[0].map((x) => x.no_order),
            nomor_penjualan: dataPenjualan.rows[0].map((x) => x.no_penjualan),
        };
        return response.ok({ status: "SUKSES", pesan: allData }, 200, res);
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


exports.history_barang_keluar = async (req, res) => {
    try {
        let getData = {}, summary = [], dataOrder = [], jmlItem = [], jmlNama = []
        const { tanggal_awal, tanggal_akhir, nama_satpam, no_order, no_penjualan } = req.body;
        const arrSatpam = nama_satpam !== "" && Array(nama_satpam).length > 0 ? nama_satpam?.replace(/ /gm, '').split(',') : []
        const arrOrder = no_order !== "" && Array(no_order).length > 0 ? no_order?.replace(/ /gm, '').split(',') : []
        const arrPenjualan = no_penjualan !== "" && Array(no_penjualan).length > 0 ? no_penjualan?.replace(/ /gm, '').split(',') : []

        let namaSatpamFix = '', noOrderFix = '', noPenjualanFix = ''
        console.log("arrSatpam", arrSatpam)
        if (arrSatpam.length > 0)
            namaSatpamFix = `"${arrSatpam.join('","')}"`
        if (arrOrder.length > 0)
            noOrderFix = `"${arrOrder.join('","')}"`
        if (arrPenjualan.length > 0)
            noPenjualanFix = `"${arrPenjualan.join('","')}"`

        const queryvalue = [
            tanggal_awal,
            tanggal_akhir,
            namaSatpamFix,
            noOrderFix,
            noPenjualanFix,
        ]
        console.log("queryvalue", queryvalue)
        const detailSummary = await queryDB(`CALL sp_get_histori_pengeluaran(?,?,'jumlahitem',?,?,?)`, queryvalue)
        const summarySatpam = await queryDB(`CALL sp_get_histori_pengeluaran(?,?,'jumlahitemtanggal',?,?,?)`, queryvalue)
        const data = await queryDB(`CALL sp_get_histori_pengeluaran(?,?,'item',?,?,?)`, queryvalue)
        getData.jumlah_satpam = detailSummary.rows[0][0].jmlnama || 0
        getData.jumlah_barang_keluar = detailSummary.rows[0][0].jmlitem || 0
        getData.summary_detail = summarySatpam.rows[0].map(x => {
            return {
                tanggal: x.tanggal,
                nama: x.nama,
                jumlah_barang_keluar: x.jmlitem
            }
        }) || []
        getData.data = data.rows[0] || []

        console.log(summary)
        return response.ok({ status: "SUKSES", pesan: getData }, 200, res);
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

exports.cetak_pengeluaran_barang_bc = async (req, res) => {
    try {
        let { tanggal_awal, tanggal_akhir, nama_satpam, no_order, no_penjualan } =
            req.body;
        let namaSatpam = "",
            noOrder = "",
            noPenjualan = "";
        if (nama_satpam) {
            namaSatpam = `and nama=${nama_satpam}`;
        }
        if (no_order) {
            noOrder = `and dm.no_pengeluaran=${no_order}`;
        }
        if (no_penjualan) {
            noPenjualan = `and no_pengeluaran=${no_penjualan}`;
        }
        const checkingConnected = await ping.promise.probe(process.env.IP_THERMAL);
        if (checkingConnected.alive === false) {
            return response.ok(
                { status: "GAGAL", pesan: "Printer belum di hidupkan !" },
                200,
                res
            );
        }
        const getDataCompany = await queryDB(`select * from data_perusahaan`);
        const pt = getDataCompany.rows[0].nama;
        const alamat = getDataCompany.rows[0].alamat;
        const no_hp = `Telp: ${getDataCompany.rows[0].telepon}`;
        const webUrl = `www.knitto.co.id`;
        const data = await queryDB(
            `SELECT rop.no_penjualan, u.nama, mo.tanggal, dm.no_pengeluaran as no_order, op.kode_verifikasi, c.nama as nama_customer, 
            mo.no_mobil AS no_kendaraan, 
            mo.supir AS nama_supir,'Muat Order' AS sts, 'keluar' as jenis_transaksi, id_user FROM detail_muat dm 
            left JOIN relasi_orderdanpenjualan rop on(dm.no_pengeluaran=rop.no_order) JOIN order_pembelian op on(dm.no_pengeluaran=op.no_order)
            JOIN customer c ON(op.id_customer=c.id_customer) JOIN muat_orderan mo ON(dm.no_muat=mo.no_muat)
            JOIN user u USING(id_user) where dm.status=0 and mo.tanggal BETWEEN ? and ? ${namaSatpam} ${noOrder}
            UNION
            SELECT rop.no_penjualan, u.nama, mo.tanggal, dm.no_pengeluaran as no_order, op.kode_verifikasi, c.nama as nama_customer, 
            '-' AS no_kendaraan, 
            '-' AS nama_supir,'Ambil Langsung' AS sts, 'keluar' as jenis_transaksi, id_user FROM detail_muat dm 
            left JOIN relasi_orderdanpenjualan rop on(dm.no_pengeluaran=rop.no_order) JOIN order_pembelian op on(dm.no_pengeluaran=op.no_order)
            JOIN customer c ON(op.id_customer=c.id_customer) JOIN muat_orderan mo ON(dm.no_muat=mo.no_muat)
            JOIN user u USING(id_user) where dm.status=1 and mo.tanggal BETWEEN ? and ? ${namaSatpam} ${noOrder}
            union
            SELECT ps.no_pengeluaran AS no_penjualan, u.nama, ps.tanggal, '-' AS no_order, '-' as kode_verifikasi,'-' AS nama_customer, 
            '-' AS no_kendaraan,'-' AS nama_supir,
            'Transfer Stock' AS sts, 'keluar' as jenis_transaksi, id_user FROM pengeluaran_satpam_transfer ps 
            JOIN user u USING(id_user) WHERE ps.tanggal BETWEEN ? and ? ${namaSatpam} ${noPenjualan}
            UNION
            SELECT ps.no_pengeluaran AS no_penjualan, u.nama, ps.tanggal, '-' AS no_order, dnb.kode_verifikasi, '-' AS nama_customer, 
            '-' AS no_kendaraan,'-' AS nama_supir,
            'BS Segel' AS sts, 'keluar' as jenis_transaksi, id_user FROM pengeluaran_satpam_bssegel ps 
            JOIN user u USING(id_user) JOIN detail_pengeluaransatpam_bssegel dpb ON(ps.no=dpb.no_pengeluaran)
            JOIN data_ngebal_bssegel dnb ON(dpb.no_transaksi=dnb.no_ngebal) WHERE ps.tanggal BETWEEN ? and ? ${namaSatpam} ${noPenjualan}`,
            [
                tanggal_awal,
                tanggal_akhir,
                tanggal_awal,
                tanggal_akhir,
                tanggal_awal,
                tanggal_akhir,
                tanggal_awal,
                tanggal_akhir,
                tanggal_awal,
                tanggal_akhir,
                tanggal_awal,
                tanggal_akhir,
                tanggal_awal,
                tanggal_akhir,
            ]
        );
        const dataCetak = _(data.rows)
            .groupBy("tanggal")
            .map((item, tanggal) => {
                const nama = _(item)
                    .groupBy("nama")
                    .map((index, element) => {
                        return element;
                    })
                    .value();
                return {
                    tanggal: new Date(tanggal),
                    nama,
                    nama_customer: item.map((item) => item.nama_customer),
                    no_penjualan: item.map((item) => item.no_penjualan),
                    kode_verifikasi: item.map((item) => item.kode_verifikasi),
                    no_kendaraan: item.map((item) => item.no_kendaraan),
                    nama_supir: item.map((item) => item.nama_supir),
                    jenis_transaksi: item.map((item) => item.jenis_transaksi),
                    status: item.map((item) => item.sts),
                    no_order: item.map((item) => item.no_order),
                };
            })
            .value();
        data.rows.map(async (x) => {
            // const checkData = await queryDB(`select * from cetak_pengeluaran_barang_satpam where no_cetak=?`, [x.no_order])
            await queryDB(`insert into cetak_pengeluaran_barang_satpam values(null, ?, ?, now(), ?)`, [x.no_order, x.tanggal, x.id_user]).then();
        });
        device.open(async (err) => {
            await printer
                .font("A")
                .style("B")
                .align("CT")
                //
                .text(pt)
                .font("A")
                .style("NORMAL")
                .text(alamat)
                .font("B")
                .text(no_hp)
                .text(webUrl)
                .drawLine()
                //
                .font("A")
                .style("B")
                .align("CT")
                .text("LAPORAN REKAP PENGELUARAN BARANG SATPAM");
            // this start mapping

            const promises = dataCetak.map(async (item) => {
                const checkItem = await queryDB(
                    `SELECT CONCAT((SELECT cek_jmlitemsiapkirim(?)), ' dari ', (SELECT cek_jmlitemsudahcansatpam(?))) as hasil_scan`,
                    [item.no_order[0], item.no_order[0]]
                );
                await printer
                    .align("LT")
                    .font("B")
                    .text(" ")
                    .style("NORMAL")
                    .text(
                        ` Tanggal          : ${item.tanggal
                            .toLocaleDateString()
                            .replace(/\//g, "-")}`
                    )
                    .text(` Nama Satpam      : ${item.nama[0]}`)
                    .text(" ")
                    //
                    .font("B")
                    .align("LT")
                    .style("B");
                const files = checkItem.rows.map(async (itemCheck) => {
                    await printer.tableCustom(
                        [
                            {
                                text: `${item.no_penjualan[0]}`,
                                align: "LEFT",
                                width: 0.33,
                                style: "B",
                            },
                            {
                                text: `${item.nama_customer[0]}`,
                                align: "CENTER",
                                width: 0.33,
                                style: "B",
                            },
                            {
                                text: `${itemCheck.hasil_scan}`,
                                align: "RIGHT",
                                width: 0.33,
                                style: "B",
                            },
                        ],
                        { encoding: "cp857", size: [1, 1] } // Optional
                    );
                });
                await Promise.all(files);
                await printer
                    .style("NORMAL")
                    .font("B")
                    .align("LT")
                    .table([
                        `${item.kode_verifikasi[0]}`,
                        `${item.tanggal.toLocaleTimeString().slice(0, 8)}`,
                        `${item.status[0]} ${item.no_kendaraan[0] ? item.no_kendaraan[0] : " "} - ${item.nama_supir[0] ? item.nama_supir[0] : " "
                        }  `,
                        `${item.jenis_transaksi[0]}`,
                    ])
                    .drawLine();
            });
            await Promise.all(promises);
            await printer.cut().close();
        });
        return response.ok(
            { status: "SUKSES", pesan: `Data berhasil di cetak` },
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

exports.get_data_cetak_pengeluaran_barang = async (req, res) => {
    try {
        const { tanggal_awal, tanggal_akhir } = req.body;
        const data = await queryDB(
            `CALL sp_get_histori_pengeluaran(?,?,'historicetak','','','') `,
            [tanggal_awal, tanggal_akhir]
        );
        return response.ok({ status: "SUKSES", pesan: data.rows[0] }, 200, res);
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

exports.cetak_ulang_pengeluaran_barang = async (req, res) => {
    try {
        let { tanggal, nama_satpam, no_order, no_penjualan } = req.body;
        let namaSatpam = "",
            noOrder = "",
            noPenjualan = "";
        if (nama_satpam) {
            namaSatpam = `and nama=${nama_satpam}`;
        }
        if (no_order) {
            noOrder = `and dm.no_pengeluaran=${no_order}`;
        }
        if (no_penjualan) {
            noPenjualan = `and no_pengeluaran=${no_penjualan}`;
        }
        const getDataCompany = await queryDB(`select * from data_perusahaan`);
        const pt = getDataCompany.rows[0].nama;
        const alamat = getDataCompany.rows[0].alamat;
        const no_hp = `Telp: ${getDataCompany.rows[0].telepon}`;
        const webUrl = `www.knitto.co.id`;
        const data = await queryDB(
            `SELECT rop.no_penjualan, u.nama, mo.tanggal, dm.no_pengeluaran as no_order, op.kode_verifikasi, c.nama as nama_customer, 
            mo.no_mobil AS no_kendaraan, 
            mo.supir AS nama_supir,'Muat Order' AS sts, 'keluar' as jenis_transaksi, id_user FROM detail_muat dm 
            left JOIN relasi_orderdanpenjualan rop on(dm.no_pengeluaran=rop.no_order) JOIN order_pembelian op on(dm.no_pengeluaran=op.no_order)
            JOIN customer c ON(op.id_customer=c.id_customer) JOIN muat_orderan mo ON(dm.no_muat=mo.no_muat)
            JOIN user u USING(id_user) where dm.status=0 and date(mo.tanggal)=? ${namaSatpam} ${noOrder}
            UNION
            SELECT rop.no_penjualan, u.nama, mo.tanggal, dm.no_pengeluaran as no_order, op.kode_verifikasi, c.nama as nama_customer, 
            '-' AS no_kendaraan, 
            '-' AS nama_supir,'Ambil Langsung' AS sts, 'keluar' as jenis_transaksi, id_user FROM detail_muat dm 
            left JOIN relasi_orderdanpenjualan rop on(dm.no_pengeluaran=rop.no_order) JOIN order_pembelian op on(dm.no_pengeluaran=op.no_order)
            JOIN customer c ON(op.id_customer=c.id_customer) JOIN muat_orderan mo ON(dm.no_muat=mo.no_muat)
            JOIN user u USING(id_user) where dm.status=1 and date(mo.tanggal)=? ${namaSatpam} ${noOrder}
            union
            SELECT ps.no_pengeluaran AS no_penjualan, u.nama, ps.tanggal, '-' AS no_order, '-' as kode_verifikasi,'-' AS nama_customer, 
            '-' AS no_kendaraan,'-' AS nama_supir,
            'Transfer Stock' AS sts, 'keluar' as jenis_transaksi, id_user FROM pengeluaran_satpam_transfer ps 
            JOIN user u USING(id_user) WHERE date(ps.tanggal)=? ${namaSatpam} ${noPenjualan}
            UNION
            SELECT ps.no_pengeluaran AS no_penjualan, u.nama, ps.tanggal, '-' AS no_order, dnb.kode_verifikasi, '-' AS nama_customer, 
            '-' AS no_kendaraan,'-' AS nama_supir,
            'BS Segel' AS sts, 'keluar' as jenis_transaksi, id_user FROM pengeluaran_satpam_bssegel ps 
            JOIN user u USING(id_user) JOIN detail_pengeluaransatpam_bssegel dpb ON(ps.no=dpb.no_pengeluaran)
            JOIN data_ngebal_bssegel dnb ON(dpb.no_transaksi=dnb.no_ngebal) WHERE date(ps.tanggal)=? ${namaSatpam} ${noPenjualan}`,
            [tanggal, tanggal, tanggal, tanggal, tanggal, tanggal, tanggal]
        );
        const dataCetak = _(data.rows)
            .groupBy("tanggal")
            .map((item, tanggal) => {
                const nama = _(item)
                    .groupBy("nama")
                    .map((index, element) => {
                        return element;
                    })
                    .value();
                return {
                    tanggal: new Date(tanggal),
                    nama,
                    nama_customer: item.map((item) => item.nama_customer),
                    no_penjualan: item.map((item) => item.no_penjualan),
                    kode_verifikasi: item.map((item) => item.kode_verifikasi),
                    no_kendaraan: item.map((item) => item.no_kendaraan),
                    nama_supir: item.map((item) => item.nama_supir),
                    jenis_transaksi: item.map((item) => item.jenis_transaksi),
                    status: item.map((item) => item.sts),
                    no_order: item.map((item) => item.no_order),
                };
            })
            .value();
        const checkingConnected = await ping.promise.probe(hosts[0]);
        if (checkingConnected.alive === false) {
            return response.ok(
                { status: "GAGAL", pesan: "Printer belum di hidupkan !" },
                200,
                res
            );
        }
        device.open(async (err) => {
            await printer
                .font("A")
                .style("B")
                .align("CT")
                //
                .text(pt)
                .font("A")
                .style("NORMAL")
                .text(alamat)
                .font("B")
                .text(no_hp)
                .text(webUrl)
                .drawLine()
                //
                .font("A")
                .style("B")
                .align("CT")
                .text("LAPORAN REKAP PENGELUARAN BARANG SATPAM");
            // this start mapping

            const promises = dataCetak.map(async (item) => {
                const checkItem = await queryDB(
                    `SELECT CONCAT((SELECT cek_jmlitemsiapkirim(?)), ' dari ', (SELECT cek_jmlitemsudahcansatpam(?))) as hasil_scan`,
                    [item.no_order[0], item.no_order[0]]
                );
                await printer
                    .align("LT")
                    .font("B")
                    .text(" ")
                    .style("NORMAL")
                    .text(
                        ` Tanggal          : ${item.tanggal
                            .toLocaleDateString()
                            .replace(/\//g, "-")}`
                    )
                    .text(` Nama Satpam      : ${item.nama[0]}`)
                    .text(" ")
                    //
                    .font("B")
                    .align("LT")
                    .style("B");
                const files = checkItem.rows.map(async (itemCheck) => {
                    await printer.tableCustom(
                        [
                            {
                                text: `${item.no_penjualan[0]}`,
                                align: "LEFT",
                                width: 0.33,
                                style: "B",
                            },
                            {
                                text: `${item.nama_customer[0]}`,
                                align: "CENTER",
                                width: 0.33,
                                style: "B",
                            },
                            {
                                text: `${itemCheck.hasil_scan}`,
                                align: "RIGHT",
                                width: 0.33,
                                style: "B",
                            },
                        ],
                        { encoding: "cp857", size: [1, 1] } // Optional
                    );
                });
                await Promise.all(files);
                await printer
                    .style("NORMAL")
                    .font("B")
                    .align("LT")
                    .table([
                        `${item.kode_verifikasi[0]}`,
                        `${item.tanggal.toLocaleTimeString().slice(0, 8)}`,
                        `${item.status[0]} ${item.no_kendaraan[0] ? item.no_kendaraan[0] : " "} - ${item.nama_supir[0] ? item.nama_supir[0] : " "
                        }  `,
                        `${item.jenis_transaksi[0]}`,
                    ])
                    .drawLine();
            });
            await Promise.all(promises);
            await printer.cut().close();
        });
        return response.ok(
            { status: "SUKSES", pesan: `Data berhasil di cetak ulang` },
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

exports.cetak_pengeluaran_barang = async (req, res) => {
    try {
        const { id } = decodedToken(req);
        let { tanggal_awal, tanggal_akhir, nama_satpam, nomor_order, nomor_penjualan, tipe_cetak, id_karyawan } = req.body;
        console.log(req.body)
        if (!tanggal_akhir) tanggal_akhir = ''
        if (!nama_satpam) nama_satpam = ''
        if (!nomor_order) nomor_order = ''
        if (!nomor_penjualan) nomor_penjualan = ''

        // if(typeof nama_satpam === 'object' && JSON.parse(nama_satpam.length) > 0){
        //     nama_satpam = nama_satpam[0]
        // }else{
        //     nama_satpam = ''
        // }
        // if (typeof nomor_order === 'object' && JSON.parse(nomor_order.length) > 0){
        //     nomor_order = nomor_order[0]
        // }else{
        //     nomor_order = ''
        // }
        // if (typeof nomor_penjualan === 'object' && JSON.parse(nomor_penjualan.length) > 0){
        //     nomor_penjualan = nomor_penjualan[0]
        // }else{
        //     nomor_penjualan = ''
        // }

        const dataPrint = {
            "jenis": "PENGELUARAN BARANG", "id_karyawan": id,
            "parameter": { "tanggal_awal": tanggal_awal, "tanggal_akhir": tanggal_akhir, "nama_satpam": nama_satpam, "no_order": nomor_order, "no_penjualan": nomor_penjualan, "tipe_cetak": tipe_cetak, "id_karyawan": id }
        }
        let responPrint = await triggerPrint(dataPrint)
        if (responPrint.status == 200) {
            responPrint.values.message = "Data berhasil di cetak"
        }
        response.ok({ message: responPrint.values.message }, responPrint.status, res);
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