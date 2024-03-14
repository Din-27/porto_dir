const { queryDB, dumpError, decodedToken } = require('../../../config/conn/tabel')
const response = require('../../../config/res/res')
require('dotenv').config()


exports.getDataPersonalPerson = async (req, res) => {
    try {
        const { email } = decodedToken(req)
        const data = await queryDB(`select * from identitas_pelamar where email_auth=?`, [email])
        return response.ok({
            status: 'SUKSES', pesan: {
                emailPelamar: data.rows.length !== 0 ? data.rows[0].email : "",
                nomor_hp: data.rows.length !== 0 ? data.rows[0].nomor_hp : "",
                alamat_ktp: data.rows.length !== 0 ? data.rows[0].alamat_ktp : "",
                tempat_lahir: data.rows.length !== 0 ? data.rows[0].tempat_lahir : "",
                tinggi_badan: data.rows.length !== 0 ? data.rows[0].tinggi_badan : "",
                nama_lengkap: data.rows.length !== 0 ? data.rows[0].nama_lengkap : "",
                tanggal_lahir: data.rows.length !== 0 ? data.rows[0].tanggal_lahir : "",
                jenis_kelamin: data.rows.length !== 0 ? data.rows[0].jenis_kelamin : "",
                posisi_dilamar: data.rows.length !== 0 ? data.rows[0].posisi_dilamar : "",
                alamat_domisili: data.rows.length !== 0 ? data.rows[0].alamat_domisili : "",
                jurusan_terakhir: data.rows.length !== 0 ? data.rows[0].jurusan_terakhir : "",
                pengalaman_kerja: data.rows.length !== 0 ? data.rows[0].pengalaman_kerja : "",
                pendidikan_terakhir: data.rows.length !== 0 ? data.rows[0].pendidikan_terakhir : "",
                sumber_informasi_loker: data.rows.length !== 0 ? data.rows[0].sumber_informasi_loker : "",
            }
        }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.getDataPersonalPersonAdditional = async (req, res) => {
    try {
        const { email } = decodedToken(req)
        const getId = await queryDB(`select id_identitas from identitas_pelamar where email_auth=?`, [email])
        const identitas = getId.rows[0].id_identitas
        const data = await queryDB(`select * from tambahan_informasi_pelamar where id_identitas=?`, [identitas])
        return response.ok({
            status: 'SUKSES', pesan: {
                sosial_pelamar: data.rows.length !== 0 ? data.rows[0].sosial_pelamar : "",
                kritik_untuk_pelamar: data.rows.length !== 0 ? data.rows[0].kritik_untuk_pelamar : "",
                kelebihan_kekurangan: data.rows.length !== 0 ? data.rows[0].kelebihan_kekurangan : "",
                gaji_pelamar_saat_ini: data.rows.length !== 0 ? data.rows[0].gaji_pelamar_saat_ini : "",
                gaji_yang_diharapkan_pelamar: data.rows.length !== 0 ? data.rows[0].gaji_yang_diharapkan_pelamar : "",
                rencana_pelamar_ketika_diterima: data.rows.length !== 0 ? data.rows[0].rencana_pelamar_ketika_diterima : "",
            }
        }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.handlePersonalPerson = async (req, res) => {

    const {
        emailPelamar,
        nomor_hp,
        alamat_ktp,
        tempat_lahir,
        tinggi_badan,
        nama_lengkap,
        tanggal_lahir,
        jenis_kelamin,
        posisi_dilamar,
        alamat_domisili,
        jurusan_terakhir,
        pengalaman_kerja,
        pendidikan_terakhir,
        sumber_informasi_loker,
    } = req.body
    try {
        const { email } = decodedToken(req)
        const getId = await queryDB(`select id_identitas from identitas_pelamar where email_auth=?`, [email])
        const identitas = getId.rows[0].id_identitas
        const checkPersonal = await queryDB(`select * from identitas_pelamar where id_identitas =?`, [identitas])
        // if (checkPersonal.rows[0]?.nama_lengkap && checkPersonal.rows[0]?.jenis_kelamain
        //     && checkPersonal.rows[0]?.tinggi_badan && checkPersonal.rows[0]?.posisi_dilamar && checkPersonal.rows[0]?.pendidikan_terakhir &&
        //     checkPersonal.rows[0]?.jurusan_terakhir && checkPersonal.rows[0]?.tempat_lahir && checkPersonal.rows[0]?.tanggal_lahir && checkPersonal.rows[0]?.alamat_ktp
        //     && checkPersonal.rows[0]?.alamat_domisili && checkPersonal.rows[0]?.email && checkPersonal.rows[0]?.nomor_hp && checkPersonal.rows[0]?.sumber_informasi_loker &&
        //     checkPersonal.rows[0]?.pengalaman_kerja) {
        //     return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
        // }
        if (tinggi_badan.toString().length > 3) {
            return response.ok({ error: 'tinggi badan minimal 3 digit !' }, res, 300)
        }
        if (posisi_dilamar.length < 2) {
            return response.ok({ error: 'posisi dilamar tidak boleh 1 huruf !' }, 300, res)
        }
        if (!alamat_ktp.replace(/[^a-zA-Z ]/g, "")) {
            return response.ok({ error: 'alamat tidak boleh memakai symbols' }, 300, res)
        }
        if (!emailPelamar.match(/(\W|^)[\w.+\-]*@gmail\.com(\W|$)/)) {
            return response.ok({ error: 'email tidak valid' }, 300, res)
        }
        if (nomor_hp.length > 13) {
            return response.ok({ error: 'nomor hp tidak valid !' }, 300, res)
        }
        if (nomor_hp.length < 12) {
            return response.ok({ error: 'nomor hp tidak valid !' }, 300, res)
        }
        if (nomor_hp.slice(0, 2) !== "08") {
            return response.ok({ error: 'nomor hp tidak valid !' }, 300, res)
        }
        await queryDB(`UPDATE identitas_pelamar 
        set nama_lengkap=?, jenis_kelamin=?, tinggi_badan=?, posisi_dilamar=?, pendidikan_terakhir=?,
        jurusan_terakhir=?, tempat_lahir=?, tanggal_lahir=?, alamat_ktp=?, alamat_domisili=?, email=?, nomor_hp=?,
        sumber_informasi_loker=?, pengalaman_kerja=?
        where id_identitas=? and email_auth=?`,
            [nama_lengkap, jenis_kelamin, parseFloat(tinggi_badan), posisi_dilamar, pendidikan_terakhir,
                jurusan_terakhir, tempat_lahir, tanggal_lahir,
                alamat_ktp, alamat_domisili, emailPelamar, nomor_hp, sumber_informasi_loker, pengalaman_kerja, identitas, email])
        return response.ok({ status: 'SUKSES', pesan: 'Data berhasil disimpan' }, 200, res)
    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.handlePersonalPersonAdditional = async (req, res) => {
    const {
        sosial_pelamar,
        kritik_untuk_pelamar,
        kelebihan_kekurangan,
        gaji_pelamar_saat_ini,
        gaji_yang_diharapkan_pelamar,
        rencana_pelamar_ketika_diterima
    } = req.body
    const { email } = decodedToken(req)
    const getId = await queryDB(`select id_identitas from identitas_pelamar where email_auth=?`, [email])
    const identitas = getId.rows[0].id_identitas
    try {
        const checkPersonal = await queryDB(`select * from lampiran_pelamar where id_identitas =?`, [identitas])
        // if (checkPersonal.rows[0]?.cv_pelamar && checkPersonal.rows[0]?.ktp_pelamar && checkPersonal.rows[0]?.ijazah_pelamar) {
        //     return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
        // }
        const checkBack = await queryDB(`select id_identitas from tambahan_informasi_pelamar where id_identitas=?`, [identitas])
        if (parseFloat(gaji_pelamar_saat_ini) === 0) {
            return response.ok({ status: 'GAGAL', error: 'nominal gaji tidak boleh 0 !' }, 300, res)
        }
        if (parseFloat(gaji_yang_diharapkan_pelamar) === 0) {
            return response.ok({ status: 'GAGAL', error: 'nominal gaji tidak boleh 0 !' }, 300, res)
        }
        if (gaji_pelamar_saat_ini.length > 8) {
            return response.ok({ status: 'GAGAL', error: 'nominal gaji tidak boleh melebihi batas maksimum 8 digit di belakang koma !' }, 300, res)
        }
        if (gaji_yang_diharapkan_pelamar.length > 8) {
            return response.ok({ status: 'GAGAL', error: 'nominal gaji tidak boleh batas maksimum 8 digit di belakang koma !' }, 300, res)
        }
        if (checkBack.rows.length === 0) {
            await queryDB(`INSERT INTO tambahan_informasi_pelamar 
                (id, id_identitas, kelebihan_kekurangan, sosial_pelamar, kritik_untuk_pelamar, rencana_pelamar_ketika_diterima, 
                gaji_pelamar_saat_ini,gaji_yang_diharapkan_pelamar) 
                VALUES (null, ?, ?, ?, ?, ?, ?, ?)`,
                [identitas, kelebihan_kekurangan, sosial_pelamar, kritik_untuk_pelamar, rencana_pelamar_ketika_diterima,
                    gaji_pelamar_saat_ini, gaji_yang_diharapkan_pelamar])
        } else {
            await queryDB(`UPDATE tambahan_informasi_pelamar 
                set kelebihan_kekurangan=?, sosial_pelamar=?, kritik_untuk_pelamar=?, rencana_pelamar_ketika_diterima=?, 
                gaji_pelamar_saat_ini=?,gaji_yang_diharapkan_pelamar=? 
                WHERE id_identitas=?`,
                [kelebihan_kekurangan, sosial_pelamar, kritik_untuk_pelamar, rencana_pelamar_ketika_diterima,
                    gaji_pelamar_saat_ini, gaji_yang_diharapkan_pelamar, identitas])

        }
        response.ok({ status: 'SUKSES', pesan: 'Data berhasil disimpan' }, 200, res)

    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}

exports.handlePersonalPersonAttachments = async (req, res) => {

    const cv_pelamar = req.files.cv_pelamar[0].key
    const ktp_pelamar = req.files.ktp_pelamar[0].key
    const ijazah_pelamar = req.files.ijazah_pelamar[0].key
    const { email } = decodedToken(req)
    const getId = await queryDB(`select id_identitas from identitas_pelamar where email_auth=?`, [email])
    const identitas = getId.rows[0].id_identitas
    try {
        const checkPersonal = await queryDB(`select * from lampiran_pelamar where id_identitas =?`, [identitas])
        // if (checkPersonal.rows[0]?.cv_pelamar && checkPersonal.rows[0]?.ktp_pelamar && checkPersonal.rows[0]?.ijazah_pelamar) {
        //     return response.ok({ status: 'GAGAL', pesan: "Anda sudah melakukan test tersebut !" }, 301, res)
        // }
        if (!cv_pelamar.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|pdf|PDF)$/)) {
            return response.ok({ status: "GAGAL", pesan: 'format cv tidak valid !' }, 300, res);
        }
        if (!ktp_pelamar.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|pdf|PDF)$/)) {
            return response.ok({ status: "GAGAL", pesan: 'format ktp tidak valid !' }, 300, res);
        }
        if (!ijazah_pelamar.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|pdf|PDF)$/)) {
            return response.ok({ status: "GAGAL", pesan: 'format ijazah tidak valid !' }, 300, res);
        }
        if (req.files.cv_pelamar[0].size > 1000000) {
            return response.ok({ status: "GAGAL", pesan: 'pdf tidak boleh melebihi 1MB!' }, 300, res);
        }
        if (req.files.ktp_pelamar[0].size > 1000000) {
            return response.ok({ status: "GAGAL", pesan: 'photo tidak boleh melebihi 1MB!' }, 300, res);
        }
        if (req.files.ijazah_pelamar[0].size > 1000000) {
            return response.ok({ status: "GAGAL", pesan: 'photo tidak boleh melebihi 1MB!' }, 300, res);
        } else {
            const checkBack = await queryDB(`select id_identitas from lampiran_pelamar where id_identitas=?`, [identitas])

            if (checkBack.rows.length === 0) {
                await queryDB(`INSERT INTO lampiran_pelamar (id, id_identitas, cv_pelamar, ktp_pelamar, ijazah_pelamar) VALUES (null, ?, ?, ?, ?)`,
                    [identitas, cv_pelamar, ktp_pelamar, ijazah_pelamar])
            } else {
                await queryDB(`UPDATE lampiran_pelamar set cv_pelamar=?, ktp_pelamar=?, ijazah_pelamar =? WHERE id_identitas=?`,
                    [cv_pelamar, ktp_pelamar, ijazah_pelamar, identitas])

            }
            return response.ok({ status: 'SUKSES', pesan: 'Data berhasil disimpan' }, 200, res)
        }

    } catch (e) {
        dumpError(e)
        console.log(e)
        response.ok({ status: "GAGAL", error: e.message }, 300, res);
    }
}
