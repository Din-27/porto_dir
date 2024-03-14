const response = require("../../config/res/res");
const {
    queryDB,
    dumpError,
    decodedToken,
} = require("../../config/conn/tabel");
const { scan_bs_segel, batalScanBsSegel } = require("../utils");

exports.get_list_pengeluaran_bs_segel = async (req, res) => {
    try {
        const getData =
            await queryDB(`SELECT no_pengeluaran,IFNULL(COUNT(vs.no_transaksi),0) AS sc,COUNT(no_pengeluaran) AS tot,
        CONCAT('Scan : ',IFNULL(COUNT(vs.no_transaksi),0), ' of ',COUNT(no_pengeluaran)) AS jml, CONCAT('Total Berat : ', SUM(berat) , ' Kg') AS brt 
        FROM (SELECT no_ngebal,no_pengeluaran,p.tanggal, SUM(berat) AS berat
        FROM data_ngebal_bssegel d JOIN detail_ngebal_bssegel dn USING(no_ngebal) JOIN n_relasi_bssegel n USING(no_ngebal) 
        JOIN penjualan_kainstok p USING(no_pengeluaran) WHERE d.status=2 GROUP BY no_ngebal) AS dump 
        LEFT JOIN (SELECT no_transaksi FROM detail_pengeluaransatpam_bssegel GROUP BY no_transaksi) AS vs ON no_ngebal=no_transaksi
        GROUP BY no_pengeluaran HAVING sc <> tot`);

        return response.ok({
            status: "SUKSES", pesan: getData.rows.map(x => {
                const buff = {}
                buff.jml = Buffer.from(x.jml)
                buff.brt = Buffer.from(x.brt)
                x.jml = buff.jml.toString().split(':')[1].replace(' ', '')
                x.brt = buff.brt.toString().split(':')[1].replace(' ', '')
                return x
            })
        }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.get_detail_list_pengeluaran_bs_segel = async (req, res) => {
    try {
        const { no_pengeluaran } = req.params;
        const getData = await queryDB(
            `SELECT no_ngebal,sum(jml) as jml,sum(berat) as berat,if(vs.no_transaksi is not null,'Sudah discan','belum discan') AS sts  
        from (SELECT no_ngebal,no_pengeluaran,p.tanggal,jml, SUM(berat) AS berat FROM data_ngebal_bssegel d JOIN detail_ngebal_bssegel dn 
        USING(no_ngebal) JOIN n_relasi_bssegel n USING(no_ngebal) JOIN penjualan_kainstok p USING(no_pengeluaran) 
        WHERE d.status=2 and n.no_pengeluaran=? GROUP BY no_ngebal) AS dump 
        left join (SELECT no_transaksi FROM detail_pengeluaransatpam_bssegel GROUP BY no_transaksi) as vs 
        on no_ngebal=no_transaksi GROUP BY no_ngebal order by no_ngebal`,
            [no_pengeluaran]
        );
        return response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.get_data_pengeluaran = async (req, res) => {
    try {
        const getData =
            await queryDB(`SELECT no_pengeluaran,IFNULL(COUNT(vs.no_transaksi),0) AS sc,COUNT(no_pengeluaran) AS tot,
        CONCAT('Scan : ',IFNULL(COUNT(vs.no_transaksi),0), ' of ',COUNT(no_pengeluaran)) AS jml, CONCAT('Total Berat : ', SUM(berat) , ' Kg') AS brt 
        FROM (SELECT no_ngebal,no_pengeluaran,p.tanggal, SUM(berat) AS berat
        FROM data_ngebal_bssegel d JOIN detail_ngebal_bssegel dn USING(no_ngebal) JOIN n_relasi_bssegel n USING(no_ngebal) 
        JOIN penjualan_kainstok p USING(no_pengeluaran) WHERE d.status=2 GROUP BY no_ngebal) AS dump 
        LEFT JOIN (SELECT no_transaksi FROM detail_pengeluaransatpam_bssegel GROUP BY no_transaksi) AS vs ON no_ngebal=no_transaksi
        GROUP BY no_pengeluaran`);
        return response.ok({
            status: "SUKSES", pesan: getData.rows.map(x => {
                const buff = {}
                buff.jml = Buffer.from(x.jml)
                buff.brt = Buffer.from(x.brt)
                x.jml = buff.jml.toString().split(':')[1].replace(' ', '')
                x.brt = buff.brt.toString().split(':')[1].replace(' ', '')
                return x
            })
        }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.get_data_pengeluaran_detail = async (req, res) => {
    try {
        const { no_pengeluaran } = req.params;
        const getData = await queryDB(
            `SELECT no_ngebal,sum(jml) as jml,sum(berat) as berat,if(vs.no_transaksi is not null,'SUDAH','BELUM') as sts 
        from (SELECT no_ngebal,no_pengeluaran,p.tanggal,jml, SUM(berat) AS berat FROM data_ngebal_bssegel d JOIN detail_ngebal_bssegel dn 
        USING(no_ngebal) JOIN n_relasi_bssegel n USING(no_ngebal) JOIN penjualan_kainstok p USING(no_pengeluaran) 
        WHERE d.status=2 and p.no_pengeluaran=? GROUP BY no_ngebal) AS dump left join (select no_transaksi from detail_pengeluaransatpam_bssegel 
        GROUP BY no_transaksi) as vs on no_ngebal=no_transaksi GROUP BY no_ngebal`,
            [no_pengeluaran]
        );
        return response.ok({ status: "SUKSES", pesan: getData.rows }, 200, res);
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.handle_scan_bs_segel = (req, res) => {
    try {
        const { id } = decodedToken(req);
        scan_bs_segel({ req, res });
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};

exports.handle_scan_bs_segel_batal = (req, res) => {
    try {
        const { id } = decodedToken(req);
        batalScanBsSegel({ req, res });
    } catch (e) {
        dumpError(e);
        console.error(e);
        return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
    }
};
