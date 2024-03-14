
module.exports = validationPiket = (data) => {
    let checking = []
    const finIndex = (name) => data.findIndex(x => !x.hasOwnProperty(name))
    let key = [
        'jenis_kain', 'berat_bawah', 'berat_atas', 'kode', 'rak_tujuan', 'jenis_plastik', 'metode_lipat'
        // 'group_kain', 'pilihan', 'tipe_kain', 'berat_bawah', 'berat_atas', 'kode'
    ]
    // console.log(data[0], data[1]);
    for (let i = 0; i < key.length; i++) {
        checking[i] = finIndex(key[i])
        // console.log(finIndex(key[i]));
    }

    const filtering = checking.filter(x => x !== -1)
    // console.log(filtering);
    if (filtering.length > 0) {
        return 'File tidak sesuai dengan template'
        // `File tidak sesuai dengan template pada 
        // ${filtering.filter((x, y) => x + 1 === 1).length > 0 ? `Header ${filtering.filter((x, y) => x + 1 === 1).length}` : ''} 
        // ${filtering.filter((x, y) => x + 1 !== 1).length !== 0 ? `Baris ${filtering.filter((x, y) => x + 1 !== 1).length}` : ''} `
    }
    return 'sukses'
}