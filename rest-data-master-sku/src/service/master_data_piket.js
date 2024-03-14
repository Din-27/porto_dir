const { decodedToken, queryDB } = require("../conn/tabel")
const insertingToTablePiket = require("../utils/insertingToTablePiket")
const validationFilePiket = require("../utils/validationFilePiket")
const response = require('../res/res');
const { Utilities } = require("../utils");
const filteringValidationPiket = require("../utils/filteringValidationPiket");


exports.importFile = async (req, res) => {
    try {
        let message = 'sukses', statusCode = 200, status = 200
        const id_karyawan = decodedToken(req).id
        const filenameExcel = req.file.fieldname
        console.log(req.file.mimetype)
        if (req.file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && req.file.mimetype !== 'application/vnd.ms-excel') {
            return res.status(401).send({ status: 401, values: 'format file tidak didukung !' })
        }

        const convertJson = new Utilities(filenameExcel)
        // let checkDataExcel = await convertJson.handleExcelToJson(0) convertXLSXToJSON
        let checkDataExcel = await convertJson.convertXLSXToJSON()
        // return res.send(checkDataExcel)
        const converter = o => Object.fromEntries(
            Object.entries(o).map(([indexAwal, indekAkhir]) => [indexAwal.replace(/\s+$/gm, '').replace(/ /gm, '_').toLowerCase(), indekAkhir])
        )
        let resultCoonverter = checkDataExcel.map(converter)
        // console.log(resultCoonverter.slice(1));
        // return res.send(resultCoonverter)

        let msg = validationFilePiket(resultCoonverter.slice(1))

        if (msg !== 'sukses') {
            return res.status(401).send({ status: 401, values: { message: msg } })
        }

        for (let item of resultCoonverter) {
            const cekKain = await queryDB(`SELECT nama_kain FROM kain WHERE nama_kain=?`, [item.jenis_kain])

            if (cekKain.rows.length === 0) {

                const idxkainNull = resultCoonverter.findIndex(x => x.jenis_kain === item.jenis_kain)
                message = `Terdapat Kain yang tidak terdaftar pada sistem (Sheet 1 Line ${idxkainNull + 3})`
                statusCode = 401
                status = 301
                break
            }
        }

        if (message === 'sukses') {
            // console.log(resultCoonverter.length);
            if (resultCoonverter.length > 0) {
                await queryDB('replace into master_data_piket_history select * from master_data_piket;')
                await queryDB('DELETE FROM master_data_piket;')
                for (let item of resultCoonverter) {
                    await insertingToTablePiket('master_data_piket', item, id_karyawan)
                }
            }
            const data = await queryDB(`SELECT jenis_kain, berat_bawah, berat_atas,kode,rak_tujuan,
            jenis_plastik,metode_lipat, created_at AS tanggal_import, 'AKTIF' AS sts, u.nama 
            FROM master_data_piket mdp JOIN user u USING(id_user)`)
            message = data.rows
            statusCode = 200
            status = 200
        }
        return res.status(statusCode).send({
            "status": status,
            "values": {
                message
            }
        })
    } catch (error) {
        console.log(error)
        response.ok(error, 401, res)
    }
}

exports.getExcelDataPiket = async (req, res) => {
    try {
        const getData = await queryDB(`SELECT jenis_kain, berat_bawah, berat_atas,kode,rak_tujuan,
        jenis_plastik,metode_lipat, created_at AS tanggal_import, 'AKTIF' AS sts, u.nama 
        FROM master_data_piket mdp JOIN user u USING(id_user)`)

        response.ok(getData.rows, 200, res)
    } catch (error) {
        console.log(error)
        response.ok(error, 401, res)
    }
}

exports.handleEksportExcelDataPiket = async (req, res) => {
    try {
        let message, sts, resultConvert = []
        const getData = await queryDB(`SELECT jenis_kain, berat_bawah, berat_atas,kode,rak_tujuan,
        jenis_plastik,metode_lipat
        FROM master_data_piket mdp JOIN user u USING(id_user)`)

        let msg = 'sukses'
        if (getData.rows.length === 0) {
            let addItems = []
            for (let items of getData.fields) {
                const item = items.name
                    .replace(/_/gm, ' ')
                    .toUpperCase()
                addItems[item] = ''
            }
            resultConvert[0] = { ...addItems }
        } else {
            const converter = o => Object.fromEntries(
                Object.entries(o).map(([indexAwal, indekAkhir]) => [
                    indexAwal
                        .replace(/_/gm, ' ')
                        .toUpperCase(), indekAkhir])
            )
            resultConvert = getData.rows.map(converter)
            msg = filteringValidationPiket(getData.rows)
        }
        msg = filteringValidationPiket(getData.rows)
        message = { status: 'GAGAL', message: msg }, sts = 301
        if (msg === 'sukses') {
            console.log(resultConvert);
            const convertJson = new Utilities('')
            convertJson.handleJsonToExcelPiket(resultConvert, 'export_data_piket', true)
            convertJson.headerKNUI('export_data_piket')
            await convertJson.headerKNUIStyle('export_data_piket')
            message = { status: 'SUKSES', filename: `xlsx/export_data_piket.xlsx` }, sts = 200
        }
        return res.status(sts).send(message);
    } catch (error) {
        console.log(error)
        response.ok(error, 401, res)
    }
}

exports.getHistoryDataPiket = async (req, res) => {
    try {
        const { tanggal_awal, tanggal_akhir } = req.query
        // let option = 'ORDER BY created_at ASC'
        // if (tanggal_awal && tanggal_akhir) {
        //     option = ` WHERE date(created_at) BETWEEN '${tanggal_awal}' AND '${tanggal_akhir}' ORDER BY status ASC`
        // }
        // console.log(option)
        const getData = await queryDB(`SELECT jenis_kain, berat_bawah, berat_atas,kode,rak_tujuan,
        jenis_plastik,metode_lipat, created_at AS tanggal_import, 
        'TIDAK AKTIF' AS sts, u.nama 
        FROM master_data_piket_history mdp JOIN user u USING(id_user)`)
        response.ok(getData.rows, 200, res)
    } catch (error) {
        console.log(error)
        response.ok(error, 401, res)
    }
}