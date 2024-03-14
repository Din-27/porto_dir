const response = require("../res/res");
const { dumpError, queryDB, get, set, del } = require("../conn/tabel");

let results;
let isCached = false;

exports.add_sistem_monitor = async (req, res) => {
  let responseCode = 200;
  let statusResponse = "GAGAL";
  let pesan = "data log berhasil disimpan";
  console.log(req)
  const { nama_sistem, nama_kategori, direktori, catatan, kategori } = req.body;

  try {
    const CHECK_KATEGORI = await queryDB("select * from kategori_sistem where nama_kategori=?", [nama_kategori]);
    CHECK_KATEGORI.rows.length === 0 ? ((pesan = "kategori tidak tersedia !"), (responseCode = 400)) : (pesan, responseCode);
    nama_kategori === "" && nama_kategori.length === 0 ? ((pesan = "nama kategori harus diisi !"), (responseCode = 400)) : (pesan, responseCode);
    nama_sistem === "" && nama_sistem.length === 0 ? ((pesan = "nama sistem harus diisi !"), (responseCode = 400)) : (pesan, responseCode);
    direktori === "" && direktori.length === 0 ? ((pesan = "direktori harus diisi !"), (responseCode = 400)) : (pesan, responseCode);
    catatan === "" && catatan.length === 0 ? ((pesan = "catatan harus diisi !"), (responseCode = 400)) : (pesan, responseCode);
    kategori === "" && kategori.length === 0 ? ((pesan = "kategori harus diisi !"), (responseCode = 400)) : (pesan, responseCode);

    if (pesan === "data log berhasil disimpan") {
      await queryDB(`insert into notifikasi_bugs_sistem values(0, ?, ?, 'BUGS', 0, 0, ?, ?, NOW())`, [nama_sistem, nama_kategori, direktori, catatan]);

      const GET_JUMLAH_SISTEM = await queryDB(
        `SELECT COUNT(status_sistem) AS jumlah_sistem 
            FROM notifikasi_bugs_sistem WHERE status_sistem=0 AND nama_kategori=?`,
        [nama_kategori]
      );

      const GET_MASTER_SISTEM = await queryDB(`select jumlah_sistem from kategori_sistem where status_kategori=0`);
      const jumlahSistem = GET_JUMLAH_SISTEM.rows[0].jumlah_sistem;
      if (jumlahSistem != GET_MASTER_SISTEM.rows[0].jumlah_sistem) {
        await queryDB(`update kategori_sistem set jumlah_sistem=? where nama_kategori=?`, [jumlahSistem, nama_kategori]);
      }
      statusResponse = "SUKSES";
    }
    return response.ok(
      {
        status: statusResponse,
        pesan: pesan,
      },
      responseCode,
      res
    );
  } catch (e) {
    dumpError(e);
    return response.ok(
      {
        status: "GAGAL",
        pesan: e,
      },
      500,
      res
    );
  }
};

exports.delete_sistem_monitor = async (req, res) => {
  try {

    let responseCode = 200;
    let statusResponse = "GAGAL";
    const { id_sistem, nama_kategori } = req.body;
    let pesan = "data log berhasil dihapus";

    id_sistem === undefined ? ((pesan = "id_sistem undefined!"), (responseCode = 400)) : (pesan, responseCode);
    if (pesan === "data log berhasil dihapus") {
      await queryDB(`delete from notifikasi_bugs_sistem where id=?`, [parseFloat(id_sistem)]);
      const GET_JUMLAH_SISTEM = await queryDB(
        `SELECT COUNT(status_sistem) AS jumlah_sistem 
            FROM notifikasi_bugs_sistem WHERE status_sistem=0 and nama_kategori=?`,
        [nama_kategori]
      );
      const GET_MASTER_SISTEM = await queryDB(`select jumlah_sistem from kategori_sistem where status_kategori=0`);
      const jumlahSistem = GET_JUMLAH_SISTEM.rows[0].jumlah_sistem;
      if (jumlahSistem != GET_MASTER_SISTEM.rows[0].jumlah_sistem) {
        await queryDB(`update kategori_sistem set jumlah_sistem=? where nama_kategori=?`, [jumlahSistem, nama_kategori]);
      }
      statusResponse = "SUKSES";
    }
    return response.ok(
      {
        status: statusResponse,
        pesan: pesan,
      },
      responseCode,
      res
    );
  } catch (e) {
    dumpError(e);
    console.log(e);
    return response.ok(
      {
        status: "GAGAL",
        pesan: e.message,
      },
      300,
      res
    );
  }
};

exports.update_sistem_monitor = async (req, res) => {
  try {

    let responseCode = 200;
    let statusResponse = "GAGAL";
    let pesan = "data log berhasil diubah";
    const { nama_kategoriLama, nama_kategori, nama_sistem, direktori, catatan, id_sistem } = req.body;

    nama_kategori === "" && nama_kategori.length === 0 ? ((pesan = "group kategori tidak boleh kosong !"), (responseCode = 400)) : (pesan, responseCode);
    nama_sistem === "" && nama_sistem.length === 0 ? ((pesan = "nama sistem harus diisi !"), (responseCode = 400)) : (pesan, responseCode);
    direktori === "" && direktori.length === 0 ? ((pesan = "direktori harus diisi !"), (responseCode = 400)) : (pesan, responseCode);
    catatan === "" && catatan.length === 0 ? ((pesan = "catatan harus diisi !"), (responseCode = 400)) : (pesan, responseCode);
    id_sistem === undefined ? ((pesan = "id_sistem undefined !"), (responseCode = 400)) : (pesan, responseCode);

    if (pesan === "data log berhasil diubah") {
      await queryDB(
        `update notifikasi_bugs_sistem set nama_sistem=?, 
            direktori=?, catatan=?, nama_kategori=? where id=?`,
        [nama_sistem, direktori, catatan, nama_kategori, parseFloat(id_sistem)]
      );
      const GET_JUMLAH_SISTEM = await queryDB(
        `SELECT COUNT(status_sistem) AS jumlah_sistem 
            FROM notifikasi_bugs_sistem WHERE status_sistem=0 AND nama_kategori=?`,
        [nama_kategori]
      );
      const GET_JUMLAH_SISTEM2 = await queryDB(
        `SELECT COUNT(status_sistem) AS jumlah_sistem 
            FROM notifikasi_bugs_sistem WHERE status_sistem=0 AND nama_kategori=?`,
        [nama_kategoriLama]
      );

      const GET_MASTER_SISTEM = await queryDB(`select jumlah_sistem from kategori_sistem where status_kategori=0 and nama_kategori=?`, [nama_kategori]);
      const GET_MASTER_SISTEM2 = await queryDB(`select jumlah_sistem from kategori_sistem where status_kategori=0 and nama_kategori=?`, [nama_kategoriLama]);
      const jumlahSistem = GET_JUMLAH_SISTEM.rows[0].jumlah_sistem;
      const jumlahSistem2 = GET_JUMLAH_SISTEM2.rows[0].jumlah_sistem;
      if (jumlahSistem != GET_MASTER_SISTEM.rows[0].jumlah_sistem) {
        await queryDB(`update kategori_sistem set jumlah_sistem=? where nama_kategori=?`, [jumlahSistem, nama_kategori]);
      }
      if (jumlahSistem2 != GET_MASTER_SISTEM2.rows[0].jumlah_sistem) {
        await queryDB(`update kategori_sistem set jumlah_sistem=? where nama_kategori=?`, [jumlahSistem2, nama_kategoriLama]);
      }
      statusResponse = "SUKSES";
    }
    return response.ok(
      {
        status: statusResponse,
        pesan: pesan,
      },
      responseCode,
      res
    );
  } catch (e) {
    dumpError(e);
    console.log(e);
    return response.ok(
      {
        status: "GAGAL",
        pesan: e.message,
      },
      300,
      res
    );
  }
};

exports.update_sistem_kategori = async (req, res) => {
  try {

    let responseCode = 200;
    let statusResponse = "GAGAL";
    let ip = req.clientIp.slice(7);
    let pesan = "Data berhasil di update";
    const { nama_kategori, nama_sistem, kategori } = req.body;

     console.log(req.body);
    // console.log(ip);

    const GET_ID = await queryDB(`select id from notifikasi_bugs_sistem where status_sistem=0 and nama_kategori=? and nama_sistem=?`, [nama_kategori, nama_sistem]);
    await queryDB(`update notifikasi_bugs_sistem set kategori=? where id=?`, [kategori, GET_ID.rows[0].id]);
    statusResponse = "SUKSES";
    return res.status(200).send(
      {
        status: statusResponse,
        pesan: pesan,
      },
      responseCode,
      res
    );
  } catch (e) {
    dumpError(e);
    console.log(e);
    return response.ok(
      {
        status: "GAGAL",
        pesan: e,
      },
      300,
      res
    );
  }
};

exports.getData_sistem_monitor = async (req, res) => {
  try {

    const { nama_kategori } = req.body;
    const key = nama_kategori;

    const DATA = await queryDB(
      `select id, nama_kategori, nama_sistem, direktori, 
        catatan, kategori from notifikasi_bugs_sistem where status_sistem=0 and nama_kategori=?`,
      [nama_kategori]
    );
    const cacheResults = await get(key);
    const loopNameSistem = DATA.rows === JSON.parse(cacheResults);
    if (cacheResults) {
      if (loopNameSistem) {
        isCached = true;
        results = JSON.parse(cacheResults);
      } else {
        await del(key);
        await set(key, JSON.stringify(DATA.rows));
        results = DATA.rows;
      }
    } else {
      results = DATA.rows;
      if (results.length === 0) {
        throw "API returned an empty array";
      }
      await set(key, JSON.stringify(results));
    }
    return response.ok(
      {
        status: "SUKSES",
        pesan: results,
      },
      200,
      res
    );
  } catch (e) {
    dumpError(e, res);
    console.log(e);
    return response.ok(
      {
        status: "GAGAL",
        pesan: e,
      },
      300,
      res
    );
  }
};
