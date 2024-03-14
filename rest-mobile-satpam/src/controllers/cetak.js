'use strict';

const tabel = require("../../config/conn/tabel");
var response = require("../../config/res/res");
const { triggerPrint } = require("../lib");
var querystr, queryvalue;

exports.cetakSJ = async function (idKaryawan, noOrder, dari) {
    try {
        const jenis = "SURAT JALAN"
        let status = ""
        let cetak = ""
        let vketerangan = ""
        let statusCek = 1

        await tabel.queryDB(`select no_order from a_histori_cetakfakturasli where no_order='${noOrder}'`, [])
            .then(async onres => {
                if (onres.rows.length > 0) {
                    querystr = `SELECT no_transaksi FROM s_siap_cetak WHERE jenis='SURAT JALAN' AND no_transaksi='${noOrder}'
                    UNION
                    SELECT parameter FROM n_trigger_cetak WHERE jenis='SURAT JALAN' AND parameter LIKE '%${noOrder}%'`
                    queryvalue = []
                    await tabel.queryDB(querystr, queryvalue)
                        .then(async onres => {
                            if (onres.rows.length === 0) {
                                querystr = `select no_order,jenis_pengiriman,exspedisi from order_pembelian where no_order='${noOrder}'`
                                queryvalue = []
                                await tabel.queryDB(querystr, queryvalue)
                                    .then(async onres => {
                                        if (onres.rows.length > 0) {
                                            const jenis_pengiriman = String(onres.rows[0].jenis_pengiriman || "").toUpperCase()
                                            const exspedisi = String(onres.rows[0].exspedisi || "").toUpperCase()

                                            if (exspedisi === "CUSTOMER" && jenis_pengiriman === "DIAMBIL") {
                                                console.log(`Order ${noOrder} tidak tercetak : ${exspedisi} - ${jenis_pengiriman}`)
                                            } else {
                                                let noPenjualan = noOrder
                                                await tabel.queryDB(`select no_penjualan from relasi_orderdanpenjualan where no_order='${noOrder}'`, [])
                                                    .then(onres => onres.rows.length > 0 ? noPenjualan = onres.rows[0].no_penjualan : noPenjualan = noOrder)

                                                const dataPrint = {
                                                    "jenis": jenis, "id_karyawan": idKaryawan, "parameter": { "noOrder": noOrder, "noPenjualan": noPenjualan }
                                                }

                                                console.log("data print ", dataPrint)
                                                try {
                                                    let hasilTrigerPrint = await triggerPrint(dataPrint)
                                                    console.log("Hasil Triger Print Mobile = ", dataPrint, " ### ", hasilTrigerPrint.status)

                                                    if (hasilTrigerPrint.status != 200) {
                                                        cetak = "YA"
                                                        vketerangan = "Print triger gagal"
                                                    } else {
                                                        vketerangan = "SUKSES"
                                                    }
                                                } catch (e) {
                                                    console.log("Terjadi kesalahan = ", tabel.GetError(e))
                                                    cetak = "YA"
                                                    vketerangan = "Print triger tidak menyala"
                                                }

                                                if (cetak === "YA") {
                                                    querystr = `select * from s_siap_cetak where no_transaksi='${noOrder}'`
                                                    queryvalue = []
                                                    await tabel.queryDB(querystr, queryvalue).then(async (hasil) => {
                                                        if (hasil.rows.length == 0) {
                                                            querystr = `insert into s_siap_cetak values (null,'${idKaryawan}','${noOrder}','${jenis}','${vketerangan}',now())`
                                                            queryvalue = []
                                                            await tabel.queryDB(querystr, queryvalue).then()
                                                        }
                                                    })
                                                }
                                            }
                                        } else {
                                            statusCek = 0
                                            vketerangan = "order tidak termasuk dalam kategori penjagaan ekspedisi"
                                        }
                                    })
                            } else {
                                statusCek = 0
                                vketerangan = "faktur sj sudah pernah di cetak"
                            }
                        })
                } else {
                    statusCek = 0
                    vketerangan = "order belum di cetak faktur asli"
                }
            })

        if (statusCek === 0) {
            querystr = `insert into s_siap_cetak_histori(id_karyawan,no_transaksi,jenis,keterangan) values(?,?,?,?)`
            queryvalue = [idKaryawan, noOrder, "SURAT JALAN ELSE", vketerangan]
            await tabel.queryDB(querystr, queryvalue)
                .then()
        }
        return vketerangan
    } catch (e) {
        return tabel.GetError(e)
    }
}

exports.cetak_sj = async function (req, res) {
    try {
        const idKaryawan = req.body.id_karyawan
        const noOrder = req.body.no_order

        const vketerangan = await cetakSJ(idKaryawan, noOrder)

        response.ok({ message: vketerangan }, 200, res)
    } catch (e) {
        response.ok({ message: tabel.GetError(e) }, 301, res)
    }
}