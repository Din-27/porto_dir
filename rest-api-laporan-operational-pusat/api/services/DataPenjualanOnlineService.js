const { ResponseNetworkError, ResponseOk } = require('../../helpers/ResponseCoreModule');
const { GenerateFile } = require('../../helpers/excel/core/ExcelCoreModule');
const { DumpError } = require('../../helpers/SqlCoreModule');
const { API } = require('../../config/APIConfig');
const { IP } = require('../../constant/IP');
const moment = require('moment');

const responseResult = {
    order_website: '',
    order_chatbot: '',
    jumlah_user_baru: '',
    tanggal_awal: '',
    tanggal_akhir: '',
    value: {
        data_penjualan: '',
        master_penjualan: '',
        detail_penjualan: ''
    }
}

exports.DataServiceModule = async (req, res) => {
    const { tanggal_awal, tanggal_akhir, cabang } = req.body
    try {
        // ChangeIP(cabang)
        const result = []
        responseResult.tanggal_awal = tanggal_awal
        responseResult.tanggal_akhir = tanggal_akhir
        const value = ["data_penjualan", "master_penjualan", "detail_penjualan"]
        const numberValue = ["order_website", "order_chatbot", "jumlah_user_baru"]

        for (let i = 0; i < cabang.length; i++) {
            const multipleBranch = IP[cabang[i]]
            console.log(multipleBranch);
            const data = API({
                method: 'get',
                address: multipleBranch,
                append: `/cabang?tanggal_awal=${tanggal_awal}&tanggal_akhir=${tanggal_akhir}&cabang=${cabang[i]}`
            })
            await Promise.all([data])
                .then((_data) => {
                    console.log(_data[0].data, 'asdasdasd');
                    result.push(_data[0].data.message)
                })
        }

        for (const itm of value) {
            responseResult.value[itm] = []
            const dataArgs = result.map(x => x.value[itm])
            for (let i = 0; i < dataArgs.length; i++) {
                responseResult.value[itm]
                    .push(...result.map(x => x.value[itm])[i])
            }
        }

        for (const z of numberValue) {
            responseResult[z] = result.map((x) => x[z]).reduce((x, y) => x + y, 0)
        }
        await Promise.all([responseResult])
            .then((_responseResult) => {
                console.log(_responseResult[0].detail_penjualan, 'asdasdasd'.toUpperCase());

                responseResult.tanggal_awal = moment(tanggal_awal).format('DD/MM/YYYY')
                responseResult.tanggal_akhir = moment(tanggal_akhir).format('DD/MM/YYYY')
                if (responseResult.value.detail_penjualan.length > 0) {
                    responseResult.value.detail_penjualan = responseResult.value.detail_penjualan.map(item => {
                        item.tanggal_beli = moment(item.tanggal_beli).format('DD/MM/YYYY')
                        return item
                    })
                }
                if (responseResult.value.master_penjualan.length > 0) {
                    responseResult.value.master_penjualan = responseResult.value.master_penjualan.map(item => {
                        // eslint-disable-next-line no-undef
                        item.total_kg = Number(Buffer.from(item.total_kg)) * 1000
                        return item
                    })
                }
                return ResponseOk({
                    res,
                    dataParams: responseResult,
                })
            })
    } catch (e) {
        DumpError(e)
        return ResponseNetworkError(e.message, res)
    }
}

exports.ExportExcelServiceModule = async (req, res) => {
    const result = []
    const jumlahData = []
    const { tanggal_awal, tanggal_akhir, cabang } = req.body
    try {
        const value = ["data_penjualan", "master_penjualan", "detail_penjualan"]
        const numberValue = ["order_website", "order_chatbot", "jumlah_user_baru"]

        for (let i = 0; i < cabang.length; i++) {
            const multipleBranch = IP[cabang[i]]
            // console.log(multipleBranch);
            const data = API({
                method: 'get',
                address: multipleBranch,
                append: `/cabang?tanggal_awal=${tanggal_awal}&tanggal_akhir=${tanggal_akhir}&cabang=${cabang[i]}`
            })
            await Promise.all([data])
                .then((_data) => {
                    // console.log(_data[0].data);
                    result.push(_data[0].data.message)
                })
        }
        for (const itm of value) {
            responseResult.value[itm] = []
            const dataArgs = result.map(x => x.value[itm])
            for (let i = 0; i < dataArgs.length; i++) {
                responseResult.value[itm]
                    .push(...result.map(x => x.value[itm])[i])
            }
        }

        for (const z of numberValue) {
            responseResult[z] = result.map((x) => x[z]).reduce((x, y) => x + y, 0)
        }
        await Promise.all([responseResult])
            .then((_responseResult) => {
                // console.log(_responseResult[0].detail_penjualan);
                _responseResult[0].value.data_penjualan = [
                    {
                        tanggal_awal: moment(tanggal_awal).format('DD/MM/YYYY'),
                        tanggal_akhir: moment(tanggal_akhir).format('DD/MM/YYYY'),
                        jumlah_no_baru: String(_responseResult[0].jumlah_user_baru),
                        order_website: String(_responseResult[0].order_website),
                        order_chat: String(_responseResult[0].order_chatbot),
                    }
                ]

                _responseResult[0].value.master_penjualan = _responseResult[0].value.master_penjualan.map(x => {
                    return {
                        no_telepon_utama: x.no_telepon_utama,
                        nama_customer: x.nama,
                        nama_kain: x.jenis_kain,
                        warna_kain: x.warna_kain,
                        total_kg: String(Number(x.total_kg) * 1000)
                    }
                })

                _responseResult[0].value.detail_penjualan = _responseResult[0].value.detail_penjualan.map(x => {
                    return {
                        no_telepon_utama: x.telepon,
                        nama_customer: x.nama,
                        tanggal_beli: moment(x.tanggal_beli).format('DD/MM/YYYY'),
                        no_roll: x.no_roll,
                        berat: x.berat,
                        cabang: x.cabang,
                        jenis: x.jenis
                    }
                })

                const closeLoopData = _responseResult[0].value
                // return console.log(closeLoopData);
                for (const item of Object.keys(closeLoopData)) {
                    jumlahData.push(closeLoopData[item].length)
                }
                GenerateFile(closeLoopData, jumlahData, {
                    tanggal_awal,
                    tanggal_akhir
                })
                return ResponseOk({
                    res,
                    dataParams: 'http://192.168.20.27:8524/export/excel/laporan/LAPORAN_PENJUALAN_MARKETING.xlsx'
                })
            })
    } catch (e) {
        DumpError(e)
        return ResponseNetworkError(e.message, res)
    }
}