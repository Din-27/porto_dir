const { queryDB, dumpError } = require('../../../config/conn/tabel')
const { zip, COMPRESSION_LEVEL } = require('zip-a-folder');
const response = require('../../../config/res/res')
const { CreatePDF } = require('./createPdf');
const date = require('date-and-time');
const rimraf = require('rimraf');
const lodash = require('lodash')
var Minio = require('minio')
require('dotenv').config()
const fs = require('fs');


exports.getListEmployerTest = async (req, res) => {
    try {
        let score1, score2, score3, tambahan
        const getIdentitas = await queryDB(`SELECT ip.id_identitas, nama_lengkap, email_auth, 
        CONCAT(pendidikan_terakhir, ' - ', jurusan_terakhir) AS pendidikan, 
        posisi_dilamar, alamat_domisili, skor_test_buta_warna, skor_test_aq, IF(skor_subtest_1='Baik sekali', 1, 0) 
        + IF(skor_subtest_2='Baik sekali', 1, 0) + IF(skor_subtest_3='Baik sekali', 1, 0) AS nilai,
        tanggal_selesai_test FROM master_hasil_test mhs JOIN identitas_pelamar ip ON(mhs.id_identitas=ip.id_identitas)`)
        const data = getIdentitas.rows.filter((item) => item.tanggal_selesai_test !== null)
        data.length === 0 ? tambahan = 'tidak ada data !' : tambahan = score1 + score2 + score3
        response.ok({ status: "SUKSES", pesan: data }, 200, res);
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "SUKSES", error: e.message }, 300, res);
    }
}

exports.handleSearch = async (req, res) => {
    try {
        const { search } = req.body
        const searchList = await queryDB(`SELECT nama_lengkap, CONCAT(pendidikan_terakhir, ' - ', jurusan_terakhir) AS pendidikan, 
        posisi_dilamar, alamat_domisili, bukti_test_buta_warna, skor_test_buta_warna, skor_test_aq
        FROM master_hasil_test mhs JOIN identitas_pelamar ip ON(mhs.id_identitas=ip.id_identitas) 
        WHERE nama_lengkap LIKE '%${search}%' OR posisi_dilamar LIKE '%${search}%'`)
        response.ok({ status: "SUKSES", pesan: searchList.rows }, 200, res);
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.detailPenilaianAq = async (req, res) => {
    try {
        const { nama, jurusan, email } = req.body
        const getIdIdentitas = await queryDB(`SELECT id_identitas FROM identitas_pelamar WHERE nama_lengkap=? AND jurusan_terakhir=? 
            and email_auth=?`,
            [nama, jurusan, email])
        //
        const getDetailEmployer = await queryDB(`SELECT REPLACE(REPLACE(LEFT(jawaban, 2), '.', ''), ' ', '') + 0 AS no, jawaban, 
        nama_lengkap, skor_test_aq, tanggal_mulai_test FROM detail_hasil_test dhs 
        JOIN master_hasil_test mhs ON(mhs.id_master_test=dhs.id_master_test) JOIN identitas_pelamar ip ON(ip.id_identitas=mhs.id_identitas) 
        WHERE ip.id_identitas=? AND dhs.id_soal=1 ORDER BY no ASC`,
            [getIdIdentitas.rows[0]?.id_identitas])

        const data = getDetailEmployer.rows.map((x, y) => `${x.jawaban.slice(0, 6).replace(/\.$|\.\ $/gm, '').toUpperCase()}`)
        return response.ok({
            status: 'SUKSES', pesan: {
                nama_lengkap: getDetailEmployer.rows[0].nama_lengkap,
                tanggal: date.format(getDetailEmployer.rows[0]?.tanggal_mulai_test, 'ddd, MMM DD YYYY'),
                tipe: getDetailEmployer.rows[0]?.skor_test_aq,
                jawaban: data.sort((a, z) => a.no - z.no)
            }
        }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.penilaianMatematikaSubtest = async (req, res) => {
    try {
        const { nama, jurusan, email } = req.body
        const getIdIdentitas = await queryDB(`SELECT id_identitas FROM identitas_pelamar WHERE nama_lengkap=? AND jurusan_terakhir=? and email_auth=?`,
            [nama, jurusan, email])

        const getSubtest = await queryDB(`SELECT skor_subtest_1, skor_subtest_2, skor_subtest_3 FROM master_hasil_test WHERE id_identitas=?`,
            [getIdIdentitas.rows[0]?.id_identitas])

        const data = {
            Kemampuan_angka: getSubtest.rows[0]?.skor_subtest_1,
            Penalaran_abstrak: getSubtest.rows[0]?.skor_subtest_2,
            Kecepatan_dan_Kelitian: getSubtest.rows[0]?.skor_subtest_3
        }
        return response.ok({ status: 'SUKSES', pesan: data }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.detailPenilaianMatematikaSubtest_1 = async (req, res) => {
    try {
        const { id_identitas } = req.params
        const getData = await queryDB(`(SELECT id_detail_test, jawaban, replace(replace(left(jawaban, 3), ' ', ''), '.', '') + 0 as no 
        FROM identitas_pelamar ip JOIN master_hasil_test mhs 
        ON(ip.id_identitas=mhs.id_identitas) JOIN detail_hasil_test dhs ON(mhs.id_master_test=dhs.id_master_test) 
        WHERE ip.id_identitas=? AND dhs.id_soal=2 GROUP BY no order by no asc)`, [id_identitas])
        const getData2 = await queryDB(`(SELECT id_detail_test, jawaban, replace(replace(left(jawaban, 3), ' ', ''), '.', '') + 0 as no 
        FROM identitas_pelamar ip JOIN master_hasil_test mhs 
        ON(ip.id_identitas=mhs.id_identitas) JOIN detail_hasil_test dhs ON(mhs.id_master_test=dhs.id_master_test) 
        WHERE ip.id_identitas=? AND dhs.id_soal=3 GROUP BY no order by no asc)`, [id_identitas])
        const getData3 = await queryDB(`(SELECT id_detail_test, jawaban, REPLACE(REPLACE(LEFT(jawaban, 3), ' ', ''), '.', '') + 0 AS no 
        FROM identitas_pelamar ip JOIN master_hasil_test mhs 
        ON(ip.id_identitas=mhs.id_identitas) JOIN detail_hasil_test dhs ON(mhs.id_master_test=dhs.id_master_test) 
        WHERE ip.id_identitas=? AND dhs.id_soal=4  GROUP BY no order by no asc)`, [id_identitas])
        //
        const getDetailData = await queryDB(`SELECT nama_lengkap, skor_subtest_1, tanggal_mulai_test FROM detail_hasil_test dhs 
        JOIN master_hasil_test mhs ON(mhs.id_master_test=dhs.id_master_test) JOIN identitas_pelamar ip ON(ip.id_identitas=mhs.id_identitas) 
        WHERE ip.id_identitas=? limit 1`,
            [id_identitas])
        //
        const data = {
            identitas: getDetailData.rows[0],
            jawaban: {
                subtest_1a: getData.rows.map((x, y) => `${x.jawaban.slice(2) === '-' ? x?.jawaban : x?.jawaban.slice(0, 5).replace(/\.$/gm, '')}`),
                subtest_1b: getData2.rows.map((x, y) => `${x.jawaban.slice(2) === '-' ? x?.jawaban : x?.jawaban.slice(0, 5).replace(/\.$/gm, '')}`),
                subtest_1c: getData3.rows.map((x, y) => `${x.jawaban.slice(2) === '-' ? x?.jawaban : x?.jawaban.slice(0, 5).replace(/\.$/gm, '')}`)
            }
        }
        response.ok({ status: "SUKSES", pesan: data }, 200, res);
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.detailPenilaianMatematikaSubtest_2 = async (req, res) => {
    try {
        const { id_identitas } = req.params
        const getData = await queryDB(`SELECT REPLACE(LEFT(jawaban,2), '.', '') + 0 no, SUBSTR(jawaban, 1, 5) as jawaban FROM identitas_pelamar ip JOIN master_hasil_test mhs ON(ip.id_identitas=mhs.id_identitas)
        JOIN detail_hasil_test dhs ON(mhs.id_master_test=dhs.id_master_test) WHERE ip.id_identitas=? AND dhs.id_soal=5 ORDER BY no ASC`,
            [id_identitas])
        //
        const getDetailData = await queryDB(`SELECT nama_lengkap, skor_subtest_2, tanggal_mulai_test FROM detail_hasil_test dhs 
        JOIN master_hasil_test mhs ON(mhs.id_master_test=dhs.id_master_test) JOIN identitas_pelamar ip ON(ip.id_identitas=mhs.id_identitas) 
        WHERE ip.id_identitas=? limit 1`,
            [id_identitas])
        //
        const data1 = getData.rows.map((item, index) => `${item?.jawaban !== "undefined" ? item?.jawaban.replace(/\.$/gm, '') : "-"}`)
        const data = {
            identitas: getDetailData.rows[0],
            jawaban: data1.sort((x, y) => parseFloat(x) - parseFloat(y))
        }
        response.ok({ status: "SUKSES", pesan: data }, 200, res);
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.detailPenilaianMatematikaSubtest_3 = async (req, res) => {
    try {
        const { id_identitas } = req.params
        const getData = await queryDB(`SELECT REPLACE(LEFT(jawaban,2), '.', '') + 0 no, REPLACE(REPLACE(REPLACE(LEFT(jawaban,5), ' ', ''), 'un', '-'), 'u', '-') AS jawaban FROM identitas_pelamar ip JOIN master_hasil_test mhs ON(ip.id_identitas=mhs.id_identitas)
        JOIN detail_hasil_test dhs ON(mhs.id_master_test=dhs.id_master_test) WHERE ip.id_identitas=? AND dhs.id_soal=6 ORDER BY no ASC`,
            [id_identitas])
        //
        const getDetailData = await queryDB(`SELECT nama_lengkap, skor_subtest_3, tanggal_mulai_test FROM detail_hasil_test dhs 
        JOIN master_hasil_test mhs ON(mhs.id_master_test=dhs.id_master_test) JOIN identitas_pelamar ip ON(ip.id_identitas=mhs.id_identitas) 
        WHERE ip.id_identitas=? limit 1`,
            [id_identitas])
        //
        const data1 = getData.rows.map((item, index) => item?.jawaban.replace(/\.$/gm, ''))
        const data = {
            identitas: getDetailData.rows[0],
            jawaban: data1
        }
        response.ok({ status: "SUKSES", pesan: data }, 200, res);
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.detailTesButaWarna = async (req, res) => {
    try {
        let data
        const { nama, jurusan, email } = req.body
        const getIdIdentitas = await queryDB(`SELECT id_identitas FROM identitas_pelamar WHERE nama_lengkap=? AND jurusan_terakhir=? and email_auth=?`,
            [nama, jurusan, email])
        const id_identitas = getIdIdentitas.rows[0]?.id_identitas
        //
        const getPhotoTest = await queryDB(`select bukti_test_buta_warna, skor_test_buta_warna from master_hasil_test where id_identitas=?`,
            [id_identitas])
        //
        const getDetailData = await queryDB(`SELECT nama_lengkap, skor_test_buta_warna, tanggal_mulai_test FROM detail_hasil_test dhs 
        JOIN master_hasil_test mhs ON(mhs.id_master_test=dhs.id_master_test) JOIN identitas_pelamar ip ON(ip.id_identitas=mhs.id_identitas) 
        WHERE ip.id_identitas=?`,
            [id_identitas])
        if (getPhotoTest.rows.length > 0) {
            data = {
                identitas: getDetailData.rows[0],
                photo: `${process.env.IMAGE_URL}${getPhotoTest.rows[0]?.bukti_test_buta_warna}`,
            }
        } else {
            data = 'pelamar belum mengerjakan soal!'
        }
        return response.ok({ status: "SUKSES", pesan: data }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.photo_pengerjaan = async (req, res) => {
    try {
        let data
        const { nama, jurusan, email } = req.body
        const getIdIdentitas = await queryDB(`SELECT id_identitas FROM identitas_pelamar WHERE nama_lengkap=? AND jurusan_terakhir=? AND email_auth=?`,
            [nama, jurusan, email])
        //
        const getPhotoPengerjaan = await queryDB(`select * from photo_pengerjaan_pelamar where id_identitas=?`,
            [getIdIdentitas.rows[0]?.id_identitas])
        //
        if (getPhotoPengerjaan.rows.length > 0) {
            data = [
                { url: process.env.IMAGE_URL },
                { test_aq: getPhotoPengerjaan.rows.map((x) => x.test_aq) },
                { subtest_1: getPhotoPengerjaan.rows.map((x) => x.subtest_1) },
                { subtest_2: getPhotoPengerjaan.rows.map((x) => x.subtest_2) },
                { subtest_3: getPhotoPengerjaan.rows.map((x) => x.subtest_3) }
            ]
        } else {
            data = 'pelamar belum mengerjakan soal!'
        }
        return response.ok({ status: "SUKSES", pesan: data }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.download_attachments = async (req, res) => {
    try {
        var minioClient = new Minio.Client({
            endPoint: process.env.S3_HOST,
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
        });
        const { nama, jurusan, email } = req.body
        const getIdIdentitas = await queryDB(`SELECT id_identitas FROM identitas_pelamar WHERE nama_lengkap=? AND jurusan_terakhir=? and email_auth=?`,
            [nama, jurusan, email])
        const getFile = await queryDB(`SELECT * FROM lampiran_pelamar WHERE id_identitas=?`, [getIdIdentitas.rows[0]?.id_identitas])
        const files = [getFile.rows[0]?.cv_pelamar, getFile.rows[0]?.ktp_pelamar, getFile.rows[0]?.ijazah_pelamar]
        if (getFile.rows[0]?.cv_pelamar && getFile.rows[0]?.ktp_pelamar && getFile.rows[0]?.ijazah_pelamar) {
            const promises = files.map(async (file) => {
                if (fs.existsSync(`${__dirname}/tmp`)) {
                    rimraf.sync(`${__dirname}/tmp`);
                }
                await minioClient.fGetObject('knitto-karir', file, `${__dirname}/tmp/${file}`);
                await CreatePDF(queryDB, fs, `${__dirname}/tmp`, nama, jurusan);
                await zip(`${__dirname}/tmp`, `${__dirname.slice(0, -20)}/doc/Document_(${nama.toUpperCase().replace(' ', '_')}).zip`,
                    { compression: COMPRESSION_LEVEL.high });
            });
            await Promise.all(promises)
            return res.status(200).send({ url: `https://${process.env.EXPOSED_HOST}/doc/Document_(${nama.toUpperCase().replace(' ', '_')}).zip` });
        }
        return res.status(404).send({ pesan: 'data pelamar tidak ditemukan !' })
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}
