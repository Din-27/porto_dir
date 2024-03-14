const xlsx = require('xlsx')
const XlsxPopulate = require('xlsx-populate');


exports.Utilities = class Utilities {
    constructor(filename) {
        this.filename = filename
    }
    async handleExcelToJson(range) {
        let parsedData = [];
        const file = xlsx.readFile(`./xlsx/${this.filename}.xlsx`);
        const sheetNames = file.SheetNames;
        const totalSheets = sheetNames.length;
        for (let i = 0; i < totalSheets; i++) {
            // Convert to json using xlsx
            const tempData = xlsx.utils.sheet_to_json(file.Sheets[sheetNames[i]], { range: range });
            xlsx.utils.json
            // Skip header row which is the colum names
            // tempData.shift();

            // Add the sheet's json to our data array
            parsedData.push(...tempData);
            await Promise.all(parsedData)
            // fs.writeFileSync(path.join(__dirname, '../temp/data.json'), JSON.stringify(parsedData))
            return parsedData
        }
    }
    async handleJsonToExcel(arr, nama_file, piket) {
        const workSheet = xlsx.utils.json_to_sheet(arr);
        const workBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workBook, workSheet, "attendance");
        xlsx.write(workBook, { bookType: "xlsx", type: "buffer" });
        xlsx.write(workBook, { bookType: "xlsx", type: "binary" });
        xlsx.writeFile(workBook, `./xlsx/${nama_file}.xlsx`);
    }

    async handleJsonToExcelPiket(arr, nama_file, piket) {
        const workSheet = xlsx.utils.json_to_sheet(arr, { origin: 'A2' });
        const workBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workBook, workSheet, "attendance");
        xlsx.writeFile(workBook, `./xlsx/${nama_file}.xlsx`);
    }

    async headerKNUI(nama_file) {
        const workbook = xlsx.readFile(`./xlsx/${nama_file}.xlsx`);

        // Get the worksheet by name
        const worksheet = workbook.Sheets['attendance'];
        const ws = xlsx.utils.sheet_add_aoa(worksheet, [['KN UI 1466']], { origin: 'A1' })
        ws["A1"].l = {
            Target: "http://dokumentasi.co.id/knitto/ui/KN%20UI%201466?namaProgram=Master%20Data%20Knitto",
            Tooltip: "KN UI 1466"
        }

        xlsx.writeFile(workbook, `./xlsx/${nama_file}.xlsx`);
    }

    async headerKNUIStyle(nama_file) {
        const workbook = await XlsxPopulate.fromFileAsync(`./xlsx/${nama_file}.xlsx`);
        const sheet = workbook.sheet('attendance');
        const cellA1 = sheet.cell('A1');
        cellA1.style({ fontColor: '0000FF', underline: true });
        await workbook.toFileAsync(`./xlsx/${nama_file}.xlsx`);
    }

    async convertXLSXToJSON() {
        try {
            const workbook = xlsx.readFile(`./xlsx/${this.filename}.xlsx`);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 1 }).filter(x => x.length !== 0)

            const headers = jsonData[0];
            const jsonDataWithoutHeader = jsonData.slice(2);
            // console.log(jsonData);
            const jsonResult = jsonDataWithoutHeader.map((row) => {
                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header] = row[index];
                });
                return rowData;
            });
            return jsonResult
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }
}

// const excel = require('xlsx')
// var xlsx = require('node-xlsx');
// const fs = require('fs');
// const path = require('path');
// const csv = require('csvtojson')

// exports.Utilities = class Utilities {
//     constructor(filename) {
//         this.filename = filename
//     }
//     async handleExcelToJson() {
//         const pathFile = path.join(__dirname.replace('/utils', ''), '/xlsx/excel.xlsx')
//         var obj = xlsx.parse(pathFile); // parses a file
//         var rows = [];
//         var writeStr = "";

//         //looping through all sheets
//         for (var i = 0; i < obj.length; i++) {
//             var sheet = obj[i];
//             //loop through all rows in the sheet
//             for (var j = 0; j < sheet['data'].length; j++) {
//                 //add the row to the rows array
//                 rows.push(sheet['data'][j]);
//             }
//         }

//         //creates the csv string to write it to a file
//         for (var i = 0; i < rows.length; i++) {
//             writeStr += rows[i].join(",") + "\n";
//         }

//         //writes to a file, but you will presumably send the csv as a
//         //response instead
//         fs.writeFile(pathFile.replace('.xlsx', '.csv'), writeStr, function (err) {
//             if (err) {
//                 return console.log(err);
//             }
//             console.log("test.csv was saved in the current directory!");
//         });
//         const jsonArray = await csv().fromFile(pathFile.replace('.xlsx', '.csv'));
//         return jsonArray
//     }
//     async handleJsonToExcel(arr) {
//         const path = './xlsx/export_data.xlsx'
//         const workSheet = excel.utils.json_to_sheet(arr);
//         const workBook = excel.utils.book_new();
//         excel.utils.book_append_sheet(workBook, workSheet, "attendance");
//         excel.write(workBook, { bookType: "xlsx", type: "buffer" });
//         excel.write(workBook, { bookType: "xlsx", type: "binary" });
//         excel.writeFile(workBook, path);
//     }
// }