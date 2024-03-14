const { Utilities } = require('../utils')
const filteringValidation = require("../utils/filteringValidation")
const insertingToTable = require("../utils/insertingToTable")
const validationFile = require("../utils/validationFile")
const { queryDB, decodedToken } = require("../conn/tabel")
const response = require('../res/res')
const _ = require('lodash')

exports.checkWarna = async (req, res) => {
    try {
        let message, status, warna = [], karung = [], dataKarung, resultDataKarung = []
        // const id_karyawan = 121
        const filenameExcel = req.file.fieldname
        console.log(req.file.mimetype)
        if (req.file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && req.file.mimetype !== 'application/vnd.ms-excel') {
            return response.ok('format file tidak didukung !', 400, res)
        }
        const convertJson = new Utilities(filenameExcel)
        const dataExcel = await convertJson.handleExcelToJson()
        const converter = o => Object.fromEntries(
            Object.entries(o).map(([indexAwal, indekAkhir]) => [indexAwal.replace(/ /gm, '_').toLowerCase(), indekAkhir])
        )
        const resultCoonverter = dataExcel.map(converter)
        const msg = validationFile(resultCoonverter)
        if (msg !== 'sukses') {
            message = msg
            status = 401
        } else {
            for (let i = 0; i < resultCoonverter.length; i++) {
                dataWarna = await queryDB(`SELECT IF(COUNT(jenis_warna) > 0,jenis_warna, 'kosong') AS warna FROM warna WHERE jenis_warna=?`, [resultCoonverter[i].warna])
                warna.push(dataWarna.rows[0].warna)
                dataKarung = await queryDB(`SELECT IF(status_karung='proses','GAGAL', 'SUKSES') AS checking, no_karung, SUM(IFNULL(dks.berat, 0)) AS berat, '1' AS tahap_sorting, 
                no_lokasi_tahap1 AS lokasi FROM data_karung_sortir LEFT JOIN detail_karung_sortir dks USING(no_karung)
                WHERE no_tahap1=? AND no_lokasi_tahap1=? GROUP BY no_karung`,
                    [resultCoonverter[i].nomor_tahap_1, resultCoonverter[i].nomor_lokasi_tahap_1])
                // console.log([resultCoonverter[i].nomor_tahap_1, resultCoonverter[i].nomor_lokasi_tahap_1])
                karung.push(...dataKarung.rows)
            }
            // for (let i = 0; i < resultCoonverter.length; i++) {

            //     // karung.push(dataKarung.rows[0].checking)
            // }


            // await Promise.all(warna)
            console.log(karung, 'ini karung')


            const data = resultCoonverter.map(async (item, index) => {
                const filterWarna = warna.filter(x => x === 'kosong')
                console.log(filterWarna, 'ini filter warna')
                message = 'Pastikan Anda meng-upload file yang sesuai dengan template'
                status = 401
                if (filterWarna.length === 0) {
                    message = warna
                    status = 200
                }
            })
        }
        return res.status(status).send({ status: warna, values: message })
    } catch (error) {
        console.log(error)
        response.ok(error, 401, res)
    }
}

exports.handleInsertExcelData = async (req, res) => {
    try {
        let message, status = 200, karung = [], dataKarung, resultDataKarung = []
        const id_karyawan = decodedToken(req).id
        const filenameExcel = req.file.fieldname
        console.log(req.file.mimetype)
        if (req.file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && req.file.mimetype !== 'application/vnd.ms-excel') {
            return response.ok('format file tidak didukung !', 400, res)
        }
        const convertJson = new Utilities(filenameExcel)
        let dataExcel = await convertJson.handleExcelToJson(0)
        const converter = o => Object.fromEntries(
            Object.entries(o).map(([indexAwal, indekAkhir]) => [indexAwal.replace(/ /gm, '_').toLowerCase(), indekAkhir])
        )
        let resultCoonverter = dataExcel.map(converter)
        let msg = validationFile(resultCoonverter)

        if (msg !== 'sukses') {
            dataExcel = await convertJson.handleExcelToJson(1)
            resultCoonverter = dataExcel.map(converter)
            msg = validationFile(resultCoonverter)
        }

        if (msg !== 'sukses') {
            message = msg
            status = 401
        } else {
            for (let i = 0; i < resultCoonverter.length; i++) {
                const cekKain = await queryDB(`SELECT nama_kain FROM kain WHERE nama_kain=?`, [resultCoonverter[i].jenis_kain])
                const cekWarna = await queryDB(`SELECT jenis_warna FROM warna WHERE jenis_warna=?`, [resultCoonverter[i].warna])

                if (cekKain.rows.length === 0) {
                    message = `${resultCoonverter[i].jenis_kain} tidak terdaftar pada database`
                    status = 401
                    break
                } else if (cekWarna.rows.length === 0) {
                    message = `${resultCoonverter[i].warna} tidak terdaftar pada database`
                    status = 401
                    break
                }

                dataKarung = await queryDB(`SELECT IF(status_karung='proses','GAGAL', 'SUKSES') AS checking, no_karung, SUM(IFNULL(dks.berat, 0)) AS berat, '1' AS tahap_sorting, 
                no_lokasi_tahap1 AS lokasi FROM data_karung_sortir LEFT JOIN detail_karung_sortir dks USING(no_karung)
                WHERE no_tahap1=? AND no_lokasi_tahap1=? GROUP BY no_karung`,
                    [resultCoonverter[i].nomor_tahap_1, resultCoonverter[i].nomor_lokasi_tahap_1])
                // console.log([resultCoonverter[i].nomor_tahap_1, resultCoonverter[i].nomor_lokasi_tahap_1])
                karung.push(...dataKarung.rows)
            }

            if (status === 200) {
                const filterKarung = karung.filter(x => x.checking === 'GAGAL')
                if (filterKarung.length > 0) {
                    status = 301
                    message = {
                        message: 'Terdapat Karung yang masih dalam Proses',
                        data: _.uniqBy(filterKarung, 'no_karung')
                            .map(item => {
                                return {
                                    no_karung: item.no_karung,
                                    berat: item.berat,
                                    tahap_sorting: item.tahap_sorting,
                                    lokasi: item.lokasi
                                }
                            })
                    }
                }
            }

            if (status === 200) {
                if (resultCoonverter.length > 0) {
                    await queryDB('replace into master_data_sku_history select * from master_data_sku;')
                    await queryDB('DELETE FROM master_data_sku;')

                    for (let item of resultCoonverter) {
                        await insertingToTable('master_data_sku', item, id_karyawan)
                        const getData = await queryDB(`SELECT id, no_sku, IFNULL(nama_kain, '-') AS jenis_kain, 
                    IFNULL(jenis_warna, '-') AS warna, IFNULL(nilai_bawah, '-') AS nilai_bawah, IFNULL(nilai_atas, '-') AS nilai_atas, IFNULL(no_tahap1, '-') AS no_tahap1, 
                    IFNULL(no_tahap2, '-') AS no_tahap2, IFNULL(no_tahap3, '-') AS no_tahap3, IFNULL(no_lokasi_tahap1, '-') AS no_lokasi_tahap1, IFNULL(kode_verifikasi_tahap1, '-') AS kode_verifikasi_tahap1,IFNULL(no_lokasi_tahap2, '-') AS no_lokasi_tahap2,IFNULL(kode_verifikasi_tahap2, '-') AS kode_verifikasi_tahap2, 
                    IFNULL(group_lokasi_tahap2, '-') AS group_lokasi_tahap2,
                    IFNULL(no_lokasi_tahap3, '-') AS no_lokasi_tahap3,IFNULL(kode_verifikasi_tahap3, '-') AS kode_verifikasi_tahap3, IFNULL(group_lokasi_tahap3, '-') AS group_lokasi_tahap3, IFNULL(nomor_area, '-') AS nomor_area,
                    CreatedAt as tanggal_import, nama as user_import, 'AKTIF' as status FROM master_data_sku LEFT JOIN kain k USING(id_kain) 
                    LEFT JOIN warna w USING (id_warna) join user using(id_user) ORDER BY no_sku ASC`)
                        message = getData.rows
                        status = 200
                    }
                }
            }
        }
        return res.status(status).send({ status: status, values: message })
    } catch (error) {
        console.log(error)
        response.ok(error, 401, res)
    }
}

exports.handleEksportExcelData = async (req, res) => {
    try {
        let message, sts
        const getData = await queryDB(`SELECT no_sku, IFNULL(nama_kain, '-') AS jenis_kain, 
        IFNULL(jenis_warna, '-') AS warna, IFNULL(nilai_bawah, '-') AS nilai_bawah, IFNULL(nilai_atas, '-') AS nilai_atas, IFNULL(no_tahap1, '-') AS no_tahap1, 
        IFNULL(no_tahap2, '-')  AS no_tahap2, IFNULL(no_tahap3, '-') AS no_tahap3, IFNULL(no_lokasi_tahap1, '-') AS no_lokasi_tahap1,IFNULL(kode_verifikasi_tahap1, '-') AS kode_nomor_lokasi_tahap1, IFNULL(no_lokasi_tahap2, '-') AS no_lokasi_tahap2, IFNULL(kode_verifikasi_tahap2, '-') AS kode_nomor_lokasi_tahap2,
        IFNULL(group_lokasi_tahap2, '-') AS group_lokasi_tahap2,
        IFNULL(no_lokasi_tahap3, '-') AS no_lokasi_tahap3,IFNULL(kode_verifikasi_tahap3, '-') AS kode_nomor_lokasi_tahap3, IFNULL(group_lokasi_tahap3, '-') AS group_lokasi_tahap3, IFNULL(nomor_area, '-') AS nomor_area
        FROM master_data_sku LEFT JOIN kain k USING(id_kain) 
        LEFT JOIN warna w USING (id_warna) join user using(id_user) ORDER BY no_sku ASC`)

        let resultConvert = []
        let msg = 'sukses'
        if (getData.rows.length === 0) {
            let addItems = []
            for (let items of getData.fields) {
                const item = items.name
                    .replace(/_/gm, ' ')
                    .replace('no ', 'nomor ')
                    .replace(/1/gm, ' 1')
                    .replace(/2/gm, ' 2')
                    .replace(/3/gm, ' 3')
                    .replace(/group/gm, 'grup')
                    .toUpperCase()
                addItems[item] = ''
            }
            resultConvert[0] = { ...addItems }
        } else {
            const converter = o => Object.fromEntries(
                Object.entries(o).map(([indexAwal, indekAkhir]) => [
                    indexAwal
                        .replace(/_/gm, ' ')
                        .replace('no ', 'nomor ')
                        .replace(/1/gm, ' 1')
                        .replace(/2/gm, ' 2')
                        .replace(/3/gm, ' 3')
                        .replace(/group/gm, 'grup')
                        .toUpperCase(), indekAkhir])
            )
            resultConvert = getData.rows.map(converter)
            msg = filteringValidation(getData.rows)
        }
        message = { status: 'GAGAL', message: msg }, sts = 301
        if (msg === 'sukses') {
            const convertJson = new Utilities('')
            convertJson.handleJsonToExcel(resultConvert, 'export_data')
            message = { status: 'SUKSES', filename: `xlsx/export_data.xlsx` }, sts = 200
        }
        return res.status(sts).send(message);
    } catch (error) {
        console.log(error)
        response.ok(error, 401, res)
    }
}

exports.getExcelData = async (req, res) => {
    try {
        let message, status
        const getData = await queryDB(`SELECT id, no_sku, IFNULL(nama_kain, '-') AS jenis_kain, 
        IFNULL(jenis_warna, '-') AS warna, IFNULL(nilai_bawah, '-') AS nilai_bawah, IFNULL(nilai_atas, '-') AS nilai_atas, IFNULL(no_tahap1, '-') AS no_tahap1, 
        IFNULL(no_tahap2, '-') AS no_tahap2, IFNULL(no_tahap3, '-') AS no_tahap3, IFNULL(no_lokasi_tahap1, '-') AS no_lokasi_tahap1, IFNULL(kode_verifikasi_tahap1, '-') AS kode_verifikasi_tahap1, IFNULL(no_lokasi_tahap2, '-') AS no_lokasi_tahap2, IFNULL(kode_verifikasi_tahap2, '-') AS kode_verifikasi_tahap2,
        IFNULL(group_lokasi_tahap2, '-') AS group_lokasi_tahap2,
        IFNULL(no_lokasi_tahap3, '-') AS no_lokasi_tahap3,IFNULL(kode_verifikasi_tahap3, '-') AS kode_verifikasi_tahap3, IFNULL(group_lokasi_tahap3, '-') AS group_lokasi_tahap3, IFNULL(nomor_area, '-') AS nomor_area,
        CreatedAt as tanggal_import, nama as user_import, 'AKTIF' as status FROM master_data_sku LEFT JOIN kain k USING(id_kain) 
        LEFT JOIN warna w USING (id_warna) join user using(id_user) ORDER BY no_sku ASC`)
        const converter = o => Object.fromEntries(
            Object.entries(o).map(([indexAwal, indekAkhir]) => [indexAwal.replace(/ /gm, '_').toLowerCase().replace(/__/gm, '_'), indekAkhir])
        )
        const resultCoonverter = getData.rows.map(converter)
        response.ok(resultCoonverter, 200, res)
    } catch (error) {
        console.log(error)
        response.ok(error, 401, res)
    }
}

exports.getHistoryData = async (req, res) => {
    try {
        // let option = 'ORDER BY CreatedAt,id ASC'
        const { tanggal_awal, tanggal_akhir } = req.query
        // if (tanggal_awal && tanggal_akhir) {
        //     option = ` WHERE date(CreatedAt) BETWEEN '${tanggal_awal}' AND '${tanggal_akhir}' ORDER BY status ASC`
        // }
        // console.log(option)
        const getData = await queryDB(`SELECT id, no_sku, IFNULL(nama_kain, '-') AS jenis_kain, 
        IFNULL(jenis_warna, '-') AS warna, IFNULL(nilai_bawah, '-') AS nilai_bawah, IFNULL(nilai_atas, '-') AS nilai_atas, IFNULL(no_tahap1, '-') AS no_tahap1, 
        IFNULL(no_tahap2, '-') AS no_tahap2, IFNULL(no_tahap3, '-') AS no_tahap3, IFNULL(no_lokasi_tahap1, '-') AS no_lokasi_tahap1,IFNULL(kode_verifikasi_tahap1, '-') AS kode_verifikasi_tahap1, IFNULL(no_lokasi_tahap2, '-') AS no_lokasi_tahap2, IFNULL(kode_verifikasi_tahap2, '-') AS kode_verifikasi_tahap2,
        IFNULL(group_lokasi_tahap2, '-') AS group_lokasi_tahap2,
        IFNULL(no_lokasi_tahap3, '-') AS no_lokasi_tahap3, IFNULL(kode_verifikasi_tahap3, '-') AS kode_verifikasi_tahap3,IFNULL(group_lokasi_tahap3, '-') AS group_lokasi_tahap3, IFNULL(nomor_area, '-') AS nomor_area,
        CreatedAt AS tanggal_import, nama AS user_import, IF(CreatedAt=(SELECT MAX(CreatedAt) FROM master_data_sku_history), 'AKTIF', 'TIDAK AKTIF')  AS status FROM master_data_sku_history LEFT JOIN kain k USING(id_kain) 
        LEFT JOIN warna w USING (id_warna) JOIN user USING(id_user)`)
        response.ok(getData.rows, 200, res)
    } catch (error) {
        console.log(error)
        response.ok(error, 401, res)
    }
}

// exports.handleDecodedToken = async (req, res) => {
//     try {
//         let msg = 'Ganti cabang sukses !', stsText = 'SUKSES', sts = 200
//         const { username } = decodedToken(req)
//         const GET_USER = await queryDB(
//             `SELECT * FROM user WHERE username=? `,
//             [username]
//         );
//         if (GET_USER.rows.length === 0) {
//             msg = "User tidak ditemukan di cabang ini !", sts = 301, stsText = "GAGAL"
//         }
//         return response.ok({ status: stsText, pesan: msg }, sts, res);
//     } catch (error) {
//         console.log(error)
//         response.ok(error, 401, res)
//     }
// }