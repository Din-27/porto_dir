const { queryDB, dumpError, decodedToken } = require('../../../config/conn/tabel')
const response = require('../../../config/res/res')
const { fetchData } = require('./soalMatematika2');
const { programNilai } = require('./penilainAQ');
const _ = require('lodash');
const { checkTestAQ } = require('./checkingTestAQ');

Array.prototype.diff = function (arr2) {
    var ret = [];
    this.sort();
    arr2.sort();
    for (var i = 0; i < this.length; i += 1) {
        if (arr2.indexOf(this[i]) > -1) {
            ret.push(this[i]);
        }
    }
    return ret;
};

exports.handleTestColorBlind = async (req, res) => {
    try {
        const buta_warna = req.file?.key
        const { skor } = req.body
        const { email } = decodedToken(req)
        const getId = await queryDB(`select * from identitas_pelamar where email_auth=?`, [email])
        const identitas = getId.rows[0].id_identitas
        const checkPersonal = await queryDB(`select * from tambahan_informasi_pelamar where id_identitas =?`, [identitas])
        const checklampiran = await queryDB(`select * from lampiran_pelamar where id_identitas =?`, [identitas])
        const checkTestAq = await queryDB(`select * from master_hasil_test where id_identitas=?`, [identitas])

        // validation checking add data
        if (!getId.rows[0]?.nama_lengkap && !getId.rows[0]?.jenis_kelamain &&
            !getId.rows[0]?.tinggi_badan && !getId.rows[0]?.posisi_dilamar && !getId.rows[0]?.pendidikan_terakhir &&
            !getId.rows[0]?.jurusan_terakhir && !getId.rows[0]?.tempat_lahir && !getId.rows[0]?.tanggal_lahir && !getId.rows[0]?.alamat_ktp &&
            !getId.rows[0]?.alamat_domisili && !getId.rows[0]?.email && !getId.rows[0]?.nomor_hp && !getId.rows[0]?.sumber_informasi_loker &&
            !checkPersonal.rows[0]?.pengalaman_kerja) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checkPersonal.rows[0]?.kelebihan_kekurangan && !checkPersonal.rows[0]?.sosial_pelamar &&
            !checkPersonal.rows[0]?.kritik_untuk_pelamar && !checkPersonal.rows[0]?.rencana_pelamar_ketika_diterima &&
            !checkPersonal.rows[0]?.gaji_pelamar_saat_ini && !checkPersonal.rows[0]?.gaji_yang_diharapkan_pelamar) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checklampiran.rows[0]?.cv_pelamar && !checklampiran.rows[0]?.ktp_pelamar && !checklampiran.rows[0]?.ijazah_pelamar) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checkTestAq.rows[0].skor_test_aq) {
            return response.ok({ status: 'GAGAL', pesan: "Test AQ belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }

        //main
        if (req.file?.size > 1000000) {
            return response.ok({ status: 'GAGAL', pesan: 'photo tidak boleh melebihi 1MB !' }, 300, res)
        }
        if (buta_warna.length === 0) {
            return response.ok({ status: 'GAGAL', pesan: 'file tidak boleh kosong !' }, 300, res)
        }
        if (!buta_warna.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/)) {
            return response.ok({ status: 'GAGAL', pesan: 'file tidak valid !' }, 300, res)
        }
        const checkmaster = await queryDB(`select * from master_hasil_test where id_identitas=?`, [getId.rows[0].id_identitas])
        if (checkmaster.rows[0]?.skor_test_buta_warna && checkmaster.rows[0]?.skor_test_aq
            && checkmaster.rows[0]?.skor_subtest_1 && checkmaster.rows[0]?.skor_subtest_2 && checkmaster.rows[0]?.skor_subtest_3) {
            return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !!" }, 301, res)
        }
        await queryDB(`UPDATE master_hasil_test
            SET bukti_test_buta_warna = ?, skor_test_buta_warna = ?
            WHERE id_identitas=?`, [buta_warna, skor, identitas])
        const getIdMasterTest = await queryDB(`select * from master_hasil_test where id_identitas=?`, [identitas])
        if (getIdMasterTest.rows[0]?.skor_test_aq !== null && getIdMasterTest.rows[0]?.skor_subtest_3 !== null) {
            await queryDB(`UPDATE master_hasil_test set tanggal_selesai_test=now() where id_identitas=?`, [identitas])
        }
        response.ok({ status: "SUKSES", pesan: 'Data telah disimpan' }, 200, res);
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.getTestAq = async (req, res) => {
    try {
        const getQuestionsTestAQ = await queryDB(`SELECT soal, jawaban_a, jawaban_b, jawaban_c 
        FROM soal_web_test WHERE id_soal=1 AND jenis_test='tes AQ'`)
        response.ok({ status: 'SUKSES', pesan: getQuestionsTestAQ.rows }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.handleTestAq = async (req, res) => {
    try {
        let pesan
        const data = req.body
        const { email } = decodedToken(req)
        const getId = await queryDB(`select * from identitas_pelamar where email_auth=?`, [email])
        const identitas = getId.rows[0].id_identitas
        const getIdMasterTest = await queryDB(`select * from master_hasil_test where id_identitas=?`, [identitas])
        const checkPilihanGanda = data.map((item) => checkTestAQ(item))
        const findQuestionCamper = checkPilihanGanda.filter((item) => item.toUpperCase() === 'CAMPER')
        const findQuestionClimber = checkPilihanGanda.filter((item) => item.toUpperCase() === 'CLIMBER')
        const findQuestionQuiter = checkPilihanGanda.filter((item) => item.toUpperCase() === 'QUITTER')
        const score = programNilai(findQuestionQuiter, findQuestionCamper, findQuestionClimber)
        const checkmaster = await queryDB(`select * from master_hasil_test where id_identitas=?`, [getId.rows[0].id_identitas])
        const checkPersonal = await queryDB(`select * from tambahan_informasi_pelamar where id_identitas =?`, [identitas])
        const checklampiran = await queryDB(`select * from lampiran_pelamar where id_identitas =?`, [identitas])
        const checkData = await queryDB(`select * from detail_hasil_test where id_master_test=? and id_soal=1`, [getIdMasterTest.rows[0].id_master_test])

        // validation checking add data
        if (checkData.rows.length > 0) {
            return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
        }
        if (checkmaster.rows[0]?.skor_test_buta_warna && checkmaster.rows[0]?.skor_test_aq &&
            checkmaster.rows[0]?.skor_subtest_1 && checkmaster.rows[0]?.skor_subtest_2 && checkmaster.rows[0]?.skor_subtest_3) {
            return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
        }
        if (!getId.rows[0]?.nama_lengkap && !getId.rows[0]?.jenis_kelamain &&
            !getId.rows[0]?.tinggi_badan && !getId.rows[0]?.posisi_dilamar && !getId.rows[0]?.pendidikan_terakhir &&
            !getId.rows[0]?.jurusan_terakhir && !getId.rows[0]?.tempat_lahir && !getId.rows[0]?.tanggal_lahir && !getId.rows[0]?.alamat_ktp &&
            !getId.rows[0]?.alamat_domisili && !getId.rows[0]?.email && !getId.rows[0]?.nomor_hp && !getId.rows[0]?.sumber_informasi_loker &&
            !checkPersonal.rows[0]?.pengalaman_kerja) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checkPersonal.rows[0]?.kelebihan_kekurangan && !checkPersonal.rows[0]?.sosial_pelamar &&
            !checkPersonal.rows[0]?.kritik_untuk_pelamar && !checkPersonal.rows[0]?.rencana_pelamar_ketika_diterima &&
            !checkPersonal.rows[0]?.gaji_pelamar_saat_ini && !checkPersonal.rows[0]?.gaji_yang_diharapkan_pelamar) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        console.log(checklampiran.rows, !checklampiran.rows[0]?.cv_pelamar, !checklampiran.rows[0]?.ktp_pelamar, !checklampiran.rows[0]?.ijazah_pelamar)
        if (!checklampiran.rows[0]?.cv_pelamar && !checklampiran.rows[0]?.ktp_pelamar && !checklampiran.rows[0]?.ijazah_pelamar) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        const validation = await queryDB(`SELECT id_soal FROM detail_hasil_test where id_soal=1 and id_master_test=?`,
            [getIdMasterTest?.rows[0]?.id_master_test])
        await queryDB(`UPDATE master_hasil_test set tanggal_mulai_test=now(), skor_test_aq=? where id_identitas=?`, [score, identitas])
        if (validation.rows.length > 0) {
            pesan = 'jawaban sudah di simpan'
        }
        if (getIdMasterTest?.rows[0]?.id_master_test === null) {
            pesan = 'endpoint memerlukan auth !'
        } else {
            pesan = 'Data berhasil di simpan'
            data.map(async (item, index) => await queryDB(`INSERT INTO detail_hasil_test (id_master_test, id_soal, jawaban, nilai_jawaban)
            VALUES (?, 1, ?, ?)`, [getIdMasterTest.rows[0]?.id_master_test, `${index + 1}. ${item.jawaban}`, 0]))
        }
        await queryDB(`UPDATE master_hasil_test set skor_test_aq=? where id_identitas=?`, [score, identitas])
        response.ok({ status: "SUKSES", pesan: pesan }, 200, res);
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.getAllTestMatematika = async (req, res) => {
    try {
        const { email } = decodedToken(req)
        const getId = await queryDB(`select id_identitas from identitas_pelamar where email_auth=?`, [email])
        const identitas = getId.rows[0].id_identitas
        const getIdMasterTest = await queryDB(`select * from master_hasil_test where id_identitas=?`, [identitas])
        const id_master_test = getIdMasterTest.rows[0]?.id_master_test
        const getQuestionsTestMatematika = await queryDB(`SELECT jenis_test FROM soal_web_test WHERE id_soal<>1 group by jenis_test`)
        const getQuestionsTestMatematika1a = await queryDB(`SELECT jawaban FROM detail_hasil_test WHERE id_soal=2 AND id_master_test=?`, [id_master_test])
        const getQuestionsTestMatematika1b = await queryDB(`SELECT jawaban FROM detail_hasil_test WHERE id_soal=3 AND id_master_test=?`, [id_master_test])
        const getQuestionsTestMatematika1c = await queryDB(`SELECT jawaban FROM detail_hasil_test WHERE id_soal=4 AND id_master_test=?`, [id_master_test])
        const getQuestionsTestMatematika2 = await queryDB(`SELECT jawaban FROM detail_hasil_test WHERE id_soal=5 AND id_master_test=?`, [id_master_test])
        const getQuestionsTestMatematika3 = await queryDB(`SELECT jawaban FROM detail_hasil_test WHERE id_soal=6 AND id_master_test=?`, [id_master_test])
        const data = {
            data: getQuestionsTestMatematika.rows.map((item) => item.jenis_test),
            subtest_1a: getQuestionsTestMatematika1a.rows.length > 0 ? 'sudah dikerjakan' : 'belum dikerjakan',
            subtest_1b: getQuestionsTestMatematika1b.rows.length > 0 ? 'sudah dikerjakan' : 'belum dikerjakan',
            subtest_1c: getQuestionsTestMatematika1c.rows.length > 0 ? 'sudah dikerjakan' : 'belum dikerjakan',
            subtest_2: getQuestionsTestMatematika2.rows.length > 0 ? 'sudah dikerjakan' : 'belum dikerjakan',
            subtest_3: getQuestionsTestMatematika3.rows.length > 0 ? 'sudah dikerjakan' : 'belum dikerjakan'
        }
        response.ok({ status: 'SUKSES', pesan: data }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.getTestMatematikaByJenis = async (req, res) => {
    try {
        let pesan, getQuestionsTestMatematika
        const { jenis_test } = req.params
        if (`${jenis_test}` === 'subtest_1a' || `${jenis_test}` === 'subtest_1b' || `${jenis_test}` === 'subtest_1c') {
            getQuestionsTestMatematika = await queryDB(`SELECT REPLACE(SUBSTR(soal,1, 3), '.', '') + 0 AS no,id_soal, jenis_test, soal, jawaban_a, jawaban_b, jawaban_c, jawaban_d, 
            jawaban_e, jawaban_benar FROM soal_web_test WHERE id_soal <> 1 AND jenis_test=? order by no asc`, [jenis_test])
            data = getQuestionsTestMatematika.rows.map((x) => {
                return {
                    // soal: x.soal.slice(2).replace(/^\. |^ /gm, ''),
                    soal: x.soal,
                    jawaban_a: x.jawaban_a,
                    jawaban_b: x.jawaban_b,
                    jawaban_c: x.jawaban_c,
                    jawaban_d: x.jawaban_d,
                    jawaban_e: x.jawaban_e,
                }
            })
        }
        if (`${jenis_test}` === 'subtest_2' || `${jenis_test}` === 'subtest_3') {
            getQuestionsTestMatematika = await queryDB(`SELECT soal, jawaban_a, jawaban_b, jawaban_c, jawaban_d, jawaban_e 
            FROM soal_web_test WHERE id_soal<>1 and jenis_test=? order by no asc`, [jenis_test])
            data = getQuestionsTestMatematika.rows.map((x) => {
                return {
                    soal: x.soal,
                    jawaban_a: x.jawaban_a,
                    jawaban_b: x.jawaban_b,
                    jawaban_c: x.jawaban_c,
                    jawaban_d: x.jawaban_d,
                    jawaban_e: x.jawaban_e,
                }
            })
        }
        if (getQuestionsTestMatematika.rows.length === 0) {
            pesan = 'test tidak ada'
        } else {
            pesan = data
        }
        response.ok({ status: 'SUKSES', pesan: pesan }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.handleTestMatematikaSubtest_1a = async (req, res) => {
    try {
        let sum = 0
        let nilai, pesan
        const data = req.body
        const { email } = decodedToken(req)
        const getId = await queryDB(`select * from identitas_pelamar where email_auth=?`, [email])
        const identitas = getId.rows[0].id_identitas
        const answer = await queryDB(`select REPLACE(REPLACE(LEFT(soal, 3), ' ', ''), '.', '') + 0 AS no, jawaban_benar from soal_web_test where id_soal=2`)
        const trueAnswer = answer.rows.map(x => `${x.no}. ${x.jawaban_benar}`)
        const employeAnswer = data.map((x, y) => `${x.soal.slice(0, 2).replace('.', '')}. ${x.jawaban}`)
        const getIdMasterTest = await queryDB(`select * from master_hasil_test where id_identitas=?`, [identitas])
        const id_master_test = getIdMasterTest?.rows[0]?.id_master_test
        const getTrueAnswer = employeAnswer.diff(trueAnswer)
        const validation = await queryDB(`SELECT id_soal FROM detail_hasil_test where id_soal=2 and id_master_test=?`,
            [id_master_test])
        const checkmaster = await queryDB(`select * from master_hasil_test where id_identitas=?`, [getId.rows[0].id_identitas])
        const checkPersonal = await queryDB(`select * from tambahan_informasi_pelamar where id_identitas =?`, [identitas])
        const checkTest = await queryDB(`select * from master_hasil_test where id_identitas=?`, [identitas])
        const checklampiran = await queryDB(`select * from lampiran_pelamar where id_identitas =?`, [identitas])
        const checkData = await queryDB(`select * from detail_hasil_test where id_master_test=? and id_soal=2`, [getIdMasterTest.rows[0].id_master_test])

        // validation checking add data
        if (checkData.rows.length > 0) {
            return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
        }
        if (checkmaster.rows[0]?.skor_test_buta_warna && checkmaster.rows[0]?.skor_test_aq &&
            checkmaster.rows[0]?.skor_subtest_1 && checkmaster.rows[0]?.skor_subtest_2 && checkmaster.rows[0]?.skor_subtest_3) {
            return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
        }
        if (!getId.rows[0]?.nama_lengkap && !getId.rows[0]?.jenis_kelamain &&
            !getId.rows[0]?.tinggi_badan && !getId.rows[0]?.posisi_dilamar && !getId.rows[0]?.pendidikan_terakhir &&
            !getId.rows[0]?.jurusan_terakhir && !getId.rows[0]?.tempat_lahir && !getId.rows[0]?.tanggal_lahir && !getId.rows[0]?.alamat_ktp &&
            !getId.rows[0]?.alamat_domisili && !getId.rows[0]?.email && !getId.rows[0]?.nomor_hp && !getId.rows[0]?.sumber_informasi_loker &&
            !checkPersonal.rows[0]?.pengalaman_kerja) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checkPersonal.rows[0]?.kelebihan_kekurangan && !checkPersonal.rows[0]?.sosial_pelamar &&
            !checkPersonal.rows[0]?.kritik_untuk_pelamar && !checkPersonal.rows[0]?.rencana_pelamar_ketika_diterima &&
            !checkPersonal.rows[0]?.gaji_pelamar_saat_ini && !checkPersonal.rows[0]?.gaji_yang_diharapkan_pelamar) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checklampiran.rows[0]?.cv_pelamar && !checklampiran.rows[0]?.ktp_pelamar && !checklampiran.rows[0]?.ijazah_pelamar) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checkTest.rows[0].skor_test_aq) {
            return response.ok({ status: 'GAGAL', pesan: "Test AQ belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }
        if (!checkTest.rows[0].bukti_test_buta_warna) {
            return response.ok({ status: 'GAGAL', pesan: "Test Buta Warna belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }

        //main
        console.log(identitas)
        if (validation.rows.length > 0) {
            pesan = 'Jawaban sudah disimpan'
        }
        if (id_master_test === null) {
            pesan = 'endpoint memerlukan auth !'
        } else {
            pesan = 'Data berhasil di simpan'
            const file = data.map(async (item, index) => {
                await queryDB(`INSERT INTO detail_hasil_test (id_master_test, id_soal, jawaban, nilai_jawaban) VALUES (?, 2, ?, ?)`,
                    [id_master_test, `${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban !== undefined ? item.jawaban : '-'}`, getTrueAnswer.length])
            })
            console.log(getTrueAnswer.length)
        }
        return response.ok({ status: "SUKSES", pesan: pesan }, 200, res);
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.handleTestMatematikaSubtest_1b = async (req, res) => {
    try {
        let sum = 0
        let nilai, pesan
        const data = req.body
        const { email } = decodedToken(req)
        const getId = await queryDB(`select * from identitas_pelamar where email_auth=?`, [email])
        const identitas = getId.rows[0].id_identitas
        const answer = await queryDB(`select REPLACE(REPLACE(LEFT(soal, 3), ' ', ''), '.', '') + 0 AS no, jawaban_benar from soal_web_test 
            where id_soal=3`)
        const trueAnswer = answer.rows.map(x => `${x.no}. ${x.jawaban_benar}`)
        const employeAnswer = data.map((x, y) => `${x.soal.slice(0, 2).replace('.', '')}. ${x.jawaban}`)
        const getIdMasterTest = await queryDB(`select id_master_test from master_hasil_test where id_identitas=?`,
            [identitas])
        const id_master_test = getIdMasterTest?.rows[0]?.id_master_test
        const getTrueAnswer = employeAnswer.diff(trueAnswer)
        const validation = await queryDB(`SELECT id_soal FROM detail_hasil_test where id_soal=3 and id_master_test=?`,
            [id_master_test])
        const checkmaster = await queryDB(`select * from master_hasil_test where id_identitas=?`, [getId.rows[0].id_identitas])
        const checkPersonal = await queryDB(`select * from tambahan_informasi_pelamar where id_identitas =?`, [identitas])
        const checkTest = await queryDB(`select * from master_hasil_test where id_identitas=?`, [identitas])
        const checklampiran = await queryDB(`select * from lampiran_pelamar where id_identitas =?`, [identitas])
        const checkData = await queryDB(`select * from detail_hasil_test where id_master_test=? and id_soal=3`, [getIdMasterTest.rows[0].id_master_test])

        // validation checking add data
        if (checkData.rows.length > 0) {
            return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
        }
        if (checkmaster.rows[0]?.skor_test_buta_warna && checkmaster.rows[0]?.skor_test_aq &&
            checkmaster.rows[0]?.skor_subtest_1 && checkmaster.rows[0]?.skor_subtest_2 && checkmaster.rows[0]?.skor_subtest_3) {
            return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
        }
        if (!getId.rows[0]?.nama_lengkap && !getId.rows[0]?.jenis_kelamain &&
            !getId.rows[0]?.tinggi_badan && !getId.rows[0]?.posisi_dilamar && !getId.rows[0]?.pendidikan_terakhir &&
            !getId.rows[0]?.jurusan_terakhir && !getId.rows[0]?.tempat_lahir && !getId.rows[0]?.tanggal_lahir && !getId.rows[0]?.alamat_ktp &&
            !getId.rows[0]?.alamat_domisili && !getId.rows[0]?.email && !getId.rows[0]?.nomor_hp && !getId.rows[0]?.sumber_informasi_loker &&
            !checkPersonal.rows[0]?.pengalaman_kerja) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checkPersonal.rows[0]?.kelebihan_kekurangan && !checkPersonal.rows[0]?.sosial_pelamar &&
            !checkPersonal.rows[0]?.kritik_untuk_pelamar && !checkPersonal.rows[0]?.rencana_pelamar_ketika_diterima &&
            !checkPersonal.rows[0]?.gaji_pelamar_saat_ini && !checkPersonal.rows[0]?.gaji_yang_diharapkan_pelamar) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checklampiran.rows[0]?.cv_pelamar && !checklampiran.rows[0]?.ktp_pelamar && !checklampiran.rows[0]?.ijazah_pelamar) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checkTest.rows[0].skor_test_aq) {
            return response.ok({ status: 'GAGAL', pesan: "Test AQ belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }
        if (!checkTest.rows[0].bukti_test_buta_warna) {
            return response.ok({ status: 'GAGAL', pesan: "Test Buta Warna belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }
        if (!checkTest.rows[0].skor_test_aq) {
            return response.ok({ status: 'GAGAL', pesan: "Test AQ belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }
        if (!checkTest.rows[0].bukti_test_buta_warna) {
            return response.ok({ status: 'GAGAL', pesan: "Test Buta Warna belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }

        //main
        if (validation.rows.length > 0) {
            pesan = 'Jawaban sudah disimpan'
        }
        if (getIdMasterTest?.rows[0]?.id_master_test === null) {
            pesan = 'endpoint memerlukan auth !'
        } else {
            pesan = 'Data berhasil di simpan'
            data.map(async (item, index) => {
                await queryDB(`INSERT INTO detail_hasil_test (id_master_test, id_soal, jawaban, nilai_jawaban)
                VALUES (?, 3, ?, ?)`, [id_master_test, `${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban !== undefined ? item.jawaban : '-'}`, getTrueAnswer.length])
            })
            console.log(getTrueAnswer.length)
        }
        return response.ok({ status: "SUKSES", pesan: pesan }, 200, res);
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.handleTestMatematikaSubtest_1c = async (req, res) => {
    try {
        let score_1, sum, pesan
        const data = req.body
        const { email } = decodedToken(req)
        const getId = await queryDB(`select * from identitas_pelamar where email_auth=?`, [email])
        const identitas = getId.rows[0].id_identitas
        const answer = await queryDB(`SELECT CONCAT(REPLACE(REPLACE(LEFT(soal, 3), ' ', ''), '.', '') + 0, '. ', jawaban_benar) AS jawaban_benar FROM soal_web_test 
        WHERE id_soal=4`)
        const trueAnswer = answer.rows.map(x => x.jawaban_benar)
        const employeAnswer = data.map((x, y) => `${x.soal.slice(0, 2).replace('.', '')}. ${x.jawaban}`)
        const getIdMasterTest = await queryDB(`select id_master_test from master_hasil_test where id_identitas=?`, [identitas])
        const id_master_test = getIdMasterTest.rows[0]?.id_master_test
        const getTrueAnswer = employeAnswer.diff(trueAnswer)

        const validation = await queryDB(`SELECT id_soal FROM detail_hasil_test where id_soal=4 and id_master_test=?`, [id_master_test])
        const checkmaster = await queryDB(`select * from master_hasil_test where id_identitas=?`, [getId.rows[0].id_identitas])
        const checkPersonal = await queryDB(`select * from tambahan_informasi_pelamar where id_identitas =?`, [identitas])
        const checkTest = await queryDB(`select * from master_hasil_test where id_identitas=?`, [identitas])
        const checklampiran = await queryDB(`select * from lampiran_pelamar where id_identitas =?`, [identitas])
        const checkData = await queryDB(`select * from detail_hasil_test where id_master_test=? and id_soal=4`, [getIdMasterTest.rows[0].id_master_test])

        // validation checking add data
        if (checkData.rows.length > 0) {
            return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
        }
        if (checkmaster.rows[0]?.skor_test_buta_warna && checkmaster.rows[0]?.skor_test_aq &&
            checkmaster.rows[0]?.skor_subtest_1 && checkmaster.rows[0]?.skor_subtest_2 && checkmaster.rows[0]?.skor_subtest_3) {
            return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
        }
        if (!getId.rows[0]?.nama_lengkap && !getId.rows[0]?.jenis_kelamain &&
            !getId.rows[0]?.tinggi_badan && !getId.rows[0]?.posisi_dilamar && !getId.rows[0]?.pendidikan_terakhir &&
            !getId.rows[0]?.jurusan_terakhir && !getId.rows[0]?.tempat_lahir && !getId.rows[0]?.tanggal_lahir && !getId.rows[0]?.alamat_ktp &&
            !getId.rows[0]?.alamat_domisili && !getId.rows[0]?.email && !getId.rows[0]?.nomor_hp && !getId.rows[0]?.sumber_informasi_loker &&
            !checkPersonal.rows[0]?.pengalaman_kerja) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checkPersonal.rows[0]?.kelebihan_kekurangan && !checkPersonal.rows[0]?.sosial_pelamar &&
            !checkPersonal.rows[0]?.kritik_untuk_pelamar && !checkPersonal.rows[0]?.rencana_pelamar_ketika_diterima &&
            !checkPersonal.rows[0]?.gaji_pelamar_saat_ini && !checkPersonal.rows[0]?.gaji_yang_diharapkan_pelamar) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checklampiran.rows[0]?.cv_pelamar && !checklampiran.rows[0]?.ktp_pelamar && !checklampiran.rows[0]?.ijazah_pelamar) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checkTest.rows[0].skor_test_aq) {
            return response.ok({ status: 'GAGAL', pesan: "Test AQ belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }
        if (!checkTest.rows[0].bukti_test_buta_warna) {
            return response.ok({ status: 'GAGAL', pesan: "Test Buta Warna belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }
        if (!checkTest.rows[0].skor_test_aq) {
            return response.ok({ status: 'GAGAL', pesan: "Test AQ belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }
        if (!checkTest.rows[0].bukti_test_buta_warna) {
            return response.ok({ status: 'GAGAL', pesan: "Test Buta Warna belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }

        //main
        if (validation.rows.length > 0) {
            pesan = 'Jawaban sudah disimpan'
        }
        if (id_master_test === null) {
            pesan = 'endpoint memerlukan auth !'
        } else {
            pesan = 'Data berhasil di simpan'
            data.map(async (item, index) => {
                await queryDB(`INSERT INTO detail_hasil_test (id_master_test, id_soal, jawaban, nilai_jawaban)
                VALUES (?, 4, ?, ?)`, [id_master_test, `${item.soal.slice(0, 2).replace('.', '')}. ${item.jawaban !== undefined ? item.jawaban : '-'}`, getTrueAnswer?.length])
            })
            const getScoreSubtest1a = await queryDB(`SELECT nilai_jawaban FROM detail_hasil_test WHERE id_soal=2 and id_master_test=? limit 1`,
                [id_master_test])
            const getScoreSubtest1b = await queryDB(`SELECT nilai_jawaban FROM detail_hasil_test WHERE id_soal=3 and id_master_test=? limit 1`,
                [id_master_test])
            const getScoreSubtest1c = await queryDB(`SELECT nilai_jawaban FROM detail_hasil_test WHERE id_soal=4 and id_master_test=? limit 1`,
                [id_master_test])

            sum = getScoreSubtest1a.rows[0].nilai_jawaban + getScoreSubtest1b.rows[0].nilai_jawaban + getScoreSubtest1c.rows[0].nilai_jawaban
            const result = sum / 30 * 100
            if (result >= 81) {
                score_1 = 'Baik sekali'
            }
            if (result >= 61 && result <= 80) {
                score_1 = 'Baik'
            }
            if (result >= 41 && result <= 60) {
                score_1 = 'Rata-rata'
            }
            if (result >= 21 && result <= 40) {
                score_1 = 'Dibawah rata-rata'
            }
            if (result <= 20) {
                score_1 = 'Kurang'
            }
            console.log({ nilai_jawaban: sum, score_1 })
            console.log(getTrueAnswer.length)
            await queryDB(`UPDATE master_hasil_test set skor_subtest_1=? where id_identitas=?`,
                [score_1, identitas])
        }
        return response.ok({ status: "SUKSES", pesan: pesan }, 200, res);
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.getTestMatematika_2 = async (req, res) => {
    try {
        const getSoal = await queryDB(`SELECT REPLACE(SUBSTR(soal,3, 3), '.', '') + 0 AS no, soal, jawaban_a, jawaban_b, jawaban_c, jawaban_d, 
        jawaban_e, jawaban_benar FROM soal_web_test WHERE id_soal <> 1 AND jenis_test='subtest_2' ORDER BY no ASC`)
        response.ok({ status: 'SUKSES', pesan: fetchData(getSoal) }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.handleTestMatematika_2 = async (req, res) => {
    try {
        let score_2, pesan
        const data = req.body
        const { email } = decodedToken(req)
        const getId = await queryDB(`select * from identitas_pelamar where email_auth=?`, [email])
        const identitas = getId.rows[0].id_identitas
        const answer = await queryDB(`select REPLACE(REPLACE(substr(soal, 3), ' ', ''), '.', '') + 0 AS no, jawaban_benar from soal_web_test where id_soal=5`)
        const trueAnswer = answer.rows.map(x => `${x.no}. ${x.jawaban_benar.slice(3)}`)
        const employeAnswer = data.map((x, y) => `${y + 1}. ${x.jawaban !== undefined ? x?.jawaban.slice(3).replace(/api-karir\.tigapuluhlima\.id\/[a-zA-Z]{7}\//gm, '') : '-'}`)
        const getIdMasterTest = await queryDB(`select id_master_test from master_hasil_test where id_identitas=?`, [identitas])
        const id_master_test = getIdMasterTest?.rows[0]?.id_master_test
        const getTrueAnswer = trueAnswer.diff(employeAnswer)
        const result = getTrueAnswer?.length
        const validation = await queryDB(`SELECT id_soal FROM detail_hasil_test where id_soal=5 and id_master_test=?`,
            [id_master_test])
        const checkmaster = await queryDB(`select * from master_hasil_test where id_identitas=?`, [getId.rows[0].id_identitas])
        const checkPersonal = await queryDB(`select * from tambahan_informasi_pelamar where id_identitas =?`, [identitas])
        const checkTest = await queryDB(`select * from master_hasil_test where id_identitas=?`, [identitas])
        const checklampiran = await queryDB(`select * from lampiran_pelamar where id_identitas =?`, [identitas])
        if (checkmaster.rows[0]?.skor_test_buta_warna && checkmaster.rows[0]?.skor_test_aq &&
            checkmaster.rows[0]?.skor_subtest_1 && checkmaster.rows[0]?.skor_subtest_2 && checkmaster.rows[0]?.skor_subtest_3) {
            return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
        }
        if (!getId.rows[0]?.nama_lengkap && !getId.rows[0]?.jenis_kelamain &&
            !getId.rows[0]?.tinggi_badan && !getId.rows[0]?.posisi_dilamar && !getId.rows[0]?.pendidikan_terakhir &&
            !getId.rows[0]?.jurusan_terakhir && !getId.rows[0]?.tempat_lahir && !getId.rows[0]?.tanggal_lahir && !getId.rows[0]?.alamat_ktp
            && !getId.rows[0]?.alamat_domisili && !getId.rows[0]?.email && !getId.rows[0]?.nomor_hp && !getId.rows[0]?.sumber_informasi_loker &&
            !checkPersonal.rows[0]?.pengalaman_kerja) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checkPersonal.rows[0]?.kelebihan_kekurangan && !checkPersonal.rows[0]?.sosial_pelamar &&
            !checkPersonal.rows[0]?.kritik_untuk_pelamar && !checkPersonal.rows[0]?.rencana_pelamar_ketika_diterima &&
            !checkPersonal.rows[0]?.gaji_pelamar_saat_ini && !checkPersonal.rows[0]?.gaji_yang_diharapkan_pelamar) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checklampiran.rows[0]?.cv_pelamar && !checklampiran.rows[0]?.ktp_pelamar && !checklampiran.rows[0]?.ijazah_pelamar) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checkTest.rows[0].skor_test_aq) {
            return response.ok({ status: 'GAGAL', pesan: "Test AQ belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }
        if (!checkTest.rows[0].bukti_test_buta_warna) {
            return response.ok({ status: 'GAGAL', pesan: "Test Buta Warna belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }
        if (!checkTest.rows[0].skor_test_aq) {
            return response.ok({ status: 'GAGAL', pesan: "Test AQ belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }
        if (!checkTest.rows[0].bukti_test_buta_warna) {
            return response.ok({ status: 'GAGAL', pesan: "Test Buta Warna belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }

        //main
        if (validation.rows.length > 0) {
            pesan = 'Jawaban sudah disimpan'
        }
        if (id_master_test === null) {
            pesan = 'endpoint memerlukan auth !'
        } else {
            pesan = 'Data berhasil di simpan'
            const checkData = await queryDB(`select * from detail_hasil_test where id_master_test=? and id_soal=5`, [getIdMasterTest.rows[0].id_master_test])

            // validation checking add data
            if (checkData.rows.length > 0) {
                return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
            }
            data.map(async (item, index) => {
                await queryDB(`INSERT INTO detail_hasil_test (id_master_test, id_soal, jawaban, nilai_jawaban)
                VALUES (?, 5, ?, ?)`, [id_master_test, `${index + 1}. ${item.jawaban !== undefined ? item.jawaban : '-'}`, result])
            })
            if (result >= 25) {
                score_2 = 'Tinggi sekali'
            }
            if (result >= 16 && result <= 24) {
                score_2 = 'Tinggi'
            }
            if (result >= 8 && result <= 15) {
                score_2 = 'Sedang'
            }
            if (result <= 7) {
                score_2 = 'Rendah'
            }
            console.log({ nilai_jawaban: result, score_2 })
            console.log(getTrueAnswer.length)
            await queryDB(`UPDATE master_hasil_test set skor_subtest_2=? where id_identitas=?`,
                [score_2, identitas])
        }
        return response.ok({ status: "SUKSES", pesan: pesan }, 200, res);
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.getTestMatematika_3 = async (req, res) => {
    try {
        let address
        const getSoal = await queryDB(`SELECT REPLACE(SUBSTR(soal,1, 3), '.', '') + 0 AS no, soal, jawaban_a, jawaban_b, jawaban_c, jawaban_d, jawaban_e 
        FROM soal_web_test WHERE id_soal<>1 AND jenis_test='subtest_3' ORDER BY no ASC`)
        const sortData = getSoal.rows.sort((a, b) => a.no - b.no)
        response.ok({ status: 'SUKSES', pesan: sortData }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.handleTestMatematika_3 = async (req, res) => {
    try {
        let sum = 0
        let score_3, pesan
        const data = req.body
        const { email } = decodedToken(req)
        const getId = await queryDB(`select * from identitas_pelamar where email_auth=?`, [email])
        const identitas = getId.rows[0].id_identitas
        const answer = await queryDB(`select jawaban_benar from soal_web_test where id_soal=6`)
        const trueAnswer = answer.rows.map(x => x.jawaban_benar)
        const employeAnswer = data.map((x, y) => `${x.soal.match(/^\d{2}|^\d/gm)}. ${x.jawaban}`)
        const getIdMasterTest = await queryDB(`select * from master_hasil_test where id_identitas=?`, [identitas])
        const id_master_test = getIdMasterTest.rows[0]?.id_master_test
        const getTrueAnswer = employeAnswer.diff(trueAnswer)
        const result = getTrueAnswer?.length / 30 * 200
        const validation = await queryDB(`SELECT id_soal FROM detail_hasil_test where id_soal=6 and id_master_test=?`, [id_master_test])
        const checkmaster = await queryDB(`select * from master_hasil_test where id_identitas=?`, [getId.rows[0].id_identitas])
        const checkPersonal = await queryDB(`select * from tambahan_informasi_pelamar where id_identitas =?`, [identitas])
        const checkTest = await queryDB(`select * from master_hasil_test where id_identitas=?`, [identitas])
        const checklampiran = await queryDB(`select * from lampiran_pelamar where id_identitas =?`, [identitas])
        const checkData = await queryDB(`select * from detail_hasil_test where id_master_test=? and id_soal=6`, [getIdMasterTest.rows[0].id_master_test])

        // validation checking add data
        if (checkData.rows.length > 0) {
            return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
        }
        if (checkmaster.rows[0]?.skor_test_buta_warna && checkmaster.rows[0]?.skor_test_aq &&
            checkmaster.rows[0]?.skor_subtest_1 && checkmaster.rows[0]?.skor_subtest_2 && checkmaster.rows[0]?.skor_subtest_3) {
            return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
        }
        if (!getId.rows[0]?.nama_lengkap && !getId.rows[0]?.jenis_kelamain &&
            !getId.rows[0]?.tinggi_badan && !getId.rows[0]?.posisi_dilamar && !getId.rows[0]?.pendidikan_terakhir &&
            !getId.rows[0]?.jurusan_terakhir && !getId.rows[0]?.tempat_lahir && !getId.rows[0]?.tanggal_lahir && !getId.rows[0]?.alamat_ktp &&
            !getId.rows[0]?.alamat_domisili && !getId.rows[0]?.email && !getId.rows[0]?.nomor_hp && !getId.rows[0]?.sumber_informasi_loker &&
            !checkPersonal.rows[0]?.pengalaman_kerja) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checkPersonal.rows[0]?.kelebihan_kekurangan && !checkPersonal.rows[0]?.sosial_pelamar &&
            !checkPersonal.rows[0]?.kritik_untuk_pelamar && !checkPersonal.rows[0]?.rencana_pelamar_ketika_diterima &&
            !checkPersonal.rows[0]?.gaji_pelamar_saat_ini && !checkPersonal.rows[0]?.gaji_yang_diharapkan_pelamar) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checklampiran.rows[0]?.cv_pelamar && !checklampiran.rows[0]?.ktp_pelamar && !checklampiran.rows[0]?.ijazah_pelamar) {
            return response.ok({ status: 'GAGAL', pesan: "Informasi personal karyawan belum diisi dengan lengkap!" }, 301, res)
        }
        if (!checkTest.rows[0].skor_test_aq) {
            return response.ok({ status: 'GAGAL', pesan: "Test AQ belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }
        if (!checkTest.rows[0].bukti_test_buta_warna) {
            return response.ok({ status: 'GAGAL', pesan: "Test Buta Warna belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }
        if (!checkTest.rows[0].skor_test_aq) {
            return response.ok({ status: 'GAGAL', pesan: "Test AQ belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }
        if (!checkTest.rows[0].bukti_test_buta_warna) {
            return response.ok({ status: 'GAGAL', pesan: "Test Buta Warna belum dikerjakan! Test harus diisi secara berurutan" }, 301, res)
        }
        //main
        if (validation.rows.length > 0) {
            pesan = 'Jawaban sudah disimpan'
        }
        if (id_master_test === null) {
            pesan = 'endpoint memerlukan auth !'
        } else {
            pesan = 'Data berhasil di simpan'
            data.map(async (item, index) => {
                await queryDB(`INSERT INTO detail_hasil_test (id_master_test, id_soal, jawaban, nilai_jawaban)
                VALUES (?, 6, ?, ?)`, [id_master_test, `${item.soal.match(/^\d{2}|^\d/gm)}. ${item.jawaban !== undefined ? item.jawaban : '-'}`, getTrueAnswer?.length])
            })
            if (result >= 161) {
                score_3 = 'Baik sekali'
            }
            if (result >= 121 && result <= 160) {
                score_3 = 'Baik'
            }
            if (result >= 81 && result <= 120) {
                score_3 = 'Rata-rata'
            }
            if (result >= 41 && result <= 80) {
                score_3 = 'Dibawah rata-rata'
            }
            if (result <= 40) {
                score_3 = 'Kurang'
            }
            console.log({ nilai_jawaban: result, score_3 })
            console.log(getTrueAnswer.length)
            await queryDB(`UPDATE master_hasil_test set skor_subtest_3=? where id_identitas=?`, [score_3, identitas])
            if (getIdMasterTest.rows[0].skor_test_aq !== null && getIdMasterTest.rows[0].skor_test_buta_warna !== null) {
                await queryDB(`UPDATE master_hasil_test set tanggal_selesai_test=now() where id_identitas=?`, [identitas])
            }
        }
        return response.ok({ status: "SUKSES", pesan: pesan }, 200, res);
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}
