// const { queryDB } = require("../../helpers/SqlCoreModule");

// module.exports = {
//     findAll: async function findAll({ tablename, where }) {
//         let result
//         switch (tablename) {
//             case 'data_penjualan':
//                 result = await queryDB(`SELECT * FROM(
//                     SELECT op.no_order,op.tanggal,'WEBSITE' AS sumber FROM order_pembelian op JOIN a_relasi_orderweb 
//                     USING(no_order) JOIN detail_order od USING(no_order) 
//                     UNION
//                     (SELECT op.no_order,op.tanggal,'CHAT' AS sumber  FROM order_pembelian op 
//                     JOIN detail_order USING(no_order) 
//                     LEFT JOIN a_relasi_orderweb ar ON(ar.no_order=op.no_order) 
//                     LEFT JOIN n_pemasangan_olshop np ON(np.no_order=op.no_order)
//                     WHERE op.jenis='ONLINE' AND ar.no_order IS NULL AND np.no_order 
//                     IS NULL))dt ${where.tanggal_awal ? `WHERE dt.tanggal BETWEEN '${where.tanggal_awal}' AND '${where.tanggal_akhir}'` : ''} GROUP BY no_order`)
//                 break;
//             case 'master_penjualan':
//                 result = await queryDB(`SELECT telepon AS no_telepon_utama, nama,jenis_kain,warna AS warna_kain, berat_ataujmlroll AS total_kg 
//                         FROM order_pembelian op JOIN detail_order USING(no_order) JOIN customer USING(id_customer)
//                         WHERE op.jenis='ONLINE' ${where.tanggal_awal ? `and op.tanggal BETWEEN '${where.tanggal_awal}' AND '${where.tanggal_akhir}'` : ''};`)
//                 break;
//             case 'detail_penjualan':
//                 result = await queryDB(`SELECT dt.* FROM order_pembelian op
//                     JOIN (SELECT op.tanggal AS tanggal_beli, op.no_order,no_roll,berat,'HOLIS' AS cabang, 
//                     IF(SUBSTR(np.no_pesanan,3)='INV' OR SUBSTR(np.no_pesanan,3)='TOK', 'TOKOPEDIA', IFNULL('ONLINE','SHOPEE')) AS jenis
//                     FROM order_pembelian op JOIN detail_order USING(no_order) JOIN perincian_order USING(no_detail) 
//                     LEFT JOIN n_pemasangan_olshop np ON(np.no_order=op.no_order)) dt USING(no_order)
//                     WHERE op.jenis='ONLINE' ${where.tanggal_awal ? `and op.tanggal BETWEEN '${where.tanggal_awal}' AND '${where.tanggal_akhir}'` : ''};`)
//                 break;
//         }
//         return result.rows
//     }
// }

