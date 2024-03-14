"use strict";

const query = require("../utils/query");
const response = require("../../config/res/res");
const { transaksi_muat3, transaksi_muat4, tampilkanSemuaListBarang } = require("../utils/query");
const { queryDB, starttransaction, commit, rollback, decodedToken } = require("../../config/conn/tabel");
const { cetakSJ } = require("./cetak");
const tabel = require("../../config/conn/tabel");
var qdata = "";

async function get_noorder(nomor_scan, no_order) {
  // cek no yang di scan apakah no ngebal ?
  const checkscanngebal = await queryDB(
    `select ifnull(no_order,'Kosong') as no_order,sum(berat) as berat,sum(jml_potong) as jmlpotong,'DIBAL' as sts from data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal  where dp.no_ngebal=? or no_packing_roll=?`,
    [nomor_scan, nomor_scan]
  );
  // cek no yang di scan apakah no roll di dalam packing ?
  const checkscanpacking = await queryDB(
    `SELECT IFNULL(no_order,'Kosong') AS no_order,dp.no_packing,SUM(berat) AS berat,COUNT(no_detail) AS jmlpotong,'PACKING' AS sts FROM data_packingkain dp JOIN detail_packingkain dpc ON dpc.no_packing=dp.no_packing  WHERE no_roll=? OR dp.no_packing=?`,
    [nomor_scan, nomor_scan]
  );
  // cek no yang di scan apakah no rollan ?
  const checkscanrollan = await queryDB(
    `select ifnull(op.no_order,'Kosong') as no_order,sum(pr.berat) as berat,no_roll,'ROLLAN' as sts from perincian_order pr join detail_order using(no_Detail) JOIN order_pembelian op
  USING(no_order) LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=pr.no_roll WHERE no_roll=?  and jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL `,
    [nomor_scan]
  );
  // cek no yang di scan apakah no katalog ?
  const checkscankatalog = await queryDB(
    `SELECT ifnull(no_penjualan,'Kosong') as no_order,SUM(dpc.status) AS jmlpotong,'0' as berat,'DIBAL' as sts FROM a_master_packingkatalog dp JOIN a_packing_katalog dpc ON dpc.no_packing=dp.id_balpenjualan  where dp.id_balpenjualan=?`,
    [nomor_scan]
  );

  // const ress = await Promise.all([checkscanngebal, checkscanpacking, checkscanrollan, checkscankatalog]);
  let ress
  if (checkscanngebal.rows[0].no_order !== 'Kosong') ress = checkscanngebal
  if (checkscanpacking.rows[0].no_order !== 'Kosong') ress = checkscanpacking
  if (checkscanrollan.rows[0].no_order !== 'Kosong') ress = checkscanrollan
  if (checkscankatalog.rows[0].no_order !== 'Kosong') ress = checkscankatalog

  let noorder = "";
  let status = "";
  let jmlpotong;
  let berat;
  let pesan = "Gagal";
  let nohasilscan = nomor_scan;
  let hasilrespon, item;

  if (ress) {
    if (ress.rows.length > 0) {
      ress.rows.map(function (hasil) {
        hasilrespon = hasil;
        if (hasilrespon.no_order !== "Kosong") {
          noorder = hasilrespon.no_order;
          jmlpotong = hasilrespon.jmlpotong;
          berat = hasilrespon.berat;
          status = hasilrespon.sts;
          pesan = "Sukses";
          if (status == "PACKING") {
            nohasilscan = hasilrespon.no_packing;
          }
        }
      });
    }
  }
  console.log(no_order, noorder)
  console.log(pesan);
  if (pesan == "Gagal") {
    pesan = "kain tidak terdaftar didata pengeluaran kain!";
    status = "Gagal";
    noorder = "";
    jmlpotong = 0;
    berat = 0;
  }

  let nama_customer = "";
  let id_customer = 0;
  if (status !== "Gagal") {
    if (noorder?.slice(0, 2) === "KT") {
      const getnamacustomer = await queryDB(`SELECT id_customer,nama FROM s_penjualan_katalog op join customer c using(id_customer)  where no_penjualan=?`, [noorder]);
      console.log("no order nya", noorder);
      nama_customer = getnamacustomer.rows[0]?.nama;
      id_customer = getnamacustomer.rows[0]?.id_customer;
    } else {
      const getnamacustomer = await queryDB(`SELECT id_customer,nama FROM order_pembelian op join customer c using(id_customer)  where no_order=?`, [noorder]);
      console.log("no order nya", noorder);
      nama_customer = getnamacustomer.rows[0]?.nama;
      id_customer = getnamacustomer.rows[0]?.id_customer;
    }

    // pengecekan barang yang di scan harus di no order yang sama
    if (no_order != "") {
      if (no_order !== noorder) {
        pesan = `Barang ${nomor_scan} Bukan Untuk Order ${no_order}`;
        status = "Gagal";
        noorder = no_order;
        jmlpotong = 0;
        berat = 0;
      }
    }
  } else {
    nama_customer = "";
  }
  console.log(pesan, status);
  let data = {
    noorder: noorder,
    pesan: pesan,
    status: status,
    namacustomer: nama_customer,
    id_customer: id_customer,
    jmlpotong: jmlpotong,
    berat: berat,
    nohasilscan: nohasilscan,
  };
  return data;
}

const checkKodeVerifikasi = async (req) => {
  let result = 'sukses', dataArr = [], kode = []
  const { status, kode_verifikasi, nomor } = req.body
  if (status?.match(/manual/gm) && !kode_verifikasi) {
    result = "Kode verifikasi harus diisi !"
  }
  const getDataNgebal = await queryDB(
    `select  kode_verifikasi from data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal where dp.no_ngebal=?`,
    [nomor]
  );
  // const checkRelasiOrderDanPenjualan = await queryDB(`SELECT no_order,kv.kode_verifikasi FROM relasi_orderdanpenjualan 
  // JOIN kode_verifikasipenjualan kv USING(no_penjualan)
  // JOIN data_ngebal dp USING(no_order)
  // WHERE dp.no_ngebal=?`, [nomor])
  const checkPacking = await queryDB(
    `select kode_verifikasi from data_packingkain dp JOIN detail_packingkain dpc
     ON dpc.no_packing=dp.no_packing where dp.no_packing=?`,
    [nomor]
  );
  const checkDataNgebal = await queryDB(
    `select kode_verifikasi from data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal where no_packing_roll=?`,
    [nomor]
  );
  const checkPerincianOrder = await queryDB(
    `SELECT pp.kode AS kode_verifikasi FROM perincian_order pr JOIN detail_order USING(no_Detail) JOIN order_pembelian op 
    USING(no_order) LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=pr.no_roll LEFT JOIN perincian_penerimaanstok pp ON pp.no_roll=pr.no_roll
    WHERE pp.no_roll=? AND jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL`,
    [nomor]
  );
  dataArr = [getDataNgebal, checkPacking, checkDataNgebal, checkPerincianOrder]
  for (let i = 0; i < dataArr.length; i++) {
    kode.push(dataArr[i]?.rows[0]?.kode_verifikasi)
  }
  const filterKode = kode.filter(x => x !== undefined)
  console.log(`${kode_verifikasi}`, `${filterKode[0]}`)
  if (status?.match(/manual/gm) && filterKode.length > 0) {
    if (parseFloat(kode_verifikasi) !== parseFloat(filterKode[0])) {
      console.log(parseFloat(kode_verifikasi) !== parseFloat(filterKode[0]))
      result = "kode verifikasi salah !"
    }
  }
  console.log(result)
  return result
}

async function penjagaan_scan(datalemparan) {
  const { hasil_no_order, ekspedisi, no_kendaraan, status_scan, nomor_scan, id_karyawan, nama_customer } = datalemparan;
  console.log(datalemparan)
  // cek barang sudah dirikim?
  const checksudahdikirim = queryDB(`select no_order,'checksudahdikirim' as step,'Barang sudah dikirim' as pesan from order_sudahdikirim where no_order=?`, [hasil_no_order]);
  // cek barang sudah discan
  const checksudahdiscan = queryDB(`select no_order,'checksudahdiscan' as step,'Data sudah di scan!' as pesan from temp_pengeluaran where no_transaksi=?`, [nomor_scan]);
  // cek barang sudah dirikim?
  //no order berada pada nomor mobil yg pernah diangkut
  const getNoMobil = await queryDB(`select no_mobil from temp_muat where no_order=?`, [hasil_no_order])
  const checksudahdimuat = queryDB(`select no_order,'checksudahdimuat' as step,'Order atas nama ${nama_customer} Sudah di muat di mobil  ${getNoMobil.rows[0]?.no_mobil}' as pesan from temp_muat where no_order=? and no_mobil!=?`, [
    hasil_no_order,
    no_kendaraan,
  ]);
  const checkbelumdibayar = queryDB(`select no_order,'checkbelumdibayar' as step, 'Pembayaran belum terverifikasi silahkan hub kepala toko untuk melakukan konfirmasi !' as pesan from konfirmasi_pembayaran where no_order=? and status_verifikasi='BELUM DI VERIFIKASI'`, [hasil_no_order]);
  const checkdikerjakanoranglain = queryDB(
    `select no_order,'checkdikerjakanoranglain' as step, CONCAT('Order ini Telah dikerjakan oleh ', nama) as pesan from temp_pengeluaran tp join user u on tp.id_karyawan=u.id_user where no_order=? AND id_karyawan <> ?`,
    [hasil_no_order, id_karyawan]
  );
  let checkangkutan;

  let datapromise = [checksudahdikirim, checksudahdiscan, checksudahdimuat, checkbelumdibayar, checkdikerjakanoranglain];

  if (hasil_no_order?.slice(0, 2) === "KT") {
    checkangkutan = await queryDB(`select ekspedisi as angkutan from s_penjualan_katalog where no_penjualan=? `, [hasil_no_order]);
  } else {
    checkangkutan = await queryDB(`select exspedisi as angkutan from order_pembelian where no_order=?`, [hasil_no_order]);
    const checkpengebalan = queryDB(`select no_order,'checkangkutanorder' as step,'Order tersebut belum selesai di bal' as pesan from order_siappacking where no_order=? AND status <>2 AND status<>4`, [hasil_no_order]);
    const checksudahterverifikasi = queryDB(
      `SELECT no_order,'checksudahterverifikasi' AS step, 'Pembayaran belum terverifikasi silahkan hub kepala toko untuk melakukan konfirmasi!' AS pesan 
      FROM konfirmasi_pembayaran WHERE no_order=? AND status_verifikasi='BELUM DI VERIFIKASI'`,
      [hasil_no_order]
    );
    const checkPenjagaanDetailOrder = queryDB(`SELECT dt.nomor, no_order,
      concat(no_order,' Order tersebut belum selesai di bal!') AS pesan  
      FROM (SELECT IFNULL(dk.no_packing,pr.no_roll) AS nomor, no_order FROM perincian_order pr 
      JOIN detail_order dp USING(no_detail)
      JOIN order_pembelian op USING(no_order)
      LEFT JOIN detail_packingkain dk ON pr.no_roll=dk.no_roll
      WHERE dp.no_order=? AND op.jenis_packing <> 'LANGSUNG KIRIM' GROUP BY nomor) dt
      LEFT JOIN detail_ngebal dn ON dt.nomor =dn.no_packing_roll 
      WHERE dn.no_ngebal IS NULL`, [hasil_no_order])
    const checksudahcetakfakturasli = queryDB(
      `select op.no_order,'checksudahcetakfakturasli' as step,'Order ini belum melakukan cetak faktur asli' as pesan FROM order_pembelian op
      LEFT JOIN relasi_orderdanpenjualan ro ON op.no_order=ro.no_order
      LEFT JOIN penjualan_kainstok pk ON ro.no_penjualan=pk.no_pengeluaran
      WHERE op.no_order=? AND (pk.no_pengeluaran IS NULL OR pk.status=0)`,
      [hasil_no_order]
    );
    const checkordersudahdikeluarkansatpam = queryDB(
      `select no_order,'checkordersudahdikeluarkansatpam' as step,'Data order tersebut sudah Selesai  di keluarkan oleh satpam!' as pesan from pengeluaran_satpam where no_order=? and status=1 `,
      [hasil_no_order]
    );
    if (status_scan == "No Bal") {
      datapromise.push(checkpengebalan);
    }
    datapromise.push(checkPenjagaanDetailOrder)
    datapromise.push(checksudahterverifikasi);
    datapromise.push(checksudahcetakfakturasli);
    datapromise.push(checkordersudahdikeluarkansatpam);
  }

  const ress = await Promise.all(datapromise);
  let penjagaan = "lolos";
  let pesan;
  let step;
  let data;

  ress.map(function (hasil) {
    if (hasil.rows.length > 0) {
      if (penjagaan !== "Stop") {
        penjagaan = "Stop";
        step = hasil.rows[0].step;
        pesan = hasil.rows[0].pesan;
      }
    }
  });

  console.log("no ordernya", hasil_no_order);
  console.log("chek", checkangkutan.rows);
  if (no_kendaraan !== "DIAMBIL CUSTOMER") {
    let ekspedisiorder = checkangkutan.rows[0].angkutan;
    if (ekspedisi !== ekspedisiorder) {
      if (ekspedisi?.slice(0, 3) !== ekspedisiorder?.slice(0, 3)) {
        data = {
          status_response: "Stop",
          pesan: `Barang yang di scan bukan untuk angkutan ${ekspedisi}`,
        };
      }
    }
  }

  if (penjagaan == "Stop") {
    data = {
      status_response: "Stop",
      pesan: pesan,
    };
  } else {
    data = {
      status_response: "Jalan",
      pesan: "Sukses",
    };
  }

  return data;
}

async function cek_gabungorder(noorder) {
  const checkscanngebal = await queryDB(
    `SELECT * FROM  a_group_order ago 
    LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS asal ON asal.no_order=ago.no_order_asal 
    LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS gabung ON gabung.no_order=ago.no_order_gabung 
    WHERE (no_order_asal=? OR no_order_gabung=?) AND gabung.no_order IS NULL AND asal.no_order IS NULL`,
    [noorder, noorder]
  );
  console.log("cekscan", checkscanngebal);
  let data;
  if (checkscanngebal.rows.length > 0) {
    let order = "";
    if (noorder == checkscanngebal.rows[0].no_order_asal) {
      order = checkscanngebal.rows[0].no_order_gabung;
    } else {
      order = checkscanngebal.rows[0].no_order_asal;
    }

    data = {
      status_gabung: "Gabung Orderan",
      pesan: `Order ini digabung dengan order ${order}`,
    };
  } else {
    data = {
      status_gabung: "Tidak di gabung",
      pesan: "",
    };
  }

  return data;
}

const checkEkspedisi = async (props) => {
  const { noorder, nama_kendaraan } = props
  let checking, msg = 'sukses'
  checking = await queryDB(`select *, ekspedisi AS exspedisi from s_penjualan_katalog where no_penjualan=?`, [noorder])
  if (checking.rows.length === 0) {
    checking = await queryDB(`select * from order_pembelian where no_order=?`, [noorder])
  }
  console.log(checking.rows[0]?.exspedisi, nama_kendaraan)
  if (checking.rows.length > 0) {
    if (nama_kendaraan === 'DIKIRIM TOKO') {
      msg = 'sukses'
    } else if (checking.rows[0]?.exspedisi?.slice(0, 3) !== nama_kendaraan?.slice(0, 3)) {
      msg = `Barang yang di scan bukan untuk angkutan ${nama_kendaraan}`
    }
  }
  return msg
}

async function cek_selesaiscan(noorder, bodyStatus) {
  if (noorder?.slice(0, 2) === "KT") {
    qdata = await queryDB(
      `SELECT dp.no_penjualan AS no_order,dp.id_balpenjualan AS notransaksi,SUM(dpc.status) AS jml_potong,0.00 AS berat,
      'DIBAL' AS sts, IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, '_' as lokasi
      FROM a_master_packingkatalog dp                                                                                                                                                                                     
      JOIN a_packing_katalog dpc ON dpc.no_packing=dp.id_balpenjualan                                                                                                                                                     
      LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan                                                                                                                                             
      WHERE dp.no_penjualan=?  AND tp.no_transaksi IS NULL`,
      [noorder]
    );
  } else {
    qdata = await queryDB(
      `SELECT dp.no_packing AS notransaksi,SUM(dpc.berat) AS berat,COUNT(dp.no_packing) AS jml_potong,'PACKING' AS jenis_packing,
      IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(ls.no_lokasi,'-') AS lokasi
      FROM data_packingkain dp JOIN detail_packingkain dpc ON dpc.no_packing=dp.no_packing LEFT JOIN detail_ngebal dg  
      ON dg.no_packing_roll=dp.no_packing LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing  
      LEFT JOIN lokasi_selesai ls ON ls.no_transaksi = dp.no_packing   
      WHERE dg.no_packing_roll IS NULL  AND dp.no_order=?       
      GROUP BY dp.no_packing                                                                                                         
      UNION                                                                                                                         
      SELECT dp.no_ngebal AS notransaksi,SUM(dpc.berat) AS berat,SUM(dpc.jml_potong) AS jml_potong,'BAL' AS jenis_packing,                  
      IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(ls.no_lokasi,'-') AS lokasi
      FROM data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal
      LEFT JOIN lokasi_selesai ls ON ls.no_transaksi = dp.no_ngebal
      WHERE dp.no_order=?                                                 
      GROUP BY dp.no_ngebal                                                                                                        
      UNION                                                                                                                        
      SELECT po.no_roll AS notransaksi,po.berat,1 AS jml_potong,'ROLLAN' AS jenis_packing,                                            
      IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(pp.no_lokasi,'-') AS lokasi
      FROM perincian_order po JOIN detail_order dr USING(no_Detail) JOIN order_pembelian op USING(no_order)
      LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=no_roll
      LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll
      LEFT JOIN perincian_penerimaanstok pp ON pp.no_roll = po.no_roll
      WHERE op.no_order=? AND jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL`,
      [noorder, noorder, noorder]
    );
  }
  const checking = qdata.rows.filter(item => item.stsscan === 'Sudah di scan')
  console.log(checking.length, qdata.rows.length, 'ini checking filter')
  let data, numOfChecking = checking.length + 1
  if (bodyStatus.includes('muat-ekspedisi')) {
    numOfChecking = checking.length
  }
  console.log(numOfChecking)
  if (numOfChecking === qdata.rows.length) {
    data = {
      status_scan: "Selesai",
    };
  } else {
    data = {
      status_scan: "Belum Selesai",
    };
  }
  return data;
}

exports.scanbarang = async function (req, res) {
  try {
    let { nomor, no_order } = req.body;
    const { no_kendaraan, nama_kendaraan, kode_verifikasi } = req.body;
    console.table(req.body)
    const bodyStatus = req.body.status
    let hasil_scan, dataOrderMuat, qdata, getData, getEkspedisi;
    const nomor_scan = nomor;
    const id_karyawan = decodedToken(req).id;
    const ekspedisi = nama_kendaraan;

    //check kode verifikasi
    const checkKode = await checkKodeVerifikasi(req)
    console.log(checkKode, 'ini ceck kode ========================================================')
    if (checkKode !== 'sukses') {
      return response.ok({ pesan: checkKode, status: 'GAGAL' }, 200, res);
    }
    console.table(req.body);
    // hasil_scan = await get_noorder(nomor_scan, "");
    // console.log(req.body.status?.match(/muat-ekspedisi/gm))

    // konversi dari no scan menjadi no order
    hasil_scan = await get_noorder(nomor_scan, no_order);
    const { noorder, pesan, namacustomer, id_customer, status, jmlpotong, berat, nohasilscan } = hasil_scan;

    // check order beda ekspedisi
    const checkingEkspedisi = await checkEkspedisi({ noorder, nama_kendaraan })
    if (checkingEkspedisi !== 'sukses' && bodyStatus.includes('ekspedisi')) {
      return response.ok({ pesan: checkingEkspedisi, status: ' GAGAL' }, 200, res);
    }
    // jika no_scan tidak terdaftar di pengeluaran barang
    if (status == "Gagal") {
      response.ok({ pesan: pesan, status: status }, 200, res);

      // jika no_scan terdaftar di data pengeluaran barang 
    } else {

      let data_order = { hasil_no_order: noorder, ekspedisi: ekspedisi, no_kendaraan: no_kendaraan, status_scan: status, nomor_scan: nohasilscan, nama_customer: namacustomer, id_karyawan: id_karyawan };

      // penjagaan scan sebelum di input datanya
      const hasilpenjagaan = await penjagaan_scan(data_order);

      getData = await queryDB(`select * from order_pembelian where no_order=?`, [noorder]);
      const no_sj = await queryDB(`SELECT no_sj FROM penjualan_kainstok
      JOIN relasi_orderdanpenjualan ON(no_pengeluaran=no_penjualan)
      WHERE no_order=?`, [noorder])
      const item = getData.rows[0]
      const data = {
        nama_customer: namacustomer,
        no_order: noorder,
        jenis_packing: item?.jenis_packing,
        no_sj: no_sj.rows[0]?.no_sj || '',
        ekspedisi: ekspedisi
      }
      //tambah muat

      console.log(hasilpenjagaan.status_response);
      // jika lolos dari penjagaan input ke tabel temp_pengeluaran
      if (hasilpenjagaan.status_response == "Jalan") {

        // tambah muat
        const checkTempMuat = await queryDB(`select * from temp_muat where no_order=? and no_mobil=?`, [noorder, no_kendaraan])
        if (bodyStatus.includes('muat-ekspedisi') && checkTempMuat.rows.length === 0) {
          await queryDB(`insert into temp_muat values(null, ?, now(), ?, 0, ?)`, [noorder, id_karyawan, no_kendaraan]).then();
        }
        // cek apakah ordernya gabung order
        const cekgabungorder = await cek_gabungorder(noorder);
        console.log(cekgabungorder)
        let pesan_gabung = "";
        if (cekgabungorder.status_gabung == "Gabung Orderan") {
          pesan_gabung = cekgabungorder.pesan;
        } else {
          pesan_gabung = "";
        }
        // validasi gabung order
        const val_cekgabungorder = await queryDB(`select no from a_gabung_ngebal where id_customer=? AND status='BELUM' `, [id_customer]);
        // validasi cek muat
        const val_cekmuat = await queryDB(
          `SELECT no_muat FROM muat_orderan mo 
           join detail_muat dm using(no_muat) 
           left join ongkir ok ON ok.no_transaksi=dm.no_pengeluaran 
           JOIN user u ON u.id_user=mo.id_user  
           WHERE mo.status=0 AND ongkir > 0 and no_mobil=? GROUP BY no_muat`,
          [no_kendaraan]
        );
        // validasi cek detail muat
        const val_cekdetailmuat = await queryDB(`select no_detail from detail_muat where no_pengeluaran=?`, [noorder]);
        // validasi cek temmuat
        const val_cektemmuat = await queryDB(`select no from temp_muat where no_order=? and status=0`, [noorder]);


        // cek apakah bukan diambil customer
        if (bodyStatus?.includes('ekspedisi')) {
          console.log(nama_kendaraan, 'TIDAK DIAMBIL CUSTOMER')
          if (val_cekgabungorder.rows.length > 0) {
            await queryDB(`update a_gabung_ngebal set status='SUDAH' where id_customer=? `, [id_customer]).then();
          }
          await queryDB(`insert into temp_pengeluaran values(0,?,?,?,?,?,?) `, [nohasilscan, id_karyawan, noorder, status, jmlpotong, berat]).then();
          if (val_cekmuat.rows.length > 0) {
            let nomuat = val_cekmuat.rows[0];
            if (val_cekdetailmuat.rows.length === 0) {
              await queryDB(`select * from detail_muat where no_pengeluaran=?`, [noorder])
                .then(async onres => {
                  if (onres.rows.length === 0) {
                    await queryDB(`insert into detail_muat values(0,?,?,10) `, [nomuat, noorder]).then();
                    await queryDB(`insert into a_cek_muat values(0,?,?,2)`, [nomuat, no_order]).then()
                    console.log('masuk ekspedisi')
                  }
                })
              const get_nourut = await queryDB(`SELECT IFNULL(MAX(no_urut),0) + 1 AS no_urut FROM a_nourut_muat WHERE no_muat=?`, [nomuat]);
              const nourut = get_nourut.rows[0].no_urut;
              await queryDB(`insert into a_nourut_muat values(0,?,?,?)`, [nourut, nomuat, noorder]).then();
            }
          } else {
            if (val_cektemmuat.rows.length === 0) {
              await queryDB(`insert into temp_muat values(0,?,now(),?,0,?)`, [noorder, id_karyawan, no_kendaraan]).then();
            }
          }

        } else {
          console.log('DIAMBIL CUSTOMER')
          // cek apakah barang sudah di scan semua
          const cekselesaiscan = await cek_selesaiscan(noorder, bodyStatus);
          console.log(cekselesaiscan)

          // jika barang sudah di scan semua
          console.log(cekselesaiscan.status_scan, 'ini check status')
          if (cekselesaiscan.status_scan === "Selesai") {
            console.log('selesai semua')
            const val_pengeluaransatpam = await queryDB(`select no from pengeluaran_satpam where no_order=?`, [noorder]);
            const val_ordersudahdikirim = await queryDB(`select no_order from order_sudahdikirim where no_order=?`, [noorder]);

            let get_jenis_pengiriman;
            if (noorder?.slice(0, 2) === "KT") {
              get_jenis_pengiriman = await queryDB(`select jenis_pengiriman from s_penjualan_katalog where no_penjualan=?`, [noorder]);
            } else {
              get_jenis_pengiriman = await queryDB(`select jenis_pengiriman from order_pembelian where no_order=?`, [noorder]);
            }
            let jenis_pengiriman = get_jenis_pengiriman.rows[0].jenis_pengiriman;

            const get_maxpengeluaransatpam = await queryDB(`select max(no) as no from pengeluaran_satpam`);
            let nopengeluaran = get_maxpengeluaransatpam.rows[0].no;

            await queryDB(`insert into temp_pengeluaran values(0,?,?,?,?,?,?) `, [nohasilscan, id_karyawan, noorder, status, jmlpotong, berat]).then();
            if (val_pengeluaransatpam.rows.length === 0) {
              console.log('1')
              let status_pengeluaransatpam;
              if (jenis_pengiriman === "DIAMBIL") {
                status_pengeluaransatpam = 1;
              } else {
                status_pengeluaransatpam = 0;
              }
              qdata = await queryDB(query.tampilkanSemuaListBarang, [noorder, noorder, noorder]);
              await queryDB(`insert into pengeluaran_satpam values(0,?,now(),?,?)`, [noorder, id_karyawan, status_pengeluaransatpam]).then();

              for (let hasildata of qdata.rows) {
                let notransaksi = hasildata.notransaksi;
                let jenis = hasildata.jenis_packing;
                let jmlpotong = hasildata.jml_potong;
                let berat = hasildata.berat;
                if (hasildata.stsscan === "Sudah di scan") {
                  await queryDB(`insert into detail_pengeluaransatpam values(0,?,?,?,?,?,0 )`, [nopengeluaran, notransaksi, jmlpotong, berat, jenis]).then();
                }
              }
              await queryDB(`update konfirmasi_pembayaran set status_verifikasi='SUDAH DI VERIFIKASI SATPAM' where no_order=?`, [noorder]).then();
            }
            if (val_ordersudahdikirim.rows.length === 0) {
              await queryDB(`insert into order_sudahdikirim values(?,now())`, [noorder]).then();
            }

            // jika barang belum beres di scan
          } else {
            console.log('belum selesai semua')
            if (val_cekgabungorder.rows.length > 0) {
              await queryDB(`update a_gabung_ngebal set status='SUDAH' where id_customer=? `, [id_customer]).then();
            }
            await queryDB(`insert into temp_pengeluaran values(0,?,?,?,?,?,?) `, [nohasilscan, id_karyawan, noorder, status, jmlpotong, berat]).then();
            if (val_cekmuat.rows.length > 0) {
              let nomuat = val_cekmuat.rows[0];
              if (val_cekdetailmuat.rows.length === 0) {
                await queryDB(`select * from  detail_muat where no_pengeluaran=?`, [noorder])
                  .then(async onres => {
                    if (onres.rows.length === 0) {
                      await queryDB(`insert into detail_muat values(0,?,?,10) `, [nomuat, noorder]).then();
                      await queryDB(`insert into a_cek_muat values(0,?,?,3)`, [nomuat, no_order]).then()

                    }
                  })

                const get_nourut = await queryDB(`SELECT IFNULL(MAX(no_urut),0) + 1 AS no_urut FROM a_nourut_muat WHERE no_muat=?`, [nomuat]);
                const nourut = get_nourut.rows[0].no_urut;
                await queryDB(`insert into a_nourut_muat values(0,?,?,?)`, [nourut, nomuat, noorder]).then();
              }
            } else {
              if (val_cektemmuat.rows.length === 0) {
                await queryDB(`insert into temp_muat values(0,?,now(),?,0,?)`, [noorder, id_karyawan, no_kendaraan]).then();
              }
            }
          }
        }


        console.log("==========cetak sj scan barang", id_karyawan, noorder)

        const getPartial = await queryDB(tampilkanSemuaListBarang, [
          noorder,
          noorder,
          noorder,
        ]);
        if (getPartial.rows.length > 0 && getPartial.rows.findIndex(item => item.stsscan === "Belum di Scan") < 0) {
          await cetakSJ(id_karyawan, noorder, "SCAN")
        }


        console.log(no_order, noorder)

        console.log(dataOrderMuat);
        // response.ok({ status: "Sukses", pesan: { ...dataOrderMuat, noorder, pesan_gabung: pesan_gabung } }, 200, res);
        console.log(bodyStatus.includes('muat-ekspedisi') ? data : 'Berhasil Scan')
        return response.ok({
          status: "Sukses", pesan: bodyStatus.includes('muat-ekspedisi')
            ? { ...data, pesan_gabung: pesan_gabung || '' }
            : 'Berhasil Scan'
        }, 200, res);

        // jika gagal tampilkan pesan kesalahan ke user
      } else {
        console.log(hasilpenjagaan, "ini pesan else");
        return response.ok({ pesan: hasilpenjagaan.pesan, status: "Gagal" }, 200, res);
      }
    }

  } catch (e) {
    console.log(e);
    // logs_error.logs_error("GetLinkorder", tabel.GetError(e));
    response.ok({ message: "ERROR API KNITTO" }, 301, res);
  }
};
exports.handleBack = async function (req, res) {
  try {
    const { no_order } = req.body;
    const id_karyawan = decodedToken(req).id;

    console.log("==========handleBack", id_karyawan, no_order)

    const getPartial = await queryDB(tampilkanSemuaListBarang, [
      no_order,
      no_order,
      no_order,
    ]);
    let vketerangan = ""
    if (getPartial.rows.findIndex(item => item.stsscan === "Belum di Scan") < 0) {
      vketerangan = await cetakSJ(id_karyawan, no_order)
    }

    response.ok({ message: vketerangan }, 200, res)

  } catch (e) {
    response.ok({ message: tabel.GetError(e) }, 301, res)
  }
}