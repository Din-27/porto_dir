const { queryDB, dumpError, decodedToken } = require('../../../config/conn/tabel')
const response = require('../../../config/res/res')

exports.handleDashboardEmployee = async (req, res) => {
    try {
        let statusTesAq = 'disable'
        let statusIdentitas = 'enable'
        let statusButaWarna = 'disable'
        let statusMatematika = 'disable'
        let msgTesAq = 'Belum dikerjakan'
        let msgIdentitas = 'Belum dikerjakan'
        let msgButaWarna = 'Belum dikerjakan'
        let msgMatematika = 'Belum dikerjakan'

        let responseCode = 200;
        let statusResponse = "SUKSES";
        const { email } = decodedToken(req)
        //
        const getId = await queryDB(`select * from identitas_pelamar where email_auth=?`, [email])
        const identitas = getId.rows[0].id_identitas
        const getID = await queryDB(`select id_master_test from master_hasil_test where id_identitas=?`, [identitas])
        //
        const getStatus = await queryDB(`select * from master_hasil_test where id_identitas=? and id_master_test=?`,
            [identitas, getID.rows[0]?.id_master_test])
        //
        const getStatusPersonal = await queryDB(`select nama_lengkap from identitas_pelamar where id_identitas=?`,
            [identitas, email])
        const getStatusPersonalIdentitas = await queryDB(`select cv_pelamar from lampiran_pelamar where id_identitas=?`,
            [identitas])
        const getStatusPersonalTambahan = await queryDB(`select kelebihan_kekurangan from tambahan_informasi_pelamar where id_identitas=?`,
            [identitas])
        //
        if (getStatusPersonalTambahan.rows[0]?.kelebihan_kekurangan &&
            getStatusPersonalIdentitas.rows[0]?.cv_pelamar &&
            getStatusPersonal.rows[0]?.nama_lengkap) {
            msgIdentitas = 'Sudah diisi'
        }
        if (getStatus.rows[0]?.bukti_test_buta_warna !== null) {
            msgButaWarna = 'Sudah diisi'
        }
        if (getStatus.rows[0]?.skor_test_aq !== null) {
            msgTesAq = 'Sudah diisi'
        }
        if (getStatus.rows[0]?.skor_subtest_3 !== null) {
            msgMatematika = 'Sudah diisi'
        }
        if (msgIdentitas === 'Sudah diisi') {
            statusIdentitas = 'disable'
            statusTesAq = 'enable'
            statusButaWarna = 'disable'
            statusMatematika = 'disable'
        }
        if (msgIdentitas === 'Sudah diisi' && msgTesAq === 'Sudah diisi') {
            statusIdentitas = 'disable'
            statusTesAq = 'disable'
            statusButaWarna = 'enable'
            statusMatematika = 'disable'
        }
        if (msgIdentitas === 'Sudah diisi' && msgTesAq === 'Sudah diisi' && msgButaWarna === 'Sudah diisi') {
            statusIdentitas = 'disable'
            statusTesAq = 'disable'
            statusButaWarna = 'disable'
            statusMatematika = 'enable'
        }
        if (msgIdentitas === 'Sudah diisi' && msgTesAq === 'Sudah diisi' && msgButaWarna === 'Sudah diisi' && msgMatematika === 'Sudah diisi') {
            statusIdentitas = 'disable'
            statusTesAq = 'disable'
            statusButaWarna = 'disable'
            statusMatematika = 'disable'
        }
        const questionTestList = [
            { email: email },
            { quest: "Informasi Personal Karyawan", msg: msgIdentitas, status: statusIdentitas },
            { quest: "Tes AQ", msg: msgTesAq, status: statusTesAq },
            { quest: "Tes Buta Warna", msg: msgButaWarna, status: statusButaWarna },
            { quest: "Tes Matematika Dasar", msg: msgMatematika, status: statusMatematika },
        ]
        return response.ok({ status: statusResponse, pesan: questionTestList }, responseCode, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.handlePhotoPengerjaan = async (req, res) => {
    try {
        const { email } = decodedToken(req)
        const getId = await queryDB(`select id_identitas from identitas_pelamar where email_auth=?`, [email])
        const identitas = getId.rows[0].id_identitas
        const photo_1 = req.files.photo_1[0].key
        const photo_2 = req.files.photo_2[0].key
        const photo_3 = req.files.photo_3[0].key
        const fileSize = parseInt(req.headers["content-length"])
        if (fileSize > 1000000) {
            return response.ok({ status: 'GAGAL', pesan: "ukuran photo lebih dari 1MB" }, 300, res)
        }
        const getValidations = await queryDB(`select * from photo_pengerjaan_pelamar where id_identitas=?`, [identitas])
        //
        const dataPhoto = [photo_1, photo_2, photo_3]
        for (let i = 0; i < dataPhoto.length; i++) {
            if (getValidations.rows.length === 0) {
                console.log(1)
                await queryDB(`INSERT INTO photo_pengerjaan_pelamar (no, id_identitas, test_aq)
                values (?, ?, ?)`, [i + 1, identitas, dataPhoto[i]])
            }
            if (getValidations.rows[0]?.subtest_2 !== null && getValidations.rows[0]?.subtest_3 === null) {
                console.log(2)
                await queryDB(`UPDATE photo_pengerjaan_pelamar set subtest_3=? where id_identitas=? and no=?`, [dataPhoto[i], identitas, i + 1])
            }
            if (getValidations.rows[0]?.subtest_1 !== null && getValidations.rows[0]?.subtest_2 === null) {
                console.log(3)
                await queryDB(`UPDATE photo_pengerjaan_pelamar set subtest_2=? where id_identitas=? and no=?`, [dataPhoto[i], identitas, i + 1])
            }
            if (getValidations.rows[0]?.subtest_1 === null && getValidations.rows[0].subtest_2 === null) {
                console.log(4)
                await queryDB(`UPDATE photo_pengerjaan_pelamar set subtest_1=? where id_identitas=? and no=?`, [dataPhoto[i], identitas, i + 1])
            }
        }
        return response.ok({ status: 'SUKSES', pesan: "photo berhasil disimpan" }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}
