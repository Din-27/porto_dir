const { queryDB } = require("../conn/tabel")

module.exports = insertingData = async (tableName, item, id_karyawan) => {
    const getIdKain = await queryDB(`select id_kain from kain where nama_kain=?`, [item.jenis_kain])
    const getIdWarna = await queryDB(`SELECT id_warna FROM warna WHERE jenis_warna=?`, [item.warna])
    await queryDB(`INSERT INTO ${tableName} (
        no_sku, id_kain, id_warna, nilai_bawah, nilai_atas, no_tahap1, no_tahap2, no_tahap3,
        no_lokasi_tahap1, no_lokasi_tahap2, no_lokasi_tahap3, group_lokasi_tahap1, group_lokasi_tahap2, 
        group_lokasi_tahap3, nomor_area, id_user
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            item.nomor_sku,
            getIdKain.rows[0]?.id_kain,
            getIdWarna.rows[0]?.id_warna,
            item.nilai_bawah,
            item.nilai_atas,
            item.nomor_tahap_1,
            item.nomor_tahap_2,
            item.nomor_tahap_3,
            item.nomor_lokasi_tahap_1,
            item.nomor_lokasi_tahap_2,
            item.nomor_lokasi_tahap_3,
            '-',
            item.grup_lokasi_tahap_2,
            item.grup_lokasi_tahap_3,
            item.nomor_area,
            id_karyawan
        ]
    )
}