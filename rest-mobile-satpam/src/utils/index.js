const query = require("./query");
const response = require("../../config/res/res");
// const { testingscan } = require("./scanpengeluaransatpam");
const { queryDB, starttransaction, rollback, commit, decodedToken } = require("../../config/conn/tabel");
const { cetakSJ } = require("../controllers/cetak");

const orderKain = async (props) => {
  const { req, res } = props;
  const { no_penjualan, kode_verifikasi, status } = req.body;

  console.log(req.body);
  let getInformationCustomer, checkOngkirNoOr, ekspedisi, noOrder, v_nopenjualan;

  const validation = await queryDB(query.validationQuery, [no_penjualan, kode_verifikasi]);

  if (validation.rows.length === 0) {
    const checkVerifikasi = await queryDB(query.checkVerifikasiQuery, [no_penjualan]);
    if (checkVerifikasi.rows.length === 0) {
      return response.ok(
        {
          status: "GAGAL",
          pesan: "tiga kode akhir penjualan Tidak Terdaftar di database!",
        },
        200,
        res
      );
    } else {
      let msg
      const verifikasiCode = await queryDB(query.verifikasiCodeQuery, [no_penjualan, kode_verifikasi]);
      if (verifikasiCode.rows.length > 0) {
        msg = "Order tersebut sudah di kirim!"
      } else {
        msg = "Kode verifikasi salah!"
      }
      return response.ok({ status: "GAGAL", pesan: msg }, 200, res);
    }
  }

  if (validation.rows.length > 1) {
    getInformationCustomer = await queryDB(query.getInformationCustomerQuery, [no_penjualan, kode_verifikasi]);
  } else {
    v_nopenjualan = validation.rows[0].no_penjualan;
    const v_checkOngkir = validation.rows[0].no_penjualan;
    const validationData = await queryDB(query.validationDataQuery, [v_checkOngkir]);
    if (validationData.rows.length === 0) {
      return response.ok({ status: "GAGAL", pesan: "No Penjualan Salah Silahkan Hub admin!" }, 200, res);
    }

    checkOngkirNoOr = validationData.rows[0].no_order;
    const getOngkir = await queryDB(query.getOngkirQuery, [checkOngkirNoOr]);
    if (getOngkir.rows.length > 0) {
      return response.ok(
        {
          status: "GAGAL",
          pesan: "Kain ini harus dikeluarkan lewat muat kain!",
        },
        200,
        res
      );
    }

    const validationRelasi = await queryDB(query.validationRelasiQuery, [v_checkOngkir]);
    if (validationRelasi.rows.length > 0) {
      ekspedisi = validationRelasi.rows[0].exspedisi;
    }
    const validationEkspedisi = await queryDB(query.validationEkspedisiQuery, [ekspedisi]);
    if (validationEkspedisi.rows.length > 0) {
      if (validationEkspedisi.rows[0].status_pengambilan !== "DIAMBIL") {
        return response.ok(
          {
            status: "GAGAL",
            pesan: "Tidak Bisa menyelesaikan proses pengeluaran kain, silahkan gunakan fitur muat kain",
          },
          200,
          res
        );
      }
    }

    const validationRelasiOrder = await queryDB(query.validationRelasiOrderQuery, [v_nopenjualan]);
    if (validationRelasiOrder.rows.length === 0) {
      return response.ok({ status: "GAGAL", pesan: "No Penjualan Salah Silahkan Hub admin!" }, 200, res);
    }
    noOrder = validationRelasiOrder.rows[0].no_order;
    const validasiAccPerubahan = await queryDB(query.validasiAccPerubahanQuery, [noOrder]);
    if (validasiAccPerubahan.rows.length > 0) {
      const checkAccPerubahan = await queryDB(query.checkAccPerubahanQuery, [noOrder, noOrder]);
      if (checkAccPerubahan.rows.length === 0) {
        return response.ok(
          {
            status: "GAGAL",
            pesan: "Exspedisi belum di sesuai dengan acc admin!",
          },
          200,
          res
        );
      }
    }
    const validationJenis = await queryDB(query.validationJenisQuery, [noOrder]);
    if (validationJenis.rows[0].jenis === "ONLINE" && validationJenis.rows[0].status_bayar !== "BAYAR DI TOKO") {
      const checking = await queryDB(query.checkingQuery, [noOrder]);
      if (checking.rows.length === 0) {
        return response.ok(
          {
            status: "GAGAL",
            pesan: "Pembayaran belum terverifikasi silahkan hub kepala toko untuk melakukan konfirmasi!",
          },
          200,
          res
        );
      }
    }

    const validationRelasiOrderdanPenjualan = await queryDB(query.validationRelasiOrderdanPenjualanQuery, [noOrder]);
    if (validationRelasiOrderdanPenjualan.rows.length === 0) {
      return response.ok(
        {
          status: "GAGAL",
          pesan: "Admin belum melakukan pencetakan faktur untuk order tersebut silahkan hub admin!",
        },
        200,
        res
      );
    }

    const validationOrder = await queryDB(query.validationOrderQuery, [noOrder]);
    if (validationOrder.rows.length > 0) {
      return response.ok(
        {
          status: "GAGAL",
          pesan: "Data order tersebut sudah Selesai di keluarkan oleh satpam!",
        },
        200,
        res
      );
    }
    getInformationCustomer = await queryDB(query.getInformationCustomerOtherQuery, [noOrder]);
  }
  let order_gabung
  const validationOrderGabung = await queryDB(
    `select * from  a_group_order ago 
      LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS asal ON asal.no_order=ago.no_order_asal 
      LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS gabung ON gabung.no_order=ago.no_order_gabung 
      where no_order_asal=? AND gabung.no_order IS NULL AND asal.no_order IS NULL`,
    [noOrder]
  );
  if (validationOrderGabung.rows.length > 0) {
    order_gabung = validationOrderGabung.rows[0].no_order_gabung
  }
  const validationOrderGabung2 = await queryDB(query.validationOrdeGabung2VerifikasiKodeVerifikasi, [noOrder]);
  if (validationOrderGabung2.rows.length > 0) {
    order_gabung = validationOrderGabung2.rows[0].no_order_asal
  }
  const data = {
    customer: getInformationCustomer.rows[0].nama,
    no_order: noOrder,
    no_faktur: v_nopenjualan,
    jenis_packing: getInformationCustomer.rows[0].jenis_packing,
    ekspedisi: getInformationCustomer.rows[0].exspedisi,
  };
  if (order_gabung) {
    data.pesan_order_gabung = `Order ini di gabung dengan order ${order_gabung}`
  }
  console.log(data);
  return response.ok({ status: "SUKSES", pesan: { ...data, status: '-' } }, 200, res);
};

const orderKatalog = async (props) => {
  const { req, res } = props;
  try {
    let v_nopenjualan, checkOngkirNoOr, getInformationCustomer;
    const { no_penjualan, kode_verifikasi } = req.body;
    console.log(req.body);
    const verifikasiPenjualan = await queryDB(query.verifikasiPenjualanQuery, [no_penjualan, kode_verifikasi]);
    if (verifikasiPenjualan.rows.length === 0) {
      const checkPenjualan = await queryDB(query.checkPenjualanQuery, [no_penjualan]);
      console.log("1");
      if (checkPenjualan.rows.length === 0) {
        return response.ok(
          {
            status: "GAGAL",
            pesan: "tiga kode akhir penjualan Tidak Terdaftar di database!",
          },
          200,
          res
        );
      } else {
        const validationCode = await queryDB(query.verifikasiPenjualanQuery, [no_penjualan, kode_verifikasi]);
        console.log("2");
        if (validationCode.rows > 0) {
          return response.ok({ status: "GAGAL", pesan: "Order tersebut sudah di kirim!" }, 200, res);
        } else {
          return response.ok({ status: "GAGAL", pesan: "Kode verifikasi salah!" }, 200, res);
        }
      }
    }
    if (verifikasiPenjualan.rows.length > 1) {
      getInformationCustomer = await queryDB(query.getInformationCustomerOrderKatalogQuery, [no_penjualan, kode_verifikasi]);
      console.log("3");
    } else {
      v_nopenjualan = verifikasiPenjualan.rows[0].no_penjualan;
      const v_checkOngkirNopen = verifikasiPenjualan.rows[0].no_penjualan;
      checkOngkirNoOr = verifikasiPenjualan.rows[0].no_penjualan;
      const getOngkir = await queryDB(query.getOngkirOrderKatalogQuery, [checkOngkirNoOr]);
      console.log("4");
      if (getOngkir.rows.length > 0) {
        return response.ok(
          {
            status: "GAGAL",
            pesan: "Katalog ini harus dikeluarkan lewat muat kain!",
          },
          200,
          res
        );
      }
      const validationRelasi = await queryDB(query.validationRelasiOrderKatalogQuery, [v_checkOngkirNopen]);
      console.log("5", v_checkOngkirNopen, validationRelasi);
      if (validationRelasi.rows.length > 0) {
        ekspedisi = validationRelasi.rows[0].ekspedisi;
      }
      const validationEkspedisi = await queryDB(query.validationEkspedisiOrderKatalogQuery, [ekspedisi]);
      console.log("6", ekspedisi, validationEkspedisi);
      if (validationEkspedisi.rows.length > 0) {
        if (validationEkspedisi.rows[0].status_pengambilan !== "DIAMBIL") {
          return response.ok(
            {
              status: "GAGAL",
              pesan: "Tidak Bisa menyelesaikan proses pengeluaran kain, silahkan gunakan fitur muat kain",
            },
            200,
            res
          );
        }
      }
      const validasiAccPerubahanEkspedisi = await queryDB(query.validationAccPerubahanEkspedisiOrderKatalogQuery, [checkOngkirNoOr]);
      console.log("7");
      if (validasiAccPerubahanEkspedisi.rows.length > 0) {
        const checkValidasi = await queryDB(query.checkValidasiOrderKatalogQuery, [checkOngkirNoOr, checkOngkirNoOr]);
        if (checkValidasi.rows.length > 0) {
          return response.ok(
            {
              status: "GAGAL",
              pesan: "Exspedisi belum di sesuai dengan acc admin!",
            },
            200,
            res
          );
        }
      }
      const validasiKatalog = await queryDB(query.validasiKatalogOrderKatalogQuery, [checkOngkirNoOr]);
      if (validasiKatalog.rows[0].jenis === "ONLINE") {
        const validasiPembayaran = await queryDB(query.validasiPembayaranOrderKatalogQuery, [checkOngkirNoOr]);
        if (validasiPembayaran.rows.length === 0) {
          return response.ok(
            {
              status: "GAGAL",
              pesan: "Pembayaran belum terverifikasi silahkan hub kepala toko untuk melakukan konfirmasi!",
            },
            200,
            res
          );
        }
      }
      const validasiKatalog2 = await queryDB(query.validasiKatalog2Query, [checkOngkirNoOr]);
      if (validasiKatalog2.rows.length === 0) {
        return response.ok({ status: "GAGAL", pesan: "Order tersebut belum selesai" }, 200, res);
      }
      const validasiNoOrder = await queryDB(query.validasiNoOrderQuery, [checkOngkirNoOr]);
      if (validasiNoOrder.rows.length > 0) {
        return response.ok(
          {
            status: "GAGAL",
            pesan: "Data order tersebut sudah Selesai di keluarkan oleh satpam!",
          },
          200,
          res
        );
      }
      getInformationCustomer = await queryDB(query.getInformationCustomerOrderKatalogOtherQuery, [checkOngkirNoOr]);
    }
    const validationOrderGabung = await queryDB(
      `select * from  a_group_order ago 
        LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS asal ON asal.no_order=ago.no_order_asal 
        LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS gabung ON gabung.no_order=ago.no_order_gabung 
        where no_order_asal=? AND gabung.no_order IS NULL AND asal.no_order IS NULL`,
      [checkOngkirNoOr]
    );
    let order_gabung
    if (validationOrderGabung.rows.length > 0) {
      order_gabung = validationOrderGabung.rows[0].no_order_gabung
    }
    const validationOrderGabung2 = await queryDB(query.validationOrdeGabung2VerifikasiKodeVerifikasi, [checkOngkirNoOr]);
    if (validationOrderGabung2.rows.length > 0) {
      order_gabung = validationOrderGabung2.rows[0].no_order_asal
    }
    const data = {
      customer: getInformationCustomer.rows[0]?.nama,
      no_order: getInformationCustomer.rows[0].no_penjualan,
      no_faktur: v_nopenjualan,
      jenis_packing: getInformationCustomer.rows[0].jenis_packing,
      ekspedisi: getInformationCustomer.rows[0].ekspedisi,
    };
    if (order_gabung) {
      data.pesan_order_gabung = `Order ini di gabung dengan order ${order_gabung}`
    }
    return response.ok({ status: 'SUKSES', pesan: data }, 200, res);
  } catch (error) {
    console.log(error);
    return response.ok({ status: "GAGAL", pesan: "Error System" }, 200, res);
  }
};

const verifikasiKodeVerifikasi = async (props) => {
  let information, temp, noOrder, statusData, resCustomer, order_gabung;
  const { res, req } = props;
  const { kode_verifikasi } = req.params;
  const { id } = decodedToken(req);

  const checkKodeRoll = await queryDB(query.checkKodeRollVerifikasiKodeVerifikasiQuery, [kode_verifikasi.slice(0, 1)]);
  if (checkKodeRoll.rows.length === 0) {
    return response.ok({ status: "GAGAL", pesan: "Kode verifikasi tidak di temukan" }, 200, res);
  }
  const validationKode = await queryDB(query.validationKodeVerifikasiKodeVerifikasiQuery, [kode_verifikasi.slice(1, 5)]);
  if (validationKode.rows.length > 0) {
    information = validationKode.rows;
  } else {
    const getInformation = await queryDB(query.getInformationVerifikasiKodeVerifikasiQuery, [kode_verifikasi.slice(1, 5), noOrder]);
    information = getInformation.rows;
  }
  if (information.length === 0) {
    return response.ok(
      {
        status: "GAGAL",
        pesan: "Kode verifikasi tidak terdaftar di database!",
      },
      200,
      res
    );
  }
  noOrder = information[0].no_order;
  temp = noOrder.slice(0, 2);

  const getData = await queryDB(`call sp_get_info_barang(?, ?, ?)`, [noOrder, req.params.kode_verifikasi, id]);
  const item = getData.rows[0][0];
  console.log([noOrder, req.params.kode_verifikasi, id, item.status]);

  if (item.status !== 200) {
    return response.ok(
      {
        status: "GAGAL",
        pesan: item.message,
      },
      200,
      res
    );
  }

  if (temp === "KT") {
    resCustomer = await queryDB(query.resCustomerVerfikasiKodeVerifikasiOther3Query, [noOrder]);
    no_penjualan = "-";
  } else {
    resCustomer = await queryDB(query.resCustomerVerfikasiKodeVerifikasiOther4Query, [noOrder]);
  }
  const validationOrderGabung = await queryDB(
    `select * from  a_group_order ago 
      LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS asal ON asal.no_order=ago.no_order_asal 
      LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS gabung ON gabung.no_order=ago.no_order_gabung 
      where no_order_asal=? AND gabung.no_order IS NULL AND asal.no_order IS NULL`,
    [noOrder]
  );

  if (validationOrderGabung.rows.length > 0) {
    order_gabung = validationOrderGabung.rows[0].no_order_gabung
  }
  const validationOrderGabung2 = await queryDB(query.validationOrdeGabung2VerifikasiKodeVerifikasi, [noOrder]);
  if (validationOrderGabung2.rows.length > 0) {
    order_gabung = validationOrderGabung2.rows[0].no_order_asal
  }
  // pesan_order_gabung: `Order ini di gabung dengan order ${order_gabung}`

  console.log(order_gabung);

  const data = {
    admin: item.vAdmin,
    status: item.vSiapKirim === 1 ? '-' : item.message,
    no_order: noOrder ? noOrder : "",
    ekspedisi: resCustomer.rows[0]?.ekspedisi || resCustomer.rows[0]?.exspedisi ? resCustomer.rows[0]?.ekspedisi || resCustomer.rows[0].exspedisi : "",
    customer: item.vCustomer,
    no_faktur: item.vNoFaktur,
    id_customer: item.vIdCustomer,
    tanggal_order: item.vTanggalOrder,
    tanggal_estimasi: item.vTanggalEstimasi || "-",
    tanggal_lunas: item.vTanggalLunas,
    progress_order: item.vProgres,
    jml_order: `${item.vJumlahRollan}(ROLLAN)   ${item.vJumlahKgan}(KGAN)`,
    // detail_barang: list_barang.rows ? list_barang.rows : [],
  };
  if (order_gabung) {
    data.pesan_order_gabung = `Order ini di gabung dengan order ${order_gabung}`
  }
  await Promise.all([data])

  await cetakSJ(id, noOrder, "PENGAMBILAN")

  return response.ok({ status: "SUKSES", pesan: data }, 200, res);
};

const kirim = async (props) => {
  const { no_order, id_karyawan, dataScan } = props;
  let tempNoOrder, checkSPenjualan, jenis, no_pengeluaran;
  tempNoOrder = no_order.slice(0, 2);
  if (tempNoOrder === "KT") {
    checkSPenjualan = await queryDB(query.checkSpenjualanKirim, [no_order]);
  } else {
    checkSPenjualan = await queryDB(query.checkSpenjualanKirim2, [no_order]);
  }
  jenis = checkSPenjualan.rows[0].jenis_pengiriman;
  const checkPengeluaranSatpam = await queryDB(query.checkPengeluaranSatpamKirim, [no_order]);
  console.log(checkPengeluaranSatpam.rows);
  if (checkPengeluaranSatpam.rows.length === 0) {
    if (jenis === "DIAMBIL") {
      await queryDB(`insert into pengeluaran_satpam values(0,?, now(),?,1)`, [no_order, id_karyawan]).then();
    } else {
      await queryDB(`insert into pengeluaran_satpam values(0,?, now(),?, 0)`, [no_order, id_karyawan]).then();
    }
    const getNoPengeluaran = await queryDB(query.getMaxNoPengeluaran);
    for (let i = 0; i < dataScan.rows.length; i++) {
      const x = dataScan.rows[i]
      no_pengeluaran = getNoPengeluaran.rows[0].no;
      if (x.stsscan === "Sudah di scan") {
        await queryDB(`insert into detail_pengeluaransatpam values(0, ?, ?, ?, ?, ?, 0)`, [no_pengeluaran, x.notransaksi, parseFloat(x.jml_potong), parseFloat(x.berat), jenis]).then();
      }
    }
    await queryDB(`insert into order_sudahdikirim values(?, now())`, [no_order]).then();
    await queryDB(`update konfirmasi_pembayaran set status_verifikasi = 'SUDAH DI VERIFIKASI SATPAM' where no_order =? `, [no_order]).then();
  }
};

const verifikasiKainManual = async (props) => {
  const { req, res } = props;
  try {
    const { id } = decodedToken(req);
    const id_karyawan = id;
    let { no_order, nomor } = req.body;
    let nomor_scan = nomor;
    let dataObj = {
      no_trans: "",
      jenis: "",
      jml_potong: "",
      berat: "",
      jn_sambil: "",
      id_customer: "",
      no_muat: "",
      no_urut: "",
      no_packing: "",
    };
    const { kode_verifikasi, no_kendaraan, status, nama_kendaraan } = req.body;
    console.log("sts", status);
    if (status?.match(/ekspedisi/gm)) {
      const data = await queryDB(`select * from temp_datamuat where no_mobil =? `, [no_kendaraan]);
      if (data.rows.length === 0) {
        return response.ok({ status: "GAGAL", pesan: "Nomor Mobil Tidak Terdaftar" }, 200, res);
      }
      if (!no_kendaraan) {
        return response.ok({ status: "GAGAL", pesan: "nomor mobil tidak boleh kosong !" }, 200, res);
      }
    }

    if (status?.match(/manual/gm) && !kode_verifikasi) {
      return response.ok({ status: "GAGAL", pesan: "Kode verifikasi harus diisi !" }, 200, res);
    }
    const checkKonfirmasiPembayaran = await queryDB(
      `select * from konfirmasi_pembayaran where no_order =?
    and status_verifikasi = 'BELUM DI VERIFIKASI'`,
      [no_order]
    );
    if (checkKonfirmasiPembayaran.rows.length > 0) {
      return response.ok(
        {
          status: "GAGAL",
          pesan: `Pembayaran belum terverifikasi silahkan hub kepala toko untuk melakukan konfirmasi!`,
        },
        200,
        res
      );
    }

    if (no_order?.slice(0, 2) === "KT") {
      const checkMasterPackingKatalog = await queryDB(`SELECT * FROM a_master_packingkatalog where id_balpenjualan =? `, [nomor_scan]);

      if (checkMasterPackingKatalog.rows.length > 0) {

        no_order = checkMasterPackingKatalog.rows[0].no_penjualan;
        if (checkMasterPackingKatalog.rows[0].no_order !== no_order) {
          return response.ok(
            {
              status: "GAGAL",
              pesan: `Barang ${nomor_scan} Bukan Untuk Order ${no_order} `,
            },
            200,
            res
          );
        }

        const checkTempPengeluaran = await queryDB(
          `select * from temp_pengeluaran tp join user u 
          on tp.id_karyawan = u.id_user where no_order =? AND id_karyawan <> ? `,
          [no_order, id_karyawan]
        );

        if (checkTempPengeluaran.rows.length > 0) {
          return response.ok(
            {
              status: "GAGAL",
              pesan: `Order Ini Telah dikerjakan oleh user ${checkTempPengeluaran.rows[0].nama} `,
            },
            200,
            res
          );
        }

        const checkOrderSudahDikirim = await queryDB(`select * from order_sudahdikirim where no_order =? `, [no_order]);

        if (checkOrderSudahDikirim.rows.length > 0) {
          return response.ok({ status: "GAGAL", pesan: `Barang sudah dikirim!` }, 200, res);
        }
        // untuk ekspedisi
        if (status?.replace(/scan-/gm, "") === "ekspedisi") {
          if (nama_kendaraan !== "DIKIRIM TOKO") {
            const checkAngkutan = await queryDB(`select * from s_penjualan_katalog where no_penjualan =? `, [no_order]);
            if (checkAngkutan.rows[0]?.ekspedisi !== no_kendaraan) {
              return response.ok(
                {
                  status: "GAGAL",
                  pesan: `Barang yang di scan bukan untuk angkutan ${no_kendaraan} !`,
                },
                200,
                res
              );
            }
          }
        }

        const getData = await queryDB(query.getDataVerifikasiKainManual, [nomor_scan]);

        dataObj.no_trans = getData.rows[0].id_balpenjualan;
        dataObj.jenis = getData.rows[0].sts;
        dataObj.jml_potong = getData.rows[0].jmlkatalog;
        dataObj.berat = 0;

        const tempPengeluaran = await queryDB(`select * from temp_pengeluaran where no_transaksi =? `, [dataObj.no_trans]);

        if (tempPengeluaran.rows.length === 0) {
          console.log(1);
          await queryDB(`insert into temp_pengeluaran values(0, ?, ?, ?, ?, ?)`, [dataObj.no_trans, dataObj.jenis, dataObj.jml_potong, dataObj.berat]).then();
        } else {
          const tempMuat = await queryDB(`select * from temp_muat where no_order =? `, [no_order]);
          const checkDetailMuat = await queryDB(`select * from detail_muat where no_pengeluaran =? `, [no_order]);

          if (tempMuat.rows.length === 0 && checkDetailMuat.rows.length === 0) {
            await queryDB(`delete from  temp_pengeluaran where no_transaksi =? `, [dataObj.no_trans]).then();
            await queryDB(`insert into temp_pengeluaran values(0, ?, ?, ?, ?, ?, ?)`, [dataObj.no_trans, dataObj.jenis, dataObj.jml_potong, dataObj.berat]).then();
          } else {
            return response.ok({ status: "GAGAL", pesan: "Data sudah di scan!" }, 200, res);
          }
        }
      }
      const checkPenjualanKatalog = await queryDB(
        `select * from  s_penjualan_katalog join customer c USING(id_customer)
            join n_kodeunik_6digit nkd using(id_customer) where no_penjualan =? `,
        [no_order]
      );

      const checkTempMuat = await queryDB(`select * from temp_muat where no_order =? and no_mobil !=? `, [no_order, no_kendaraan]);
      if (checkTempMuat.rows.length > 0) {
        return response.ok(
          {
            status: "GAGAL",
            pesan: `Order atas nama ${checkPenjualanKatalog.rows[0].nama} Sudah di muat di mobil ${checkTempMuat.rows[0].no_mobil} `,
          },
          200,
          res
        );
      }
      const checkAngkutan = await queryDB(`select * from s_penjualan_katalog where no_penjualan =? `, [no_order]);
      if (checkAngkutan.rows[0].jenis === "ONLINE") {
        const checkSudahVerified = await queryDB(
          `select * from konfirmasi_pembayaran where no_order =?
    and(status_verifikasi = 'SUDAH DI VERIFIKASI' or status_verifikasi = 'SUDAH DI VERIFIKASI SATPAM')`,
          [no_order]
        );
        if (checkSudahVerified.rows.length === 0) {
          return response.ok(
            {
              status: "GAGAL",
              pesan: `Pembayaran belum terverifikasi silahkan hub kepala toko untuk melakukan konfirmasi!`,
            },
            200,
            res
          );
        }
      }
      const checkFakturVerified = await queryDB(`select * from s_penjualan_katalog where no_penjualan =? and no_order = 'SIAP CETAK'`);
      if (checkFakturVerified.rows.length > 0) {
        return response.ok(
          {
            status: "GAGAL",
            pesan: `Admin belum melakukan pencetakan faktur untuk order tersebut silahkan hub admin!`,
          },
          200,
          res
        );
      }
      const checkKeluarVerified = await queryDB(`select no_order from pengeluaran_satpam where no_order =? `, [no_order]);
      if (checkKeluarVerified.rows.length > 0) {
        return response.ok(
          {
            status: "GAGAL",
            pesan: `Data order tersebut sudah Selesai  di keluarkan oleh satpam!`,
          },
          200,
          res
        );
      }
      const checkOrderGabung = await queryDB(query.checkOrderGabungVerifikasiKainManual, [no_order]);
      if (checkOrderGabung.rows.length > 0) {
        return response.ok({ status: "GAGAL", pesan: `Order ini di gabung dengan order lain` }, 200, res);
      }
      const dataScan = await queryDB(query.dataScanVerifikasiKainManual, [no_order, nomor_scan]);

      const getIdCustomer = await queryDB(`select id_customer from s_penjualan_katalog where no_penjualan =? `, [no_order]);
      dataObj.id_customer = getIdCustomer.rows[0].id_customer;
      if (no_kendaraan === "DIAMBIL CUSTOMER") {
        const checkNoMuat = await queryDB(query.checkNoMuatVerifikasiKainManual, [no_kendaraan]);

        if (checkNoMuat.rows.length > 0) {
          dataObj.no_muat = checkNoMuat.rows[0].no_muat;
          await queryDB(`select * from detail_muat where no_pengeluaran =? `, [no_order])
            .then(async res => {
              if (res.rows.length === 0) {
                await queryDB(`insert into detail_muat values(0, ?, ?, 10)`, [dataObj.no_muat, no_order]).then();
                await queryDB(`insert into a_cek_muat values(0,?,?, 4)`, [dataObj.no_muat, no_order]).then()
                const getNoUrut = await queryDB(`SELECT IFNULL(MAX(no_urut), 0) + 1 AS no_urut FROM a_nourut_muat WHERE no_muat =? `, [no_kendaraan]);
                dataObj.no_urut = getNoUrut.rows[0].no_urut;
                await queryDB(`insert into a_nourut_muat values(0, ?, ?, ?)`, [parseFloat(dataObj.no_urut), dataObj.no_muat, no_order]).then();
              }
            })

        } else {
          const checkTemp = await queryDB(`select * from temp_muat where no_order =? and status = 0`, [no_order]);
          if (checkTemp.rows.length === 0) {
            await queryDB(`insert into temp_muat values(0,?, now(), ?, 0, ?)`, [no_order, id_karyawan, no_kendaraan]).then();
          }
        }
      } else {
        if (dataScan.rows.length > 0) {
          const filtering = dataScan.rows.filter((x) => x.stsscan !== "Sudah di scan");
          if (filtering.length === 0) {
            kirim({ no_order, id_karyawan, dataScan });
          }
        }
      }
      return response.ok({ status: "SUKSES", pesan: `Data berhasil di scan!` }, 200, res);
    }
    const checkDataNgebal = await queryDB(
      `select no_order from data_ngebal dp JOIN detail_ngebal dpc 
      ON dpc.no_ngebal = dp.no_ngebal  where dp.no_ngebal =? `,
      [nomor_scan]
    );
    if (checkDataNgebal.rows.length > 0) {
      console.log("1");
      if (checkDataNgebal.rows[0].no_order !== no_order) {
        return response.ok(
          {
            status: "GAGAL",
            pesan: `Barang ${nomor_scan} Bukan Untuk Order ${no_order} `,
          },
          200,
          res
        );
      }

      no_order = checkDataNgebal.rows.length;
      const checkOrderSudahKirim = await queryDB(`select * from order_sudahdikirim where no_order =? `, [no_order]);
      if (checkOrderSudahKirim.rows.length > 0) {
        return response.ok({ status: "GAGAL", pesan: `Barang sudah dikirim!` }, 200, res);
      }
      if (status?.replace(/scan-/gm, "") === "ekspedisi") {
        if (nama_kendaraan !== "DIKIRIM TOKO") {
          const checkOrder = await queryDB(`select * from order_pembelian where no_order =? `, [no_order]);
          if (checkOrder.rows.length > 0) {
            if (no_kendaraan !== checkOrder.rows[0].exspedisi) {
              return response.ok(
                {
                  status: "GAGAL",
                  pesan: `Barang yang di scan bukan untuk ${no_kendaraan} !2`,
                },
                200,
                res
              );
            }
          }
        }
      }
      const checkOrderSiapPacking = await queryDB(`select * from order_siappacking where no_order =? `, [no_order]);
      if (checkOrderSiapPacking.rows.length > 0) {
        return response.ok({ status: "GAGAL", pesan: `Order tersebut belum selesai di bal` }, 200, res);
      }
      const getDataNgebal = await queryDB(
        `select dp.no_ngebal, sum(berat) as berat, sum(jml_potong) as jmlpotong, 'DIBAL' as sts, kode_verifikasi 
        from data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal = dp.no_ngebal  where dp.no_ngebal =? `,
        [nomor_scan]
      );
      if (status?.match(/manual/gm)) {
        if (kode_verifikasi !== getDataNgebal.rows[0]?.kode_verifikasi) {
          return response.ok({ status: "GAGAL", pesan: "kode verifikasi salah ! 3" }, 200, res);
        }
      }
      dataObj.no_trans = getDataNgebal.rows[0].no_ngebal;
      dataObj.jenis = getDataNgebal.rows[0].sts;
      dataObj.jml_potong = getDataNgebal.rows[0].jmlpotong;
      dataObj.berat = getDataNgebal.rows[0].berat;

      const checkTempPengeluaran = await queryDB(`select * from temp_pengeluaran where no_transaksi =? `, [dataObj.no_trans]);
      if (checkTempPengeluaran.rows.length === 0) {
        await queryDB(`insert into temp_pengeluaran values(0, ?, ?, ?, ?, ?, ?)`, [dataObj.no_trans, id_karyawan, no_order, dataObj.jenis, parseFloat(dataObj.jml_potong), parseFloat(dataObj.berat)]).then();
      } else {
        const checkDetailMuat = await queryDB(`select * from detail_muat where no_pengeluaran =? `, [no_order]);
        const checkTempMuat = await queryDB(`select * from temp_muat where no_order =? `, [no_order]);

        if (checkDetailMuat.rows.length === 0 && checkTempMuat.rows.length === 0) {
          await queryDB(`delete from  temp_pengeluaran where no_transaksi =? `, [dataObj.no_trans]).then();
          console.log(4);
          await queryDB(`insert into temp_pengeluaran values(0, ?, ?, ?, ?, ?, ?)`, [dataObj.no_trans, id_karyawan, no_order, dataObj.jenis, parseFloat(dataObj.jml_potong), parseFloat(dataObj.berat)]).then();
        } else {
          return response.ok({ status: "GAGAL", pesan: `Data sudah di scan! 4` }, 200, res);
        }
      }
    } else {
      console.log("2");
      const checkPacking = await queryDB(
        `select no_order, dp.no_packing, kode_verifikasi from data_packingkain dp JOIN detail_packingkain dpc
         ON dpc.no_packing = dp.no_packing  where no_roll =? `,
        [nomor_scan]
      );
      if (checkPacking.rows.length > 0) {
        console.log("no", nomor_scan);
        if (status?.match(/manual/gm)) {
          if (kode_verifikasi !== checkPacking.rows[0]?.kode_verifikasi) {
            return response.ok({ status: "GAGAL", pesan: "kode verifikasi salah ! 4" }, 200, res);
          }
        }
        console.log("3");
        if (checkPacking.rows[0].no_order !== no_order) {
          return response.ok(
            {
              status: "GAGAL",
              pesan: `Barang ${nomor_scan} bukan untuk Order ${no_order} `,
            },
            200,
            res
          );
        }
      } else {
        // no_order = checkPacking.rows[0].no_order;
        // dataObj.no_packing = checkPacking.rows[0].no_packing;

        const getDataPackingKain = await queryDB(
          `select dp.no_packing, sum(berat) as berat, count(no_detail) as jmlpotong, 'PACKING' as sts,
    kode_verifikasi from data_packingkain dp JOIN detail_packingkain dpc ON dpc.no_packing = dp.no_packing  
          where dp.no_packing =? `,
          [nomor_scan]
        );
        if (getDataPackingKain.rows[0].no_packing !== null) {
          dataObj.no_trans = getDataPackingKain.rows[0].no_ngebal;
          dataObj.jenis = getDataPackingKain.rows[0].sts;
          dataObj.jml_potong = getDataPackingKain.rows[0].jmlpotong;
          dataObj.berat = getDataPackingKain.rows[0].berat;
          if (status?.replace(/scan-/gm, "") === "ekspedisi") {
            if (nama_kendaraan !== "DIKIRIM TOKO") {
              const checkOrder = await queryDB(`select * from order_pembelian where no_order =? `, [no_order]);
              if (checkOrder.rows.length > 0) {
                console.log("4");
                if (no_kendaraan !== checkOrder.rows[0].exspedisi) {
                  return response.ok(
                    {
                      status: "GAGAL",
                      pesan: `Barang yang di scan bukan untuk ${no_kendaraan} !3`,
                    },
                    200,
                    res
                  );
                }
              }
            }
          }
          const checkTempPengeluaran = await queryDB(`select * from temp_pengeluaran where no_transaksi =? `, [dataObj.no_trans]);
          if (checkTempPengeluaran.rows.length === 0) {
            console.log(5);
            await queryDB(`insert into temp_pengeluaran values(0, ?, ?, ?, ?, ?, ?)`, [dataObj.no_trans, id_karyawan, no_order, dataObj.jenis, parseFloat(dataObj.jml_potong), parseFloat(dataObj.berat)]).then();
          } else {
            const checkDetailMuat = await queryDB(`select * from detail_muat where no_pengeluaran =? `, [no_order]);
            const checkTempMuat = await queryDB(`select * from temp_muat where no_order =? `, [no_order]);

            if (checkDetailMuat.rows.length === 0 && checkTempMuat.rows.length === 0) {
              await queryDB(`delete from  temp_pengeluaran where no_transaksi =? `, [dataObj.no_trans]).then();
              console.log(6);
              await queryDB(`insert into temp_pengeluaran values(0, ?, ?, ?, ?, ?, ?)`, [dataObj.no_trans, id_karyawan, no_order, dataObj.jenis, parseFloat(dataObj.jml_potong), parseFloat(dataObj.berat)]).then();
            } else {
              return response.ok({ status: "GAGAL", pesan: `Data sudah di scan! 3` }, 200, res);
            }
          }
        } else {
          const checkDataNgebal = await queryDB(
            `select no_order, dp.no_ngebal as nongebal, kode_verifikasi 
            from data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal = dp.no_ngebal  where no_packing_roll =? `,
            [nomor_scan]
          );
          if (status?.match(/manual/gm)) {
            if (kode_verifikasi !== getDataNgebal.rows[0]?.kode_verifikasi) {
              return response.ok({ status: "GAGAL", pesan: "kode verifikasi salah ! 5" }, 200, res);
            }
          }
          if (checkDataNgebal.rows.length > 0) {
            if (checkDataNgebal.rows[0].no_order !== no_order) {
              return response.ok(
                {
                  status: "GAGAL",
                  pesan: `Barang ${nomor_scan} bukan untuk Order ${no_order} `,
                },
                200,
                res
              );
            }
            no_order = checkDataNgebal.rows[0].no_order;
            nomor_scan = checkDataNgebal.rows[0].nongebal;

            const getDataNgebal = await queryDB(
              `select dp.no_ngebal, sum(berat) as berat, sum(jml_potong) as jmlpotong, 'DIBAL' as sts, kode_verifikasi 
              from data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal = dp.no_ngebal  where dp.no_ngebal =? `,
              [nomor_scan]
            );
            dataObj.no_trans = getDataNgebal.rows[0].no_ngebal;
            dataObj.jenis = getDataNgebal.rows[0].sts;
            dataObj.jml_potong = getDataNgebal.rows[0].jmlpotong;
            dataObj.berat = getDataNgebal.rows[0].berat;
            if (status?.replace(/scan-/gm, "") === "ekspedisi") {
              if (nama_kendaraan !== "DIKIRIM TOKO") {
                const checkOrder = await queryDB(`select * from order_pembelian where no_order =? `, [no_order]);
                if (checkOrder.rows.length > 0) {
                  if (no_kendaraan !== checkOrder.rows[0].exspedisi) {
                    return response.ok(
                      {
                        status: "GAGAL",
                        pesan: `Barang yang di scan bukan untuk ${no_kendaraan} !4`,
                      },
                      200,
                      res
                    );
                  }
                }
              }
            }
            const checkTempPengeluaran = await queryDB(`select * from temp_pengeluaran where no_transaksi =? `, [dataObj.no_trans]);

            if (checkTempPengeluaran.rows.length === 0) {
              await queryDB(`insert into temp_pengeluaran values(0, ?, ?, ?, ?, ?, ?)`, [dataObj.no_trans, id_karyawan, no_order, dataObj.jenis, parseFloat(dataObj.jml_potong), parseFloat(dataObj.berat)]).then();
            } else {
              const checkDetailMuat = await queryDB(`select * from detail_muat where no_pengeluaran =? `, [no_order]);
              const checkTempMuat = await queryDB(`select * from temp_muat where no_order =? `, [no_order]);

              if (checkDetailMuat.rows.length === 0 && checkTempMuat.rows.length === 0) {
                await queryDB(`delete from  temp_pengeluaran where no_transaksi =? `, [dataObj.no_trans]).then();
                console.log(8);
                await queryDB(`insert into temp_pengeluaran values(0, ?, ?, ?, ?, ?, ?)`, [dataObj.no_trans, id_karyawan, no_order, dataObj.jenis, parseFloat(dataObj.jml_potong), parseFloat(dataObj.berat)]).then();
              } else {
                return response.ok({ status: "GAGAL", pesan: `Data sudah di scan! 2` }, 200, res);
              }
            }
          } else {
            const checkPerincianOrder = await queryDB(
              `select op.no_order, pr.berat, no_roll, kode_verifikasi from perincian_order pr join detail_order
  using(no_Detail) JOIN order_pembelian op USING(no_order) LEFT JOIN detail_ngebal dn ON dn.no_packing_roll = pr.no_roll 
              WHERE no_roll =? and jenis_quantity = 'ROLLAN' AND dn.no_packing_roll IS NULL`,
              [nomor_scan]
            );
            if (status?.match(/manual/gm)) {
              if (kode_verifikasi !== checkPerincianOrder.rows[0]?.kode_verifikasi) {
                return response.ok({ status: "GAGAL", pesan: "kode verifikasi salah ! 6" }, 200, res);
              }
            }
            if (checkPerincianOrder.rows.length > 0) {
              if (checkPerincianOrder.rows[0].no_order !== no_order) {
                return response.ok(
                  {
                    status: "GAGAL",
                    pesan: `Barang ${nomor_scan} bukan untuk Order ${no_order} `,
                  },
                  200,
                  res
                );
              }
              no_order = checkPerincianOrder.rows[0].no_order;
              dataObj.no_trans = checkPerincianOrder.rows[0].no_roll;
              dataObj.jenis = "ROLLAN";
              dataObj.jml_potong = 1;
              dataObj.berat = checkPerincianOrder.rows[0].berat;
              const checkOrder = await queryDB(`select * from order_pembelian where no_order =? `, [no_order]);
              if (status?.replace(/scan-/gm, "") === "exspedisi") {
                if (nama_kendaraan !== "DIKIRIM TOKO") {
                  if (checkOrder.rows.length > 0) {
                    console.log(checkOrder.rows[0].exspedisi);
                    if (no_kendaraan !== checkOrder.rows[0].ekspedisi) {
                      return response.ok(
                        {
                          status: "GAGAL",
                          pesan: `Barang yang di scan bukan untuk ${no_kendaraan} !5`,
                        },
                        200,
                        res
                      );
                    }
                  }
                }
              }

              const checkTempPengeluaran = await queryDB(`select * from temp_pengeluaran where no_transaksi =? `, [dataObj.no_trans]);
              if (checkTempPengeluaran.rows.length === 0) {
                console.log(9);
                await queryDB(`insert into temp_pengeluaran values(0, ?, ?, ?, ?, ?, ?)`, [dataObj.no_trans, id_karyawan, no_order, dataObj.jenis, parseFloat(dataObj.jml_potong), parseFloat(dataObj.berat)]).then();
              } else {
                const checkDetailMuat = await queryDB(`select * from detail_muat where no_pengeluaran =? `, [no_order]);
                const checkTempMuat = await queryDB(`select * from temp_muat where no_order =? `, [no_order]);

                if (checkDetailMuat.rows.length === 0 && checkTempMuat.rows.length === 0) {
                  await queryDB(`delete from  temp_pengeluaran where no_transaksi =? `, [dataObj.no_trans]).then();
                  console.log(10);
                  await queryDB(`insert into temp_pengeluaran values(0, ?, ?, ?, ?, ?, ?)`, [dataObj.no_trans, id_karyawan, no_order, dataObj.jenis, parseFloat(dataObj.jml_potong), parseFloat(dataObj.berat)]).then();
                } else {
                  return response.ok({ status: "GAGAL", pesan: `Data sudah di scan! 1` }, 200, res);
                }
              }
            } else {
              return response.ok(
                {
                  status: "GAGAL",
                  pesan: `kain tidak terdaftar didata pengeluaran kain!`,
                },
                200,
                res
              );
            }
          }
        }
      }
    }

    const identitas = await queryDB(
      `select * from  order_pembelian join customer c USING(id_customer)
        join n_kodeunik_6digit nkd using(id_customer) where no_order =? `,
      [no_order]
    );
    const checkMuat = await queryDB(`select * from temp_muat where no_order =? and no_mobil !=? `, [no_order, no_kendaraan]);
    if (checkMuat.rows.length > 0) {
      return response.ok(
        {
          status: "GAGAL",
          pesan: `Order atas nama ${identitas.rows[0].nama} Sudah di muat di mobil ${no_kendaraan} `,
        },
        200,
        res
      );
    }
    const checkFakturVerified = await queryDB(`select * from relasi_orderdanpenjualan where no_order =? `, [no_order]);
    if (checkFakturVerified.rows.length === 0) {
      return response.ok(
        {
          status: "GAGAL",
          pesan: `Pembayaran belum terverifikasi silahkan hub kepala toko untuk melakukan konfirmasi!`,
        },
        200,
        res
      );
    }
    const checkOrderPembelian = await queryDB(`select * from order_pembelian where no_order =? `, [no_order]);
    if (checkOrderPembelian.rows[0].jenis === "ONLINE" && checkOrderPembelian.rows[0].status_bayar !== "BAYAR DI TOKO") {
      const checkKonfirmasiPembayaran = await queryDB(`select * from konfirmasi_pembayaran where no_order =? and status_verifikasi = 'BELUM DI VERIFIKASI'`, [no_order]);
      if (checkKonfirmasiPembayaran.rows.length > 0) {
        return response.ok(
          {
            status: "GAGAL",
            pesan: `Pembayaran belum terverifikasi silahkan hub kepala toko untuk melakukan konfirmasi!`,
          },
          200,
          res
        );
      }
    }
    const checkRelasi = await queryDB(`select * from relasi_orderdanpenjualan where no_order =? `, [no_order]);
    if (checkRelasi.rows.length === 0) {
      return response.ok(
        {
          status: "GAGAL",
          pesan: `Admin belum melakukan pencetakan faktur untuk order tersebut silahkan hub admin!`,
        },
        200,
        res
      );
    }
    const checkPengeluaran = await queryDB(`select no_order from pengeluaran_satpam where no_order =? and status = 1`, [no_order]);
    if (checkPengeluaran.rows.length > 0) {
      return response.ok(
        {
          status: "GAGAL",
          pesan: `Data order tersebut sudah Selesai  di keluarkan oleh satpam!`,
        },
        200,
        res
      );
    }
    const checkOrderGabung = await queryDB(
      `select * from  a_group_order ago
      LEFT JOIN(SELECT no_order FROM order_sudahdikirim) AS asal ON asal.no_order = ago.no_order_asal
      LEFT JOIN(SELECT no_order FROM order_sudahdikirim) AS gabung ON gabung.no_order = ago.no_order_gabung
      where no_order_asal =? AND gabung.no_order IS NULL AND asal.no_order IS NULL`,
      [no_order]
    );
    if (checkOrderGabung.rows.length > 0) {
      return response.ok({ status: "GAGAL", pesan: `Order ini di gabung dengan order lain` }, 200, res);
    }
    const dataScan = await queryDB(query.dataScanVerifikasiKainManual2, [no_order, no_order, no_order]);

    const getIdCustomer = await queryDB(`select id_customer from order_pembelian where no_order =? `, [no_order]);

    const checkGabungNgebal = await queryDB(`select * from a_gabung_ngebal where id_customer =? AND status = 'BELUM' `, [getIdCustomer.rows[0].id_customer]);
    if (checkGabungNgebal.rows.length > 0) {
      await queryDB(`update a_gabung_ngebal set status = 'SUDAH' where id_customer =? `, [getIdCustomer.rows[0].id_customer]).then();
    }

    if (no_kendaraan === "DIAMBIL CUSTOMER") {
      const checkMuatOrderan = await queryDB(
        `SELECT * FROM muat_orderan mo
          join detail_muat dm using(no_muat)
          left join ongkir ok ON ok.no_transaksi = dm.no_pengeluaran
          JOIN user u ON u.id_user = mo.id_user 
          WHERE mo.status = 0 AND ongkir > 0 and no_mobil =? GROUP BY no_muat`,
        [no_kendaraan]
      );

      if (checkMuatOrderan.rows.length > 0) {
        dataObj.no_muat = checkMuatOrderan.rows[0].no_muat;
        await queryDB(`select * from detail_muat where no_pengeluaran =? `, [no_order])
          .then(async res => {
            if (res.rows.length === 0) {
              await queryDB(`insert into detail_muat values(0, ?, ?, 10)`, [dataObj.no_muat, no_order]).then();
              await queryDB(`insert into a_cek_muat values(0,?,?, 5)`, [dataObj.no_muat, no_order]).then()

              const getNoUrut = await queryDB(`SELECT IFNULL(MAX(no_urut), 0) + 1 AS no_urut FROM a_nourut_muat WHERE no_muat =? `, [dataObj.no_muat]);
              dataObj.no_urut = getNoUrut.rows[0].no_urut;
              await queryDB(`insert into a_nourut_muat values(0, ?, ?, ?)`, [parseFloat(dataObj.no_urut), dataObj.no_muat, no_order]).then();
            }
          })

      } else {
        const checkTemp = await queryDB(`select * from temp_muat where no_order =? and status = 0`, [no_order]);
        if (checkTemp.rows.length === 0) {
          await queryDB(`insert into temp_muat values(0,?, now(), ?, 0, ?)`, [no_order, id_karyawan, no_kendaraan]).then();
        }
      }
    } else {
      if (dataScan.rows.length > 0) {
        const filtering = dataScan.rows.filter((x) => x.stsscan !== "Sudah di scan");
        if (filtering.length === 0) {
          kirim({ no_order, id_karyawan, dataScan });
        }
      }
    }
    return response.ok({ status: "SUKSES", pesan: `Data berhasil di scan` }, 200, res);
  } catch (e) {
    console.error(e);
    return response.ok(
      {
        status: "GAGAL",
        pesan: `Terjadi Kesalahan!.Error : ${JSON.stringify(e)} `,
      },
      200,
      res
    );
  }
};

const scan_batal_kirim = async (props) => {
  const { req, res } = props;
  let nomor_scan, jenis_pengiriman;
  const { no_order, no_transaksi, kode_verifikasi, status } = req.body;
  nomor_scan = no_order;
  const { id } = decodedToken(req);
  temp = no_order.match(/KT|kt/gm);
  if (temp) {
    jenis_pengiriman = await queryDB(query.jenisPengirimanScanBatalKirim, [no_order]);
  } else {
    jenis_pengiriman = await queryDB(query.jenisPengirimanScanBatalKirim2, [no_order, no_order, no_order, no_order]);
  }
  if (status?.match(/manual/gm)) {
    if (kode_verifikasi !== validation.rows[0]?.kode_verifikasi) {
      return response.ok({ status: "GAGAL", pesan: "Kode Verifikasi Salah ! 7" }, 200, res);
    }
  }
  console.log(no_transaksi, jenis_pengiriman.rows[0]?.notransaksi);
  if (status?.replace(/scan-/gm, "") === "ekspedisi") {
    if (nama_kendaraan !== "DIKIRIM TOKO") {
      const filterValidation = jenis_pengiriman.rows.filter((x) => x.notransaksi === no_transaksi);
      if (filterValidation.length === 0) {
        return response.ok(
          {
            status: "GAGAL",
            pesan: `Barang yang di scan Bukan Untuk Order ${nomor_scan} !6`,
          },
          200,
          res
        );
      }
    }
  }
  const getNoMuat = await queryDB(`select * from detail_muat where no_pengeluaran =? `, [nomor_scan]);
  const no_muat = getNoMuat.rows[0]?.no_muat;
  await queryDB(`delete from detail_muat where no_pengeluaran =? `, [nomor_scan]).then();
  await queryDB(`delete from temp_pengeluaran where no_order =? `, [nomor_scan]).then();
  await queryDB(`delete from order_sudahdikirim where no_order =? `, [nomor_scan]).then();
  await queryDB(`insert into a_historibatalkirim values(null,?, now(),?, '', 0.0)`, [nomor_scan, id]).then();
  const detail_muat = await queryDB(`select * from  detail_muat where no_muat =? `, [no_muat]);
  if (detail_muat.rows.length === 0) {
    await queryDB(`delete from muat_orderan where no_muat =? `, [no_muat]);
    return response.ok({ status: "SUKSES", pesan: "Data berhasil di batalkan !" }, 200, res);
  }
  return response.ok({ status: "SUKSES", pesan: "Data berhasil di batalkan !" }, 200, res);
};

const scan_bs_segel = async (props) => {
  const { req, res } = props;
  const { nomor_scan, kode_verifikasi, status } = req.body;
  const { id } = decodedToken(req);
  let no_pengeluaran, id_karyawan, no, jml, berat;
  const validation = await queryDB(
    `select no_pengeluaran, kode_verifikasi from data_ngebal_bssegel 
    join n_relasi_bssegel using(no_ngebal) where no_ngebal =? `,
    [nomor_scan]
  );
  if (status?.match(/manual/gm)) {
    if (kode_verifikasi !== validation.rows[0].kode_verifikasi) {
      return response.ok({ status: "GAGAL", pesan: "Kode verifikasi salah ! 8" }, 200, res);
    }
  }

  if (validation.rows.length === 0) {
    return response.ok(
      {
        status: "GAGAL",
        pesan: "Barcode Scan tidak terdaftar di data muat BS SEGEL",
      },
      200,
      res
    );
  }
  no_pengeluaran = validation.rows[0].no_pengeluaran;

  no_pengeluaran = validation.rows[0].no_pengeluaran;
  id_karyawan = id;
  const checkPengeluaran = await queryDB(`select no from pengeluaran_satpam_bssegel where no_pengeluaran =? `, [no_pengeluaran]);
  if (checkPengeluaran.rows.length === 0) {
    await queryDB(`insert into pengeluaran_satpam_bssegel values(0, ?, now(), ?, 0)`, [no_pengeluaran, id_karyawan]).then();
  }
  const getNo = await queryDB(`select no from pengeluaran_satpam_bssegel where no_pengeluaran =? `, [no_pengeluaran]);
  const getDataOptional = await queryDB(query.getDataOptionalScanBsSegel);
  no = getNo.rows[0].no;
  jml = getDataOptional.rows[0].jml;
  berat = getDataOptional.rows[0].berat;
  await queryDB(`insert into detail_pengeluaransatpam_bssegel values(0, ?, ?, ?, ?, 'BAL', 1)`, [no, nomor_scan, jml, berat]).then();
  if (getDataOptional.rows.length === 0) {
    await queryDB(`update pengeluaran_satpam_bssegel set status = 1 where status = 0 and no_pengeluaran =? `, [no_pengeluaran]).then();
  }
  return response.ok(
    {
      status: "SUKSES",
      pesan: `${no_pengeluaran} Selesai di scan`,
    },
    200,
    res
  );
};

const batalScanBsSegel = async (props) => {
  const { req, res } = props;
  try {
    const { nomor_roll, no_pengeluaran } = req.body;
    const validationScanOn = await queryDB(`select * from detail_pengeluaransatpam_bssegel where no_transaksi =? `, [nomor_roll]);
    if (validationScanOn.rows.length === 0) {
      return response.ok(
        {
          status: "SUKSES",
          pesan: `Bal yang di scan tidak terdaftar di list pengeluaran bs segel atau belum di scan! `,
        },
        200,
        res
      );
    }
    const validationScanFor = await queryDB(`select * from n_relasi_bssegel where no_pengeluaran =? and no_ngebal =? `, [no_pengeluaran, nomor_roll]);
    if (validationScanFor.rows.length === 0) {
      return response.ok(
        {
          status: "SUKSES",
          pesan: `Bal yang di scan bukan untuk no penjualan ${no_pengeluaran} `,
        },
        200,
        res
      );
    }
    const validationScanValid = await queryDB(
      `SELECT * FROM n_relasi_bssegel JOIN perincian_piutang p 
      on no_pengeluaran = no_jual where p.status = 2 and no_ngebal =? `,
      [nomor_roll]
    );
    if (validationScanValid.rows.length !== 0) {
      return response.ok(
        {
          status: "SUKSES",
          pesan: `Tidak bisa dibatalkan karena sudah dibayarkan oleh akunting!`,
        },
        200,
        res
      );
    }
    await queryDB(`delete from detail_pengeluaransatpam_bssegel where no_transaksi =? `, [nomor_roll]).then();
    const checkAtValidation = await queryDB(
      `select * from pengeluaran_satpam_bssegel d 
        join detail_pengeluaransatpam_bssegel ds on d.no = ds.no_pengeluaran where d.no_pengeluaran =? `,
      [no_pengeluaran]
    );
    if (checkAtValidation.rows.length === 0) {
      await queryDB(`delete from pengeluaran_satpam_bssegel where no_pengeluaran =? `, [no_pengeluaran]).then();
    }
    return response.ok(`Bal ${nomor_roll} berhasil dibatalkan`, 200, res);
  } catch (e) {
    console.error(e);
    return response.ok({ status: "GAGAL", pesan: e.message }, 200, res);
  }
};

const TambahMuatEkspedisi = async (props) => {
  const { no_order, req } = props;
  const { status, no_kendaraan, supir, angkutan } = req.body;
  const id_karyawan = decodedToken(req).id;
  const getNoMuat = await queryDB(`select * from muat_orderan where no_mobil =? `);
  const no_muat = getNoMuat.rows[0].no_muat;
  if (!no_order) {
    return "no_order tidak boleh kosong !";
  } else {
    angkutan = getNoMuat.rows[0].angkutan;
    await queryDB(`insert into muat_orderan values(?, ?, ?, now(), ?, 0, ?)`, [no_muat, no_kendaraan, supir, id_karyawan, angkutan]).then();
    await queryDB(`insert into muat_temp values(?, ?, ?, now(), ?, 0, ?)`, [no_muat, no_kendaraan, supir, id_karyawan, angkutan]).then();
    const getDataTempMuat = await queryDB(`select * from temp_muat where no_mobil =? `, [no_kendaraan]);
    for (let i = 0; i < getDataTempMuat.rows.length; i++) {
      no_order = getDataTempMuat.rows[i].no_order;
      const checkOngkir = await queryDB(`select * from ongkir where no_transaksi = (select no_penjualan from relasi_orderdanpenjualan where no_order =?)`, [no_order]);
      if (checkOngkir.rows.length > 0) {
        ongkir = checkOngkir.rows[0].ongkir;
      }
      await queryDB(`select * from  detail_muat where no_pengeluaran =? `, [no_order])
        .then(async res => {
          if (res.rows.length === 0) {
            await queryDB(`insert into detail_muat values(0,?,?, 0)`, [generateNoMuat, no_order]).then();
            await queryDB(`insert into a_cek_muat values(0,?,?, 6)`, [generateNoMuat, no_order]).then()

            const getNoUrut = await queryDB(`SELECT IFNULL(MAX(no_urut), 0) + 1 AS no_urut FROM a_nourut_muat WHERE no_muat =? `, [generateNoMuat]);
            no_urut = getNoUrut.rows[0].no_urut;
            await queryDB(`insert into a_nourut_muat values(0, ?, ?, ?)`, [no_urut, generateNoMuat, no_order]).then();
          }
        })
    }
    const checkDataMuat = await queryDB(`select * from temp_datamuat where no_mobil =? `, no_kendaraan);
    if (checkDataMuat.rows.length > 0) {
      await queryDB(`delete from temp_datamuat where no_mobil =? `, [no_kendaraan]).then();
    }
    const checkMuat = await queryDB(`select * from temp_muat where no_mobil =? `, [no_kendaraan]);
    if (checkMuat.rows.length > 0) {
      await queryDB(`delete from temp_muat where no_mobil =? `, [no_kendaraan]).then();
    }
    const dataOrder = await queryDB(
      `SELECT op.no_order, nama, jenis_packing FROM order_pembelian op LEFT JOIN order_sudahdikirim os USING(no_order)
    left join temp_pengeluaran tp USING(no_order) LEFT JOIN order_siappacking osp USING(no_order) 
    join customer c using(id_customer) join relasi_orderdanpenjualan rod on(op.no_order = rod.no_order) 
    join penjualan_kainstok pk on(rod.no_penjualan = pk.no_pengeluaran)
    where os.no_order is null and tp.no_order is null and op.status = 1 
    AND osp.status <> 0 AND osp.status <> 1 and op.exspedisi =? and op.no_order =? `,
      [nama_ekspedisi, no_order]
    );
    return dataOrder.rows;
  }
};

module.exports = {
  orderKain,
  orderKatalog,
  verifikasiKodeVerifikasi,
  verifikasiKainManual,
  scan_batal_kirim,
  scan_bs_segel,
  batalScanBsSegel,
  kirim,
  TambahMuatEkspedisi,
};
