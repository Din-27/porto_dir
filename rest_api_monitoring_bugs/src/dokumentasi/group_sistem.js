const response = require("../res/res");
const { dumpError, queryDB } = require("../conn/tabel");


exports.add_group_sistem = async (req, res) => {
  try {
    let responseCode = 200;
    let responseStatus = "GAGAL";
    const { nama_kategori } = req.body;
    let pesan = "kategori berhasil disimpan";

    const GET_VALIDATION = await queryDB(`select * from kategori_sistem where status_kategori=0 and nama_kategori=?`, [nama_kategori]);
    GET_VALIDATION.rows.length > 0 ? ((pesan = "nama kategori sudah ada !"), (responseCode = 400)) : (pesan, responseCode);
    nama_kategori.length === 0 && nama_kategori === "" ? ((pesan = "nama kategori harus diisi !"), (responseCode = 400)) : (pesan, responseCode);
    if (pesan === "kategori berhasil disimpan") {
      await queryDB(`insert into kategori_sistem values(0, ?, 0, 0)`, [nama_kategori]);
      responseStatus = "SUKSES";
    }
    return response.ok(
      {
        status: responseStatus,
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
      300,
      res
    );
  }
};

exports.update_group_sistem = async (req, res) => {
  try {
    const { nama_kategori, nama_kategoriUpdated, id_kategori } = req.body;
    let pesan = "nama kategori berhasil di ubah";
    let responseCode = 200;
    let responseStatus = "GAGAL";
    nama_kategori === undefined ? (pesan = "nama kategori undefined") : (pesan, responseCode);
    if (pesan === "nama kategori berhasil di ubah") {
      await queryDB(
        `update kategori_sistem set nama_kategori=? 
                where status_kategori=0 and id=? and nama_kategori=?`,
        [nama_kategoriUpdated, parseFloat(id_kategori), nama_kategori]
      );
      const GET_VALIDASI = await queryDB(`SELECT id, nama_kategori FROM notifikasi_bugs_sistem WHERE nama_kategori=?`, [nama_kategori]);
      if (GET_VALIDASI.rows.length > 0) {
        GET_VALIDASI.rows.map(async (item) => {
          await queryDB(
            `update notifikasi_bugs_sistem set nama_kategori=? 
                    where id=?`,
            [nama_kategoriUpdated, item.id]
          );
        });
      }
      responseStatus = "SUKSES";
    }
    return response.ok(
      {
        status: responseStatus,
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
        pesan: e.message,
      },
      300,
      res
    );
  }
};

exports.delete_group_sistem = async (req, res) => {
  try {
    const { id_kategori } = req.body;
    let pesan = "kategori berhasil di hapus";
    let responseCode = 200;
    let responseStatus = "GAGAL";
    id_kategori === undefined ? ((pesan = "id_kategori undefined!"), (pesan = 500)) : (pesan, responseCode);
    if (pesan === "kategori berhasil di hapus") {
      await queryDB(`delete from kategori_sistem where id=?`, [parseFloat(id_kategori)]);
      responseStatus = "SUKSES";
    }
    return response.ok(
      {
        status: responseStatus,
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
      300,
      res
    );
  }
};

exports.get_group_sistem = async (req, res) => {
  try {
    const DATA = await queryDB(`SELECT id, nama_kategori, jumlah_sistem FROM kategori_sistem where status_kategori=0`);
    return response.ok(
      {
        status: "SUKSES",
        pesan: DATA.rows,
      },
      200,
      res
    );
  } catch (e) {
    dumpError(e);
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
