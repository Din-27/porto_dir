const _ = require('lodash')
const Excel = require('excel4node')
const { DataStyle } = require('../style/dataStyle')
const { HeaderStyle } = require("../style/headerStyle")
const { props } = require('../../../constant/Property')
// const { UploadS3 } = require('../../S3Core')
// const { join } = require('path')

const LastIndexing = (array, indexTarget) => {
    if (indexTarget >= 0 && indexTarget < array.length) {
        const dataLastIndex = array.slice(0, indexTarget);
        const total = dataLastIndex.reduce((x, y) => x + y, 0);
        return total;
    }
    return 0
}

const HeaderUpperCase = (message) => {
    const text = []
    const item = message.split('_')
    for (let i = 0; i < item.length; i++) {
        text.push(String(item[i + 1])[0].toLocaleUpperCase() + String(item[i + 1]).slice(1))
    }
    return message[0].toUpperCase() + item[0].slice(1) + ' ' + text.filter(x => x !== String('Undefined')).join().replace(/,/gm, ' ')
}

const RollBackDate = (date) => {
    const result = []
    const indexing = date.split(/-/gm)
    for (let i = 0; i < indexing.length; i++) {
        result.push(indexing[2 - i])
    }
    return result.join().replace(/,/gm, '/')
}

const ExcelAssistant = ({ wb, ws, header, data, condition, lastHeader, tanggal }) => {
    const { tanggal_awal, tanggal_akhir } = tanggal

    switch (String(condition)) {
        case 'master_penjualan':
            props.row.desc = lastHeader + 9
            props.row.data = lastHeader + 13
            props.row.header = lastHeader + 12
            props.header = `Master Penjualan (${RollBackDate(tanggal_awal)} - ${RollBackDate(tanggal_akhir)})`
            break;
        case 'detail_penjualan':
            props.row.desc = lastHeader + 14
            props.row.data = lastHeader + 17
            props.row.header = lastHeader + 16
            props.header = 'Detail Penjualan'
            break;
        case 'data_penjualan':
            props.row.desc = 4
            props.row.data = 7
            props.row.header = 6
            props.header = 'Summary Penjualan'
            break;
    }

    const LogicalHeader = {
        col_axis: condition === 'master_penjualan' && props.row.desc,
        second_y_axis: condition === 'master_penjualan' && 4,
        merge_condition: condition === 'master_penjualan',
        rows: condition === 'master_penjualan' ? 2 : 1
    }
    ws.cell(props.row.desc, LogicalHeader.rows, LogicalHeader.col_axis, LogicalHeader.second_y_axis, LogicalHeader.merge_condition)
        .string(props.header.replace('_', ''))
        .style(props.style.styleHeader)

    // this header
    for (let col = 0; col < header.length; col++) {
        ws.cell(props.row.header, col + 1)
            .string(HeaderUpperCase(header[col]))
            .style(HeaderStyle(wb));
    }

    // this data
    // Write data to the worksheet with styles
    for (let row = 0; row < data.length; row++) {
        for (let col = 0; col < header.length; col++) {
            ws.cell(props.row.data + row, col + 1)
                .string(data[row][header[col]])
                .style(DataStyle(wb));
        }
    }
}

exports.GenerateFile = (data, index, tanggal) => {
    // eslint-disable-next-line no-undef
    // const pathFileSave = join(__dirname
    //     .replace('\\helpers\\excel\\core', ''), `/excel/LAPORAN_PENJUALAN_MARKETING.xlsx`)
    const pathFileSave = `/home/webserviceslave-knittopusat/it-dev/rest-api-laporan-marketing-pusat/excel/LAPORAN_PENJUALAN_MARKETING.xlsx`

    const wb = new Excel.Workbook();
    // Add a worksheet
    const ws = wb.addWorksheet('Laporan');

    // this hyperlink 1
    const url = 'http://dokumentasi.co.id/knitto/ui/KN UI 1702'
    ws.column(1)
        .setWidth(18);
    ws.cell(2, 1)
        .formula(`HYPERLINK("${url}", "KN UI 1702")`)
        .style(props.style.styleFont)

    const section = ['data_penjualan', 'master_penjualan', 'detail_penjualan']
    for (let i = 0; i < section.length; i++) {
        const x = section[i]
        const header = data[x].map(y => Object.keys(y))
        const dataHeader = _.uniq(...header)

        const _props = {
            wb, ws,
            tanggal,
            data: data[x],
            header: dataHeader,
            lastHeader: LastIndexing(index, i)
        }
        console.log(_props.lastHeader);
        ExcelAssistant({ ..._props, condition: String(x) })
    }
    wb.write(pathFileSave, (err) => {
        if (err) throw err
        // UploadS3()
        console.log('Excel file generated.');
    });
}