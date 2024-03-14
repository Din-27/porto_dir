const path = require("path");
const { queryDB, decodedToken } = require("../conn/tabel");
const response = require("../res/res");
const fs = require('fs')

exports.getTahap = async (req, res) => {
    try {
        const { rows } = await queryDB(
            `SELECT tahap AS name,
             tahap AS value FROM
             (SELECT 1 AS tahap UNION SELECT 3) AS tf`
        );
        return response.ok(rows, 200, res);
    } catch (error) {
        console.log(error);
        response.ok(error, 401, res);
    }
};

exports.getNomorTahap = async (req, res) => {
    try {
        const { tahap } = req.params;
        const getNomorTahap = await queryDB(
            `select no_tahap${tahap} 
            as no_tahap${tahap} 
            from master_data_sku 
            group by no_tahap${tahap} 
            ORDER BY no_tahap${tahap} ASC`
        );
        return response.ok(getNomorTahap?.rows || [], 200, res);
    } catch (error) {
        console.log(error);
        response.ok(error, 401, res);
    }
};

exports.handleButtonTambahListOpsiTransferStok = async (req, res) => {
    try {
        let msg = "Tidak ada nomor tahap yang terpilih", sts = 400, getDataSKUFromDB = [], result = [];
        const datatxt = fs.readFileSync(path.join(__dirname, '../../status/sts.txt'), 'utf-8')
        const { no_tahap, tahap, cabang } = req.body;
        const id_karyawan = decodedToken(req).id;
        const ststxt = JSON.parse(datatxt)

        console.log(id_karyawan);
        if (ststxt.sts === 1 && ststxt.id_karyawan !== id_karyawan) {
            msg = `Tidak dapat melakukan tambah, karena terdapat user di cabang ${cabang} 
            sedang melakukan input data transfer stok karung`;
        } else {
            const file = fs.writeFileSync(path.join(__dirname, '../../status/sts.txt'),
                JSON.stringify(
                    {
                        location: 'OpsiTransferStok',
                        id_karyawan: id_karyawan,
                        sts: 1
                    }
                )
            )
            await Promise.all([file])
            if (ststxt.id_karyawan !== id_karyawan && ststxt.sts === 0) {
                await queryDB(` DELETE FROM data_karung_sortir_transfer;`)
            }
            if (no_tahap.length > 0) {

                for (let item of no_tahap) {
                    const getDataMasterSku = await queryDB(
                        `SELECT * FROM master_data_sku WHERE no_tahap${tahap}=? group by no_tahap${tahap}`,
                        [item]
                    );
                    getDataSKUFromDB.push(...getDataMasterSku.rows);
                }
                for (let item of getDataSKUFromDB) {

                    const validasiDataKarung = await queryDB(
                        `SELECT *, 
                        if(count(no_lokasi) = 0, 'Tidak ada', 'Sudah ada') as validasi 
                        FROM data_karung_sortir_transfer 
                        WHERE no_tahap=? and tahapan=?`,
                        [item[`no_tahap${tahap}`], tahap]
                    );
                    if (validasiDataKarung.rows[0].validasi === 'Tidak ada') {
                        await queryDB(
                            `INSERT INTO 
                            data_karung_sortir_transfer 
                            (tahapan, no_tahap, no_lokasi, id_user)
                            VALUES (?, ?, ?, ?);`,
                            [
                                tahap,
                                item[`no_tahap${tahap}`],
                                item[`no_lokasi_tahap${tahap}`],
                                id_karyawan,
                            ]
                        );

                    } else if (validasiDataKarung.rows[0].validasi === 'Sudah ada') {
                        await queryDB(`UPDATE data_karung_sortir_transfer 
                        SET status = 1
                        WHERE no_tahap = ? 
                        and id_user=?`,
                            [item[`no_tahap${tahap}`], id_karyawan])
                    }

                    // const validasiDataKarungHistory = await queryDB(
                    //     `SELECT if(count(no_lokasi) = 0, 'Tidak ada', 'Sudah ada') as validasi 
                    //     FROM data_karung_sortir_transfer_history 
                    //     WHERE no_tahap=? and tahapan=?`,
                    //     [item[`no_tahap${tahap}`], tahap])
                    if (validasiDataKarung.rows[0].validasi === 'Tidak ada') {
                        await queryDB(`insert into 
                        data_karung_sortir_transfer_history
                        (tahapan, no_tahap, no_lokasi, id_user, status)
                        values(?,?,?,?,1)`, [
                            tahap,
                            item[`no_tahap${tahap}`],
                            item[`no_lokasi_tahap${tahap}`],
                            id_karyawan,
                        ]);
                    }

                }

                const getData = await queryDB(
                    `SELECT dk.id,
                     dk.tahapan, 
                     dk.no_tahap, 
                     dk.no_lokasi, 
                     dk.id_user, 
                    CONCAT(
                        RIGHT(
                            RIGHT(DATE(dk.created_at), 5), 2
                            ), '-',
                        LEFT(
                            RIGHT(DATE(dk.created_at), 5), 2)
                            ,'-', 
                        LEFT(
                            DATE(dk.created_at), 4), ' ', 
                            TIME(dk.created_at)) AS created_at, 
                            nama 
                    FROM data_karung_sortir_transfer dk
                    JOIN user USING(id_user)
                    where id_user=? and status=1`,
                    [id_karyawan]
                );
                msg = getData.rows.map(item => {
                    item.id_user = item.nama
                    return item
                });
                sts = 200
            }
        }
        response.ok(msg, sts, res);
    } catch (error) {
        console.log(error);
        response.ok(error, 401, res);
    }
};

exports.handleDeleteListtransferStok = async (req, res) => {
    try {
        const id_karyawan = decodedToken(req).id;
        const { no_tahap } = req.body;

        const dataHistory = await queryDB(`SELECT * FROM data_karung_sortir_transfer WHERE no_tahap=?`,
            [no_tahap])
        for (let data of dataHistory.rows) {
            await queryDB(`insert into data_karung_sortir_transfer_history(tahapan, no_tahap, no_lokasi, id_user, status)
            values(?,?,?,?,0)`, [data.tahapan, data.no_tahap, data.no_lokasi, data.id_user]);
        }

        await queryDB(`DELETE FROM data_karung_sortir_transfer 
        WHERE no_tahap = ? and id_user=?`, [no_tahap, id_karyawan])

        response.ok('sukses delete !', 200, res);
    } catch (error) {
        console.log(error);
        response.ok(error, 401, res);
    }
};

exports.getHistory = async (req, res) => {
    try {
        const { rows } = await queryDB(
            `SELECT 
            dk.id, 
            dk.tahapan, 
            dk.no_tahap, 
            dk.no_lokasi, 
            dk.id_user, 
            CONCAT(
                RIGHT(RIGHT(DATE(dk.created_at), 5), 2)
                , '-', 
                LEFT(
                    RIGHT(DATE(dk.created_at), 5), 2),
                    '-', 
                    LEFT(DATE(dk.created_at), 4), 
                    ' ', 
                    TIME(dk.created_at)) AS created_at, 
            IF(STATUS=0, 'Hapus', 'Tambah') AS keterangan, nama 
            FROM data_karung_sortir_transfer_history dk
            JOIN user USING(id_user)`
        );
        response.ok(rows.map(item => {
            item.id_user = item.nama
            return item
        }), 200, res);
    } catch (error) {
        console.log(error);
        response.ok(error, 401, res)
    }
};


exports.getList = async (req, res) => {
    try {
        const id_karyawan = decodedToken(req).id;
        const { rows } = await queryDB(
            `SELECT dk.id, 
            dk.tahapan, 
            dk.no_tahap, 
            dk.no_lokasi, 
            dk.id_user, 
            CONCAT(
                RIGHT(
                    RIGHT(DATE(dk.created_at), 5), 2), 
                    '-', 
                        LEFT(RIGHT(DATE(dk.created_at), 5), 2),
                        '-', LEFT(DATE(dk.created_at), 4), ' ', 
                            TIME(dk.created_at)) AS created_at, nama 
            FROM data_karung_sortir_transfer dk
            JOIN user USING(id_user)
            where id_user=? and status=1`, [id_karyawan]
        );
        console.log(id_karyawan)
        response.ok(rows.map(item => {
            item.id_user = item.nama
            return item
        }), 200, res);
    } catch (error) {
        console.log(error);
        response.ok(error, 401, res);
    }
};

exports.updateStatusUser = async (req, res) => {
    try {
        const { page } = req.query
        const datatxt = fs.readFileSync(path.join(__dirname, '../../status/sts.txt'), 'utf-8')
        const ststxt = JSON.parse(datatxt)

        if (!page) {
            fs.writeFileSync(path.join(__dirname, '../../status/sts.txt'),
                JSON.stringify(
                    {
                        location: '',
                        id_karyawan: ststxt.id_karyawan,
                        sts: 0
                    }
                )
            )
        }

        response.ok('sukses', 200, res);
    } catch (error) {
        console.log(error);
        response.ok(error, 401, res);
    }
};