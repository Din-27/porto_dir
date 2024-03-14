const { queryDB, dumpError, sendMessage, decodedToken } = require('../../../config/conn/tabel')
const response = require('../../../config/res/res')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

exports.handleEmailAuth = async (req, res) => {
    try {
        const { email } = req.body
        let responseCode = 300
        let statusResponse = 'GAGAL'
        let pesan = 'Maaf email sudah pernah digunakan, silahkan masuk menggunakan link yang sudah dikirimkan via email'
        if (email.length === 0) {
            return response.ok({ error: 'email tidak boleh kosong !' }, 300, res)
        }
        if (!email.match(/(\W|^)[\w.+\-]*@gmail\.com(\W|$)/)) {
            return response.ok({ error: 'email tidak valid' }, 300, res)
        }
        const emailValidations = await queryDB(`select * from auth_pelamar where email_auth=?`, [email])
        const checkData = await queryDB(`select id_identitas from identitas_pelamar where email_auth=?`, [email])
        const identitas = checkData.rows[0]?.id_identitas
        if (emailValidations.rows.length === 0) {
            responseCode = 200;
            statusResponse = "SUKSES";
            await queryDB(`INSERT INTO auth_pelamar (id, email_auth) VALUES (null, ?)`, [email])
            await queryDB(`INSERT INTO identitas_pelamar 
            (id_identitas, email_auth, nama_lengkap, jenis_kelamin, tinggi_badan, posisi_dilamar, pendidikan_terakhir,
            jurusan_terakhir, tempat_lahir, tanggal_lahir, alamat_ktp, alamat_domisili, email, nomor_hp, sumber_informasi_loker, pengalaman_kerja) 
            VALUES (null, ?, null, null, null, null, null, null, null, null, null, null, null, null, null, null)`,
                [email])
            const checkData1 = await queryDB(`select id_identitas from identitas_pelamar where email_auth=?`, [email])
            await queryDB(`INSERT INTO master_hasil_test 
            (id_identitas, id_master_test, bukti_test_buta_warna, skor_test_buta_warna, skor_test_aq, skor_subtest_1, skor_subtest_2,
             skor_subtest_3, tanggal_mulai_test, tanggal_selesai_test) 
            VALUES (?, null, null, null, null, null, null, null, null, null)`,
                [checkData1.rows[0].id_identitas])
            const token = jwt.sign({ email, identitas: checkData1.rows[0].id_identitas }, process.env.TOKEN_KEY)
            pesan = 'sukses login'
            sendMessage(req.body.email, 'recruitment.knitto@gmail.com', 'recruitment.knitto@gmail.com', 'Invitation for Recruitment Test', token)
            return response.ok({ status: statusResponse, pesan: pesan }, responseCode, res)
        }
        responseCode = 300;
        statusResponse = "GAGAL";
        pesan = 'Maaf email sudah pernah digunakan, Mohon untuk cek gmail untuk dapat mengakses link test !'
        return response.ok({ status: statusResponse, pesan: pesan }, responseCode, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.handleResendLinkFromEmail = async (req, res) => {
    try {
        const { email } = req.body
        const emailValidations = await queryDB(`select id from auth_pelamar where email_auth=?`, [email])
        if (emailValidations.rows.length > 0) {
            const checkData = await queryDB(`select id_identitas from identitas_pelamar where email_auth=?`, [email])
            const identitas = checkData.rows[0]?.id_identitas
            const token = jwt.sign({ email, identitas }, process.env.TOKEN_KEY)
            sendMessage(req.body.email, 'recruitment.knitto@gmail.com', 'recruitment.knitto@gmail.com', 'Invitation for Recruitment Test', token)
            return response.ok({ status: 'SUKSES', pesan: 'sukses resend' }, 200, res)
        }
        return res.send('email tidak di temukan!')
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.checkAuthorized = async (req, res) => {
    try {
        const { exp, email } = decodedToken(req)
        const expired = new Date(exp)
        const checkData = await queryDB(`select id_identitas from identitas_pelamar where email_auth=?`, [email])
        if (checkData.rows.length > 0) {
            if (new Date() > expired) {
                return res.send({ pesan: `test hanya berlaku sehari setelah login, mohon untuk login kembali menggunakan email baru !`, 
                expired: new Date() > expired })
            }
            return res.send({ pesan: 'validate', expired: new Date() > expired })
        } else {
            return response.ok({ status: 'GAGAL', pesan: 'user tidak ditemukan !' }, 300, res)
        }
    } catch (e) {
        dumpError(e)
        console.log(e)
        return res.status(400).send({ message: e.message })
    }
}