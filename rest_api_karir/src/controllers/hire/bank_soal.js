const { queryDB, dumpError } = require('../../../config/conn/tabel')
const response = require('../../../config/res/res')
const _ = require('lodash')


exports.allBankSoalMatematika = async (req, res) => {
    try {
        const getQuestionsTest = await queryDB(`SELECT id_soal, jenis_test, count(jenis_test) as jumlah_soal 
        FROM soal_web_test WHERE jenis_test <> 'tes AQ' group by jenis_test`)
        response.ok({ status: "SUKSES", pesan: getQuestionsTest.rows }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.bankSoalMatematikaByJenis = async (req, res) => {
    try {
        let getQuestionsTest, data
        const { jenis_test } = req.params
        if (`${jenis_test}` === 'subtest_1a' || `${jenis_test}` === 'subtest_1b' || `${jenis_test}` === 'subtest_1c') {
            getQuestionsTest = await queryDB(`SELECT REPLACE(SUBSTR(soal,1, 3), '.', '') + 0 AS no,id_soal, jenis_test, 
            soal, jawaban_a, jawaban_b, jawaban_c, jawaban_d, 
            jawaban_e, jawaban_benar FROM soal_web_test WHERE id_soal <> 1 AND jenis_test=?`, [jenis_test])
            data = getQuestionsTest.rows.map((x) => {
                return {
                    no: x.no,
                    id_soal: x.id_soal,
                    jenis_test: x.jenis_test,
                    soal: x.soal.slice(2).replace(/^\. |^ /gm, ''),
                    jawaban_a: x.jawaban_a,
                    jawaban_b: x.jawaban_b,
                    jawaban_c: x.jawaban_c,
                    jawaban_d: x.jawaban_d,
                    jawaban_e: x.jawaban_e,
                    jawaban_benar: x.jawaban_benar,
                }
            })
        }
        if (`${jenis_test}` === 'subtest_2') {
            getQuestionsTest = await queryDB(`SELECT REPLACE(SUBSTR(soal,3, 3), '.', '') + 0 AS no ,id_soal, 
            jenis_test, soal, jawaban_a, jawaban_b, jawaban_c, jawaban_d, 
            jawaban_e, jawaban_benar FROM soal_web_test WHERE id_soal <> 1 AND jenis_test='subtest_2'`)
            data = getQuestionsTest.rows
        }
        if (`${jenis_test}` === 'subtest_3') {
            getQuestionsTest = await queryDB(`SELECT REPLACE(SUBSTR(soal,1, 3), '.', '') + 0 AS no ,id_soal, 
            jenis_test, soal, jawaban_a, jawaban_b, jawaban_c, jawaban_d, 
            jawaban_e, jawaban_benar FROM soal_web_test WHERE id_soal <> 1 AND jenis_test='subtest_3'`)
            data = getQuestionsTest.rows
        }
        const sortData = data.sort((a, b) => a.no - b.no)
        return response.ok({ status: "SUKSES", pesan: sortData }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.updateBankSoalMatematika = async (req, res) => {
    try {
        const { soal, soalEdit, jawaban_a, jawaban_b, jawaban_c, jawaban_d, jawaban_e, jawaban_benar, id_soal } = req.body
        const getNoMax = await queryDB(`SELECT MAX(REPLACE(REPLACE(LEFT(soal, 3), ' ', ''), '.', '') + 0) AS no FROM soal_web_test 
        WHERE id_soal=? and soal LIKE '%${soal}'`, [id_soal])
        await queryDB(`update soal_web_test set soal=?, jawaban_a=?, jawaban_b=?, jawaban_c=?, jawaban_d=?, jawaban_e=?, jawaban_benar=?
        where soal=? and id_soal=?`, [`${getNoMax.rows[0].no}. ${soalEdit}`, jawaban_a, jawaban_b, jawaban_c, jawaban_d, jawaban_e, jawaban_benar,
        `${getNoMax.rows[0].no}. ${soal}`, id_soal])
        response.ok({ status: "SUKSES", pesan: 'Soal Berhasil Disimpan' }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e }, 300, res);
    }
}

exports.addBankSoalMatematika = async (req, res) => {
    try {
        const { jenis_test, id_soal } = req.params
        let { soal, jawaban_a, jawaban_b, jawaban_c, jawaban_d, jawaban_e, jawaban_benar } = req.body
        const validasiSoal = await queryDB(`select * from soal_web_test where soal=? and id_soal=?`, [soal, id_soal])
        if (validasiSoal.rows.length > 0) {
            return response.ok({ status: "SUKSES", pesan: 'Soal Sudah ada !' }, 200, res)
        }
        const getNoMax = await queryDB(`SELECT MAX(REPLACE(REPLACE(LEFT(soal, 3), ' ', ''), '.', '') + 1) AS no 
        FROM soal_web_test WHERE id_soal=?`, [id_soal])
        await queryDB(`insert into soal_web_test (id_soal, jenis_test, soal, jawaban_a, jawaban_b, jawaban_c, jawaban_d, jawaban_e, jawaban_benar)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id_soal, jenis_test, `${getNoMax.rows[0].no}. ${soal}`, jawaban_a, jawaban_b, jawaban_c, jawaban_d, jawaban_e, jawaban_benar])
        return response.ok({ status: "SUKSES", pesan: 'Soal Berhasil Ditambahkan' }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.deleteBankSoalMatematika = async (req, res) => {
    try {
        const { id_soal, soal } = req.body
        if (!soal) {
            return response.ok({ status: "GAGAL", pesan: 'soal masih kosong !' }, 200, res)
        }
        if (soal.length === 0) {
            return response.ok({ status: "GAGAL", pesan: 'soal masih kosong !' }, 200, res)
        }
        const getNoMax = await queryDB(`SELECT MAX(REPLACE(REPLACE(LEFT(soal, 3), ' ', ''), '.', '') + 0) AS no 
        FROM soal_web_test WHERE id_soal=? and soal LIKE '%${soal}'`, [id_soal])
        await queryDB(`delete from soal_web_test where soal=? and id_soal=?`,
            [`${getNoMax.rows[0].no}. ${soal}`, id_soal])
        return response.ok({ status: "SUKSES", pesan: 'Soal Berhasil Dihapus' }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}