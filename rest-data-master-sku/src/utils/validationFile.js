module.exports = validation = (data) => {
    let checking = []
    const finIndex = (name) => data.findIndex(x => !x.hasOwnProperty(name))
    let key = [
        'nomor_sku', 'jenis_kain', 'warna', 'nilai_bawah', 'nilai_atas', 'nomor_tahap_1', 'nomor_tahap_2', 'nomor_tahap_3',
        'nomor_lokasi_tahap_1', 'nomor_lokasi_tahap_2', 'grup_lokasi_tahap_2', 'nomor_lokasi_tahap_3', 'grup_lokasi_tahap_3', 'nomor_area'
    ]
    for (let i = 0; i < key.length; i++) {
        checking[i] = finIndex(key[i])
    }
    console.log(data[1]);
    const filtering = checking.filter(x => x !== -1)
    if (filtering.length > 0) {
        console.log(filtering)
        return 'Pastikan Anda meng-upload file yang sesuai dengan template'
        // `File tidak sesuai dengan template pada 
        // ${filtering.filter((x, y) => x + 1 === 1).length > 0 ? `Header ${filtering.filter((x, y) => x + 1 === 1).length}` : ''} 
        // ${filtering.filter((x, y) => x + 1 !== 1).length !== 0 ? `Baris ${filtering.filter((x, y) => x + 1 !== 1).length}` : ''} `
    }
    return 'sukses'
}