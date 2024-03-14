const { queryDB, dumpError } = require('../../../config/conn/tabel')
const response = require('../../../config/res/res')
const date = require('date-and-time');
require('dotenv').config()

exports.handlePrintTestAQ = async (req, res) => {
    try {

        let tipe, kesimpulan
        const { nama_lengkap, jurusan } = req.body
        const getIdIdentitas = await queryDB(`SELECT id_identitas FROM identitas_pelamar WHERE nama_lengkap=? AND jurusan_terakhir=?`,
            [nama_lengkap, jurusan])
        if (getIdIdentitas.rows.length === 0) {
            return response.ok({ status: "GAGAL", pesan: 'pelamar belum mengisi personal information' }, 200, res)
        }
        const getDetailEmployer = await queryDB(`SELECT * FROM detail_hasil_test dhs JOIN master_hasil_test mhs 
        ON(mhs.id_master_test=dhs.id_master_test) JOIN identitas_pelamar ip ON(ip.id_identitas=mhs.id_identitas) WHERE ip.id_identitas=?`,
            [getIdIdentitas.rows[0]?.id_identitas])

        if (getDetailEmployer.rows[0]?.skor_test_aq === 'CLIMBER' && getDetailEmployer.rows[0]?.skor_subtest_1 === 'Baik sekali' ||
            getDetailEmployer.rows[0]?.skor_subtest_2 === 'Baik sekali' || getDetailEmployer.rows[0]?.skor_subtest_3 === 'Baik sekali') {
            kesimpulan = `Kandidat disarankan untuk posisi pekerjaan di lapangan yang penuh tantangan dan 
            membutuhkan daya tahan serta daya juang yang cukup tinggi`
        }
        if (getDetailEmployer.rows[0]?.skor_test_aq === 'QUITER') {
            kesimpulan = `-`
        }
        if (getDetailEmployer.rows[0]?.skor_test_aq === 'CAMPER') {
            kesimpulan = `-`
        }
        const data = {
            nama_lengkap: getDetailEmployer.rows[0].nama_lengkap,
            tanggal_test: date.format(getDetailEmployer.rows[0].tanggal_mulai_test, 'ddd, MMM DD YYYY'),
            tipe: getDetailEmployer.rows[0]?.skor_test_aq,
            kesimpulan: kesimpulan
        }
        return response.ok({ status: "SUKSES", pesan: data }, 200, res)
    } catch (error) {
        console.log(error)
        dumpError(error)
    }
}

exports.handlePrintTestMatematika = async (req, res) => {
    try {

        let tipe, kesimpulan
        const { nama_lengkap, jurusan } = req.body
        const getIdIdentitas = await queryDB(`SELECT id_identitas FROM identitas_pelamar WHERE nama_lengkap=? AND jurusan_terakhir=?`,
            [nama_lengkap, jurusan])
        if (getIdIdentitas.rows.length === 0) {
            return response.ok({ status: "GAGAL", pesan: 'pelamar belum mengisi personal information' }, 200, res)
        }
        const getDetailEmployer = await queryDB(`SELECT * FROM detail_hasil_test dhs JOIN master_hasil_test mhs 
        ON(mhs.id_master_test=dhs.id_master_test) JOIN identitas_pelamar ip ON(ip.id_identitas=mhs.id_identitas) WHERE ip.id_identitas=?`,
            [getIdIdentitas.rows[0].id_identitas])
        //
        const id_master_test = getDetailEmployer.rows[0]?.id_master_test
        const getNilaiSubtest_1a = await queryDB(`select nilai_jawaban from detail_hasil_test where id_soal=2 and id_master_test=? limit 1`,
            [id_master_test])
        //
        const getNilaiSubtest_1b = await queryDB(`select nilai_jawaban from detail_hasil_test where id_soal=3 and id_master_test=? limit 1`,
            [id_master_test])
        //
        const getNilaiSubtest_1c = await queryDB(`select nilai_jawaban from detail_hasil_test where id_soal=4 and id_master_test=? limit 1`,
            [id_master_test])
        //
        const getNilaiSubtest_2 = await queryDB(`select nilai_jawaban from detail_hasil_test where id_soal=5 and id_master_test=? limit 1`,
            [id_master_test])
        //
        const getNilaiSubtest_3 = await queryDB(`select nilai_jawaban from detail_hasil_test where id_soal=6 and id_master_test=? limit 1`,
            [id_master_test])
        //
        if (getDetailEmployer.rows[0]?.skor_test_aq === 'CLIMBER' && getDetailEmployer.rows[0]?.skor_subtest_1 === 'Baik sekali' ||
            getDetailEmployer.rows[0]?.skor_subtest_2 === 'Baik sekali' || getDetailEmployer.rows[0]?.skor_subtest_3 === 'Baik sekali') {
            kesimpulan = `Kandidat disarankan untuk posisi pekerjaan di lapangan yang penuh tantangan dan 
            membutuhkan daya tahan serta daya juang yang cukup tinggi`
        }
        if (getDetailEmployer.rows[0]?.skor_test_aq === 'QUITER') {
            kesimpulan = `-`
        }
        if (getDetailEmployer.rows[0]?.skor_test_aq === 'CAMPER') {
            kesimpulan = `-`
        }
        const data = {
            nama_lengkap: getDetailEmployer.rows[0]?.nama_lengkap,
            tanggal_test: date.format(getDetailEmployer.rows[0]?.tanggal_mulai_test, 'ddd, MMM DD YYYY'),
            Kemampuan_angka: getDetailEmployer.rows[0]?.skor_subtest_1,
            nilai_test_seri: getNilaiSubtest_1a.rows[0]?.nilai_jawaban,
            nilai_operasi_bilangan: getNilaiSubtest_1b.rows[0]?.nilai_jawaban,
            nilai_pengetahuan_matematika: getNilaiSubtest_1c.rows[0]?.nilai_jawaban,
            penalaran_abstrak: getDetailEmployer.rows[0]?.skor_subtest_2,
            symbol_1: getNilaiSubtest_2.rows[0]?.nilai_jawaban,
            kecepatan_ketelitian: getDetailEmployer.rows[0]?.skor_subtest_3,
            Membandingkan_Nama: getNilaiSubtest_3.rows[0]?.nilai_jawaban,
            kesimpulan: kesimpulan
        }
        return response.ok({ status: "SUKSES", pesan: data }, 200, res)
    } catch (error) {
        console.log(error)
        dumpError(error)
    }
}

exports.handlePrintTestButaWarna = async (req, res) => {
    try {

        let tipe, kesimpulan
        const { nama_lengkap, jurusan } = req.body
        const getIdIdentitas = await queryDB(`SELECT id_identitas FROM identitas_pelamar WHERE nama_lengkap=? AND jurusan_terakhir=?`,
            [nama_lengkap, jurusan])
        if (getIdIdentitas.rows.length === 0) {
            return response.ok({ status: "GAGAL", pesan: 'pelamar belum mengisi personal information' }, 200, res)
        }
        //
        const getDetailEmployer = await queryDB(`SELECT * FROM detail_hasil_test dhs JOIN master_hasil_test mhs 
        ON(mhs.id_master_test=dhs.id_master_test) JOIN identitas_pelamar ip ON(ip.id_identitas=mhs.id_identitas) WHERE ip.id_identitas=?`,
            [getIdIdentitas.rows[0]?.id_identitas])
        //
        const getNilai = await queryDB(`select * from master_hasil_test where id_master_test=?`,
            [getDetailEmployer.rows[0]?.id_master_test])
        //
        if (getDetailEmployer.rows[0]?.skor_test_aq === 'CLIMBER' && getDetailEmployer.rows[0]?.skor_subtest_1 === 'Baik sekali' ||
            getDetailEmployer.rows[0]?.skor_subtest_2 === 'Baik sekali' || getDetailEmployer.rows[0]?.skor_subtest_3 === 'Baik sekali') {
            kesimpulan = `Kandidat disarankan untuk posisi pekerjaan di lapangan yang penuh tantangan dan 
            membutuhkan daya tahan serta daya juang yang cukup tinggi`
        }
        if (getDetailEmployer.rows[0]?.skor_test_aq === 'QUITER') {
            kesimpulan = `-`
        }
        if (getDetailEmployer.rows[0]?.skor_test_aq === 'CAMPER') {
            kesimpulan = `-`
        }
        const data = {
            nama_lengkap: getDetailEmployer.rows[0]?.nama_lengkap,
            tanggal_test: date.format(getDetailEmployer.rows[0]?.tanggal_mulai_test, 'ddd, MMM DD YYYY'),
            skor: getNilai.rows[0]?.skor_test_buta_warna,
            photo: `${process.env.IMAGE_URL}${getNilai.rows[0]?.bukti_test_buta_warna}`,
            kesimpulan: kesimpulan
        }
        return response.ok({ status: "SUKSES", pesan: data }, 200, res)
    } catch (error) {
        console.log(error)
        dumpError(error)
    }
}