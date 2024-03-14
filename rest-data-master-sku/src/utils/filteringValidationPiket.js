module.exports = validation = (data) => {
    let checking = []
    const finIndex = (name) => data.findIndex(x => x[name] === '-')
    let key = [
        'jenis_kain', 'berat_bawah', 'berat_atas', 'kode', 'rak_tujuan', 'jenis_plastik', 'metode_lipat'
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