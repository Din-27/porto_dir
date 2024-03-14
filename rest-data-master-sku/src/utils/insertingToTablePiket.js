const { queryDB } = require("../conn/tabel")

module.exports = insertingDataPiket = async (tableName, item, id_karyawan) => {
    await queryDB(`INSERT INTO ${tableName} (
        jenis_kain, berat_bawah, berat_atas, kode,
        rak_tujuan, jenis_plastik, metode_lipat,
        id_user
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            item.jenis_kain,
            item.berat_bawah,
            item.berat_atas,
            item.kode,
            item.rak_tujuan,
            item.jenis_plastik,
            item.metode_lipat,
            id_karyawan
        ]
    )
}