const { default: jsPDF } = require("jspdf");
const date = require('date-and-time');

const CreatePDF = async (queryDB, fs, dir, nama_lengkap, jurusan) => {
    const doc = new jsPDF();
    const getIdIdentitas = await queryDB(`SELECT id_identitas FROM identitas_pelamar WHERE nama_lengkap=? AND jurusan_terakhir=?`,
        [nama_lengkap, jurusan])
    const getDetailEmployer = await queryDB(`SELECT * FROM detail_hasil_test dhs JOIN master_hasil_test mhs 
    ON(mhs.id_master_test=dhs.id_master_test) JOIN identitas_pelamar ip ON(ip.id_identitas=mhs.id_identitas) WHERE ip.id_identitas=?`, [getIdIdentitas.rows[0].id_identitas])
    const informationEmploye = await queryDB(`select * from tambahan_informasi_pelamar where id_identitas=?`, [getIdIdentitas.rows[0].id_identitas])
    const template = fs.readFileSync(__dirname.slice(0, -5) + "/assets/Kop Surat PT 1.png", { encoding: "latin1" });
    doc
        //
        .addImage(template, "test", 0, 0, 220, 300, undefined, "SLOW")
        //
        .setFontSize(14).setFont(undefined, 'bold')
        .text("Identitas Pelamar", 37, 60)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text("Nama", 37, 70)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`: ${getDetailEmployer.rows[0].nama_lengkap}`, 80, 70)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text("Jenis Kelamin", 37, 80)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`: ${getDetailEmployer.rows[0].jenis_kelamin}`, 80, 80)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text("Tinggi Badan", 37, 85)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`: ${getDetailEmployer.rows[0].tinggi_badan} CM`, 80, 85)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text(`Posisi yang dilamar`, 37, 90)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`: ${getDetailEmployer.rows[0].posisi_dilamar}`, 80, 90)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text(`Pendidikan Terakhir `, 37, 95)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`: ${getDetailEmployer.rows[0].pendidikan_terakhir}`, 80, 95)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text(`Jurusan Terakhir `, 37, 100)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`: ${getDetailEmployer.rows[0].jurusan_terakhir}`, 80, 100)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text(`Tempat Tanggal Lahir `, 37, 105)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`: ${getDetailEmployer.rows[0].tempat_lahir}  ${date.format(getDetailEmployer.rows[0].tanggal_lahir, 'ddd, MMM DD YYYY')}`, 80, 105)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text(`Alamat KTP `, 37, 110)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`: ${getDetailEmployer.rows[0].alamat_ktp}`, 80, 110)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text(`Alamat Domisili `, 37, 115)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`: ${getDetailEmployer.rows[0].alamat_domisili}`, 80, 115)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text(`Email `, 37, 120)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`: ${getDetailEmployer.rows[0].email}`, 80, 120)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text(`Nomor HP `, 37, 125)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`: ${getDetailEmployer.rows[0].nomor_hp}`, 80, 125)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text(`Sumber Informasi Loker `, 37, 130)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`: ${getDetailEmployer.rows[0].sumber_informasi_loker}`, 80, 130)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text(`Pengalaman Kerja `, 37, 135)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`: ${getDetailEmployer.rows[0].pengalaman_kerja}`, 80, 135)
    fs.writeFileSync(`${dir}/Identitas_(${nama_lengkap.toUpperCase()}).pdf`, doc.output(), "ascii");
    // ==============================================================
    // ==============================================================
    doc
        .addImage(template, "test", 0, 0, 220, 300, undefined, "SLOW")
        .setFontSize(14).setFont(undefined, 'bold')
        .text("Tambahan Informasi Pelamar", 37, 60)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text("Kelebihan & Kekurangan Pelamar : ", 37, 70)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`${informationEmploye.rows[0].kelebihan_kekurangan}`, 37, 75, { maxWidth: 150, align: 'left' })
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text("Pelamar Suka Bekerja dalam Tim atau Seorang Diri : ", 37, 125)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`${informationEmploye.rows[0].sosial_pelamar}`, 37, 130, { maxWidth: 150, align: 'left' })
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text("Sikap Pelamar Terhadap Kritik : ", 37, 180)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`${informationEmploye.rows[0].kritik_untuk_pelamar}`, 37, 185, { maxWidth: 150, align: 'left' })
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text(`Gaji Pelamar Saat ini : `, 37, 230)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`${informationEmploye.rows[0].gaji_pelamar_saat_ini}`, 37, 235)
        //
        .setFontSize(10).setFont(undefined, 'normal')
        .text(`Gaji yang diharapkan Pelmar : `, 37, 240)
        //
        .setFontSize(10).setFont(undefined, 'bold')
        .text(`${informationEmploye.rows[0].gaji_yang_diharapkan_pelamar}`, 37, 245)
    //
    fs.writeFileSync(`${dir}/Tambahan_Pelamar_(${nama_lengkap.toUpperCase()}).pdf`, doc.output(), "ascii");
    return;
}

module.exports = { CreatePDF }