module.exports = validation = (data) => {
    let checking = []
    const finIndex = (name) => data.findIndex(x => x[name] === '-')
    let key = [
        'nomor_sku', 'jenis_kain', 'warna', 'nilai_bawah', 'nilai_atas', 'nomor_tahap_1', 'nomor_tahap_2', 'nomor_tahap_3',
        'nomor_lokasi_tahap_1', 'nomor_lokasi_tahap_2', 'grup_lokasi_tahap_2', 'nomor_lokasi_tahap_3', 'grup_lokasi_tahap_3', 'nomor_area'
    ]
    for (let i = 0; i < key.length; i++) {
        checking[i] = finIndex(key[i])
    }
    const filtering = checking.filter(x => x !== -1)
    if (filtering.length > 0) {
        return `Pastikan Anda meng-upload file yang sesuai dengan template`
        // `data tidak bisa diekspor, karena tidak tidak sesuai dengan sistem ! (Baris ${filtering.map(x => x)})`
    }
    return 'sukses'
}