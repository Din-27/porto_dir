require("dotenv").config();
var express = require("express");
var app = express();
var cors = require("cors");
const nocache = require("nocache");
app.use(
  cors({
    credentials: true,
    origin: "*",
  })
);
var port = 8135;
var bodyParser = require("body-parser");
var server = require("http").createServer(app);
const { queryDB, dumpError, set, get, del } = require("./config/conn/tabel");
const response = require("./config/res/res");
const io = require("socket.io")(server, { cors: { origin: "*" } });
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(nocache());

const getNewOrder = async () => {
  try {
    let status, setNoOrder, setNoOrder2
    const getSelesaiOld = await queryDB(`SELECT op.no_order,
    IF(op.jenis_packing = 'LANGSUNG KIRIM',
    IF(ro.no_order IS NULL,'Disiapkan','Selesai'),
    IF(ro.no_order IS NULL,'Disiapkan',IF((IFNULL(sp.status,0) = 2) OR (IFNULL(sp.status,0) = 4),'Selesai','Disiapkan'))) AS sts
    FROM order_pembelian op
    LEFT JOIN (SELECT no_order AS noorder,tanggal FROM a_histori_cetakfakturasli WHERE STATUS='INSERT') dtc ON dtc.noorder=op.no_order
    LEFT JOIN (SELECT id_customer FROM customer WHERE nama LIKE '%KNITTO%' OR nama LIKE '%PT. KARTIKA SINAR MULIA%') c ON op.id_customer=c.id_customer
    LEFT JOIN relasi_orderdanpenjualan ro USING(no_order)
    LEFT JOIN order_sudahdikirim os USING(no_order)
    LEFT JOIN order_siappacking sp USING(no_order)
    LEFT JOIN janji_kirimcustomer jk ON jk.no_order=op.no_order
    LEFT JOIN (SELECT no_order FROM a_orderditunggu GROUP BY no_order) dt ON op.no_order=dt.no_order
    LEFT JOIN a_bidding_order abo ON abo.no_order=op.no_order
    WHERE SUBSTR(op.no_order,1,2) <> 'TF' AND (op.jenis = 'TOKO' OR dt.no_order IS NOT NULL) AND os.no_order IS NULL AND c.id_customer IS NULL 
    AND abo.no_order IS NULL AND DATE(IF(op.jenis = 'TOKO',NOW(),jk.tanggal))=DATE(NOW()) 
    AND (dtc.noorder IS NULL OR DATE(dtc.tanggal) = DATE(NOW()))
    ORDER BY op.tanggal ASC`);

    const getSelesaiNew = await queryDB(`SELECT dt.* FROM (
      SELECT op.no_order,
      IF(op.jenis_packing = 'LANGSUNG KIRIM',
      IF(ro.no_order IS NULL,'Disiapkan','Selesai'),
      IF(ro.no_order IS NULL,'Disiapkan',IF((IFNULL(sp.status,0) = 2) OR (IFNULL(sp.status,0) = 4),'Selesai','Disiapkan'))) AS sts
      FROM order_pembelian op
      LEFT JOIN (SELECT no_order AS noorder,tanggal FROM a_histori_cetakfakturasli WHERE status='INSERT') dtc ON dtc.noorder=op.no_order
      LEFT JOIN (SELECT id_customer FROM customer WHERE nama LIKE '%KNITTO%' OR nama LIKE '%PT. KARTIKA SINAR MULIA%') c ON op.id_customer=c.id_customer
      LEFT JOIN relasi_orderdanpenjualan ro USING(no_order)
      LEFT JOIN order_sudahdikirim os USING(no_order)
      LEFT JOIN order_siappacking sp USING(no_order)
      LEFT JOIN janji_kirimcustomer jk ON jk.no_order=op.no_order
      LEFT JOIN (SELECT no_order FROM a_orderditunggu GROUP BY no_order) dt ON op.no_order=dt.no_order
      LEFT JOIN a_bidding_order abo ON abo.no_order=op.no_order
      WHERE SUBSTR(op.no_order,1,2) <> 'TF' AND (op.jenis = 'TOKO' OR dt.no_order IS NOT NULL) AND os.no_order IS NULL AND c.id_customer IS NULL 
      AND abo.no_order IS NULL AND DATE(IF(op.jenis = 'TOKO',NOW(),jk.tanggal))=DATE(NOW()) 
      AND (dtc.noorder IS NULL OR DATE(dtc.tanggal) = DATE(NOW()))
      having  sts='Selesai'
      ORDER BY op.tanggal ASC) dt
      LEFT JOIN (SELECT no_order FROM temp_antrian_order WHERE sts = 'Selesai') dtemp ON dt.no_order=dtemp.no_order
      WHERE dtemp.no_order IS NULL`);
    const no_order = getSelesaiNew.rows[0]?.no_order;
    status = getSelesaiNew.rows[0]?.sts;
    const checkStatus = await queryDB(`SELECT IF(COUNT(no_order) > 1,'Tidak dengan angka','Dengan angka') AS sts FROM temp_antrian_order WHERE RIGHT(no_order,3)=RIGHT(?,3) AND sts = 'Disiapkan'`, [no_order]);
    await queryDB(`delete from temp_antrian_order`);
    console.log('test', await get('new_order'))
    getSelesaiOld.rows.map(async (x, y) => {
      await queryDB(`insert temp_antrian_order values(?, ?, 0, ?)`, [x.no_order, x.sts, new Date()]);
    });
    return {
      no_order: no_order,
      status: checkStatus.rows[0].sts,
      sts: status
    };
  } catch (e) {
    console.log(e);
    dumpError(e);
  }
};

const getData = async () => {
  try {
    const getDataOrder =
      await queryDB(`SELECT op.no_order,c.nama,
      IF(op.jenis_packing = 'LANGSUNG KIRIM',
      IF(ro.no_order IS NULL,'Disiapkan','Selesai'),
      IF(ro.no_order IS NULL,'Disiapkan',IF((IFNULL(sp.status,0) = 2) OR (IFNULL(sp.status,0) = 4),'Selesai','Disiapkan'))) AS sts,
      (SELECT cek_persentaseantrian(op.no_order)) AS persentase ,op.tanggal 
      FROM order_pembelian op
      JOIN customer c ON op.id_customer=c.id_customer
      LEFT JOIN (SELECT no_order AS noorder,tanggal FROM a_histori_cetakfakturasli WHERE status='INSERT') dtc ON dtc.noorder=op.no_order
      LEFT JOIN (SELECT id_customer FROM customer WHERE nama LIKE '%KNITTO%' OR nama LIKE '%PT. KARTIKA SINAR MULIA%') ct ON op.id_customer=ct.id_customer
      LEFT JOIN relasi_orderdanpenjualan ro USING(no_order)
      LEFT JOIN order_sudahdikirim os USING(no_order)
      LEFT JOIN order_siappacking sp USING(no_order)
      LEFT JOIN janji_kirimcustomer jk ON jk.no_order=op.no_order
      LEFT JOIN (SELECT no_order FROM a_orderditunggu GROUP BY no_order) dt ON op.no_order=dt.no_order
      LEFT JOIN a_bidding_order abo ON abo.no_order=op.no_order
      WHERE SUBSTR(op.no_order,1,2) <> 'TF' AND (op.jenis = 'TOKO' OR dt.no_order IS NOT NULL) AND os.no_order IS NULL AND ct.id_customer IS NULL 
      AND abo.no_order IS NULL AND DATE(IF(op.jenis = 'TOKO',NOW(),jk.tanggal))=DATE(NOW()) 
      AND (dtc.noorder IS NULL OR DATE(dtc.tanggal) = DATE(NOW()))
      ORDER BY op.tanggal ASC`);
    const filterisasi = getDataOrder.rows.filter(x => x.sts === 'Selesai')
    const getingNoOrder = filterisasi.map(x => x.no_order)
    await set('new_order', JSON.stringify(getingNoOrder))
    return getDataOrder.rows;
  } catch (e) {
    console.log(e);
    dumpError(e);
  }
};

app.get("/data-tes", async (req, res) => {
  try {
    return res.send(await getNewOrder());
  } catch (e) {
    console.log(e);
  }
});

app.get("/dataantrianorder/service", async (req, res) => {
  try {
    const data =
      await queryDB(`SELECT op.no_order,c.nama,
      IF(op.jenis_packing = 'LANGSUNG KIRIM',
      IF(ro.no_order IS NULL,'Disiapkan','Selesai'),
      IF(ro.no_order IS NULL,'Disiapkan',IF((IFNULL(sp.status,0) = 2) OR (IFNULL(sp.status,0) = 4),'Selesai','Disiapkan'))) AS sts,
      (SELECT cek_persentaseantrian(op.no_order)) AS persentase ,op.tanggal 
      FROM order_pembelian op
      JOIN customer c ON op.id_customer=c.id_customer
      LEFT JOIN (SELECT no_order AS noorder,tanggal FROM a_histori_cetakfakturasli WHERE status='INSERT') dtc ON dtc.noorder=op.no_order
      LEFT JOIN (SELECT id_customer FROM customer WHERE nama LIKE '%KNITTO%' OR nama LIKE '%PT. KARTIKA SINAR MULIA%') ct ON op.id_customer=ct.id_customer
      LEFT JOIN relasi_orderdanpenjualan ro USING(no_order)
      LEFT JOIN order_sudahdikirim os USING(no_order)
      LEFT JOIN order_siappacking sp USING(no_order)
      LEFT JOIN janji_kirimcustomer jk ON jk.no_order=op.no_order
      LEFT JOIN (SELECT no_order FROM a_orderditunggu GROUP BY no_order) dt ON op.no_order=dt.no_order
      LEFT JOIN a_bidding_order abo ON abo.no_order=op.no_order
      WHERE SUBSTR(op.no_order,1,2) <> 'TF' AND (op.jenis = 'TOKO' OR dt.no_order IS NOT NULL) AND os.no_order IS NULL AND ct.id_customer IS NULL 
      AND abo.no_order IS NULL AND DATE(IF(op.jenis = 'TOKO',NOW(),jk.tanggal))=DATE(NOW()) 
      AND (dtc.noorder IS NULL OR DATE(dtc.tanggal) = DATE(NOW()))
      ORDER BY op.tanggal ASC`);
    return response.ok({ status: "SUKSES", pesan: data.rows }, 200, res);
  } catch (e) {
    dumpError(e);
    console.log(e);
    return response.ok({ status: "GAGAL", pesan: e.message }, 300, res);
  }
});

setInterval(async () => {
  io.emit("antrian_order", await getData());
}, 4000)

setInterval(async () => {
  let test
  // console.log(await getNewOrder());
  const newOrder = await getNewOrder()
  if (newOrder.no_order) {
    const dataFilter = JSON.parse(await get('new_order'))
    const getNoOrder = dataFilter.filter(x => x.no_order !== newOrder.no_order)
    if (getNoOrder.length > 0) {
      io.emit("detail_antrian_order", newOrder);
      test = true
    } else {
      test = false
    }
  } else {
    test = 'no updated'
  }
  // console.log(test)
}, 1000);

const oneDay = 1000 * 60 * 60 * 24

setTimeout(async () => {
  await del('new_order')
}, oneDay)

server.listen(port, () => console.log(`sistem_antrian_order:${port} || ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`));
