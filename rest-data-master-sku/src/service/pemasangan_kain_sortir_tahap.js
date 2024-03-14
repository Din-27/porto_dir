const { queryDB, decodedToken } = require("../conn/tabel");
const _ = require('lodash')
const response = require('../res/res')

exports.handleSimpanNomorTahapPadaArea = async (req, res) => {
    try {
        const { sts, pesan, data } = await handleSimpanFunc(req)
        return response.ok({ pesan, data }, sts, res);
    } catch (error) {
        console.log(error);
        response.ok(error, 401, res);
    }
};

exports.displayHistoryPemasangan = async (req, res) => {
    try {
        const displayData = await queryDB(`select *, if(status=1, 'AKTIF', 'TIDAK AKTIF') as sts , nama as user
        from data_pemasangan_area_sortir_history join user using(id_user)`)
        return response.ok(displayData.rows, 200, res);
    } catch (error) {
        console.log(error);
        response.ok(error, 401, res);
    }
}

exports.getNomorArea = async (req, res) => {
    try {
        let detailArea = {}
        const id_karyawan = decodedToken(req).id
        const displayData = await queryDB(`SELECT nomor_area FROM master_data_sku GROUP BY nomor_area`)
        for (let i = 0; i < displayData.rows.length; i++) {
            const getNomorTahap = await queryDB(
                `SELECT no_tahap1 + 0
                AS no_tahap
                FROM master_data_sku 
                WHERE nomor_area=?
                GROUP BY no_tahap
                ORDER BY no_tahap ASC`,
                [displayData.rows[i].nomor_area]
            );
            const getStatus = await queryDB(`
            SELECT IF(COUNT(status)>0, 'aktif', 'nonaktif') AS status 
            FROM data_pemasangan_area_sortir WHERE nomor_area=? LIMIT 1`,
                [displayData.rows[i].nomor_area])
            detailArea[`detail_area_${displayData.rows[i].nomor_area}`] = getNomorTahap.rows
            detailArea[`status_${displayData.rows[i].nomor_area}`] = getStatus.rows[0].status
        }

        const result = displayData.rows.map((x, y) => {
            x[`status_area`] = detailArea[`status_${displayData.rows[y].nomor_area}`]
            x[`detail_area`] = detailArea[`detail_area_${displayData.rows[y].nomor_area}`]
            return x
        })
        return response.ok(result, 200, res);
    } catch (error) {
        console.log(error);
        response.ok(error, 401, res);
    }
}

/**
 * 
 * Wajib untuk pengaktifan mengirimkan 3 key body full,
 * nonaktif hanya 2 key body (selain no_tahap = "")
 * jika tidak ada perubahan, jangan kirim kan status ("")
 * 
 * @param {*} req 
 * @param {*} functionFor 
 * @returns 
 */

const handleSimpanFunc = async (req, functionFor) => {
    let result = {
        sts: 200,
        pesan: 'sukses',
        data: []
    }

    let checkData = []
    const id_karyawan = decodedToken(req).id
    const { array } = req.body;

    const __utility = new setUtility()

    for (let item of array) {
        const data = await queryDB(`select * from data_pemasangan_area_sortir where nomor_area=?`,
            [parseInt(item.nomor_area), id_karyawan])
        checkData.push(...data.rows)
    }

    const nextTahap = await __utility.setGetDataProses(checkData)

    const checkDataArea = nextTahap.map(x => x.nomor_area)
    const getIndex = array.filter((x, y) => parseInt(x.nomor_area) !== checkDataArea[y])

    const findDataAktif = getIndex.filter((x) => x.status.toLowerCase() === 'aktif' && x.no_tahap !== '')
    const findDataNonAktif = getIndex.filter((x) => x.status.toLowerCase() === 'nonaktif')

    __utility.setHandleDataAktif({ findDataAktif, id_karyawan })
    __utility.setHandleDataNonAktif({ findDataNonAktif, checkDataArea, id_karyawan })

    /**
     * the findDataNonAktifByArray (pure array) not same with findDataNonAktif(changing array)
     */
    if (nextTahap.length > 0) {
        result = {
            sts: 301,
            pesan: `Tidak bisa merubah area, karena terdapat karung yang sedang dalam proses pada area tersebut`,
            data: _.uniqBy(nextTahap, 'no_karung')
        }
    }
    return result
}

class setUtility {
    async setGetDataProses(checkData) {
        let nextTahap = []
        for (let item of checkData) {
            const check_no_tahap1 = await queryDB(
                `SELECT *, mds.no_lokasi_tahap1 as no_lokasi FROM data_karung_sortir dks 
                    JOIN detail_karung_sortir ddks USING(no_karung) 
                    JOIN master_data_sku mds ON(dks.no_lokasi_tahap1=mds.no_lokasi_tahap1)
                    WHERE status_karung='proses' AND dks.no_tahap1=? AND nomor_area=? and ddks.no_karung is not null 
                    group by ddks.no_karung`,
                [item.no_tahap, parseInt(item.nomor_area)]
            );
            nextTahap.push(...check_no_tahap1.rows)
            if (check_no_tahap1.rows.length === 0) {
                for (let i = 2; i <= 3; i++) {
                    const getNoTahap = await queryDB(`SELECT * FROM master_data_sku WHERE no_tahap1=?`, [item.no_tahap])
                    console.log(getNoTahap.rows);
                    for (let x of getNoTahap.rows) {
                        const check_no_tahap = await queryDB(
                            `SELECT *, dks.no_lokasi_tahap as no_lokasi FROM data_karung_sortir_tahap${i} dks  
                            JOIN detail_karung_sortir_tahap${i} ddks USING(no_karung) 
                            JOIN master_data_sku mds ON(dks.no_lokasi_tahap=mds.no_lokasi_tahap${i})
                            WHERE status_karung='proses' AND dks.no_tahap=? and ddks.no_karung is not null group by dks.no_karung`,
                            [x[`no_tahap${i}`]]
                        );
                        console.log(x[`no_tahap${i}`]);
                        nextTahap.push(...check_no_tahap.rows)
                    }
                }
            }
        }
        return nextTahap
    }

    async setHandleDataAktif({ findDataAktif, id_karyawan }) {
        if (findDataAktif.length > 0) {
            for (let item of findDataAktif) {
                /**
                 * untuk data history
                 */
                const __checkData = await queryDB(`SELECT nomor_area, no_tahap FROM data_pemasangan_area_sortir where nomor_area=?`,
                    [parseInt(item.nomor_area)])

                if (__checkData.rows.length > 0) {
                    await queryDB(`INSERT INTO data_pemasangan_area_sortir_history (nomor_area, no_tahap, id_user, status)
                    VALUES (?,?,?, 0);`, [parseInt(__checkData.rows[0].nomor_area), __checkData.rows[0].no_tahap, id_karyawan])
                }

                /**
                 * untuk data baru
                 */
                const checkData = await queryDB(`SELECT nomor_area, no_tahap FROM data_pemasangan_area_sortir where nomor_area=? 
                    and no_tahap=?`, [parseInt(item.nomor_area), item.no_tahap])
                await queryDB(`INSERT INTO data_pemasangan_area_sortir_history (nomor_area, no_tahap, id_user)
                    VALUES (?,?,?);`, [parseInt(item.nomor_area), item.no_tahap, id_karyawan])
                if (checkData.rows.length === 0) {
                    await queryDB(`DELETE FROM data_pemasangan_area_sortir WHERE nomor_area=?`, [item.nomor_area])
                    await queryDB(`INSERT INTO data_pemasangan_area_sortir (nomor_area, no_tahap, id_user)
                VALUES (?,?,?);`, [parseInt(item.nomor_area), item.no_tahap, id_karyawan])
                }
            }
        }
    }

    async setHandleDataNonAktif({ findDataNonAktif, checkDataArea, id_karyawan }) {
        const filter = findDataNonAktif.filter(x => parseInt(x.nomor_area) !== checkDataArea[0])
        // console.log(filter);
        if (filter.length > 0) {
            for (let item of filter) {
                const data = await queryDB(`select * from data_pemasangan_area_sortir where nomor_area=?`,
                    [parseInt(item.nomor_area)])
                // console.log(data.rows, parseInt(item.nomor_area));
                if (data.rows.length > 0) {
                    await queryDB(`INSERT INTO data_pemasangan_area_sortir_history (nomor_area, no_tahap, id_user, status)
                    VALUES (?,?,?, 0);`, [data.rows[0].nomor_area, data.rows[0].no_tahap, id_karyawan])
                    await queryDB(`DELETE FROM data_pemasangan_area_sortir WHERE nomor_area=?`, [item.nomor_area])
                }
            }
        }
    }

}