const queryStorage = {
  queryFindAllDataPengeluaran: `SELECT nama_customer AS nama,created_at AS tanggal ,no_order,
    IF(SUBSTR(acs.no_order,1,2)<>'KT',(SELECT COUNT(no_order) AS jml FROM detail_order
    WHERE no_order=acs.no_order),
    (SELECT SUM(qty) FROM s_detail_penjualankatalog
    WHERE no_penjualan=acs.no_order)) AS jml_potong,
    IFNULL((SELECT SUM(berat) AS berat
    FROM detail_order JOIN perincian_order USING(no_detail)
    WHERE no_order=acs.no_order),
    (SELECT SUM(berat) * jml_potong FROM s_detail_penjualankatalog
    JOIN s_tabel_katalog USING(id_katalog)
    WHERE no_penjualan=acs.no_order)) AS berat
    FROM antrian_customer_satpam acs
    WHERE acs.status<=0 ORDER BY created_at ASC`,

  queryJmlScanPropertyDataPengeluaran: `SELECT '' AS jenis_kain,'' AS warna,dp.no_order,dp.no_packing AS notransaksi,SUM(dpc.berat) AS berat,COUNT(dp.no_packing) AS jml_potong,'PACKING' AS sts,
    IF(tp.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan, IFNULL(ls.no_lokasi,'-') AS lokasi
    FROM data_packingkain dp JOIN detail_packingkain dpc ON dpc.no_packing=dp.no_packing LEFT JOIN detail_ngebal dg     
    ON dg.no_packing_roll=dp.no_packing LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing  
    LEFT JOIN lokasi_selesai ls ON ls.no_transaksi = dp.no_packing 
    WHERE dg.no_packing_roll IS NULL  AND dp.no_order=?        
    GROUP BY dp.no_packing                                                                                                            
    UNION                                                                                                                            
    SELECT '' AS jenis_kain,'' AS warna,dp.no_order,dp.no_ngebal AS notransaksi,SUM(dpc.berat) AS berat,SUM(dpc.jml_potong) AS jml_potong,'BAL' AS sts,                     
    IF(tp.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan,IFNULL(ls.no_lokasi,'-') AS lokasi
    FROM data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal 
    LEFT JOIN lokasi_selesai ls ON ls.no_transaksi = dp.no_ngebal
    WHERE dp.no_order=?                                                      
    GROUP BY dp.no_ngebal                                                                                                           
    UNION                                                                                                                           
    SELECT dr.jenis_kain,dr.warna,op.no_order,po.no_roll AS notransaksi,po.berat,1 AS jml_potong,'ROLLAN' AS sts,                                               
    IF(tp.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan,IFNULL(pp.no_lokasi,'-') AS lokasi
    FROM perincian_order po JOIN detail_order dr USING(no_Detail) JOIN order_pembelian op USING(no_order)
    LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=no_roll
    LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll
    LEFT JOIN perincian_penerimaanstok pp ON pp.no_roll = po.no_roll
    WHERE op.no_order=? AND jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL`,

  queryGetPropertyKatalog: `SELECT dp.no_penjualan AS no_order,dp.id_balpenjualan AS notransaksi,
    SUM(sdp.status) AS jml_potong,(
    SELECT SUM(berat * qty) FROM s_tabel_katalog 
    JOIN s_detail_penjualankatalog USING(id_katalog) WHERE no_penjualan=dp.no_penjualan) AS berat,'DIBAL' AS sts, 
    IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, '-' AS lokasi
    FROM a_master_packingkatalog dp     
    JOIN s_detail_penjualankatalog sdp USING(no_penjualan)               
    JOIN a_packing_katalog dpc ON dpc.no_packing=dp.id_balpenjualan                                                                                                                                                    
    LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan                                                                                                                                               
    WHERE dp.no_penjualan=?`,
};

export default queryStorage;
