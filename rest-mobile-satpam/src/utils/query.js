module.exports = {

    transaksi_muat0: `SELECT tm.no,op.no_order,nama,no_mobil,(IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0)) AS a,
        IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0) AS b,
        CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0)),' of ',
        (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,
        IFNULL(FORMAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0))/
        (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))*100,0),0) AS persen,
        op.exspedisi,nkd.kode AS kode_customer
        FROM order_pembelian op JOIN customer c USING(id_customer)
        JOIN n_kodeunik_6digit nkd USING(id_customer) JOIN temp_muat tm ON tm.no_order=op.no_order
        LEFT JOIN 
        (SELECT dp.no_order,COUNT(dp.no_packing) AS jml FROM data_packingkain dp 
        LEFT JOIN detail_ngebal dg ON dg.no_packing_roll=dp.no_packing  WHERE dg.no_packing_roll IS NULL 
        GROUP BY dp.no_order) AS pck ON pck.no_order=op.no_order
        LEFT JOIN
        (SELECT dp.no_order,COUNT(dp.no_packing) AS jml FROM data_packingkain dp 
        LEFT JOIN detail_ngebal dg ON dg.no_packing_roll=dp.no_packing
        JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing  WHERE dg.no_packing_roll IS NULL 
        GROUP BY dp.no_order) AS pckscan ON pckscan.no_order=op.no_order
        LEFT JOIN
        (SELECT dp.no_order,COUNT(dp.no_ngebal) AS jmlbal
        FROM data_ngebal dp WHERE no_ngebal IN(SELECT no_ngebal FROM detail_ngebal) GROUP BY dp.no_order) AS tngebal ON tngebal.no_order=op.no_order 
        LEFT JOIN
        (SELECT dp.no_order,COUNT(dp.no_ngebal) AS jmlbal
        FROM data_ngebal dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal GROUP BY dp.no_order) AS ngebalscan ON ngebalscan.no_order=op.no_order 
        LEFT JOIN 
        (SELECT dr.no_order,COUNT(no_roll) AS jml_potong                                              
        FROM perincian_order po JOIN detail_order dr USING(no_Detail) 
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll WHERE dn.no_packing_roll IS NULL AND jenis_quantity='ROLLAN' GROUP BY no_order)
        AS rollall ON rollall.no_order=op.no_order
        LEFT JOIN 
        (SELECT dr.no_order,COUNT(no_roll) AS jml_potong FROM perincian_order po JOIN detail_order dr USING(no_Detail) 
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll  JOIN  temp_pengeluaran tp ON tp.no_transaksi=po.no_roll
        WHERE dn.no_packing_roll IS NULL AND jenis_quantity='ROLLAN' GROUP BY no_order) AS  rollscan ON rollscan.no_order=op.no_order
        GROUP BY no_order
        UNION
        SELECT tm.no,op.no_penjualan,nama,no_mobil,(IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)) AS a,
        IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0) AS b,
        CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)),' of ',
        (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,
        IFNULL(FORMAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0))/
        (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))*100,0),0) AS persen,
        op.ekspedisi AS exspedisi,nkd.kode AS kode_customer
        FROM s_penjualan_katalog op JOIN customer c USING(id_customer)
        JOIN n_kodeunik_6digit nkd USING(id_customer) JOIN temp_muat tm ON tm.no_order=op.no_penjualan
        LEFT JOIN 
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp 
        LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan  WHERE dg.no_packing IS NULL 
        GROUP BY dp.no_penjualan) AS pck ON pck.no_penjualan=op.no_penjualan
        LEFT JOIN 
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp 
        LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan
        JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan  WHERE dg.no_packing IS NULL 
        GROUP BY dp.no_penjualan) AS pckscan ON pckscan.no_penjualan=op.no_penjualan
        LEFT JOIN
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal
        FROM a_master_packingkatalog dp WHERE id_balpenjualan IN(SELECT no_packing FROM a_packing_katalog) GROUP BY dp.no_penjualan) AS tngebal ON tngebal.no_penjualan=op.no_penjualan 
        LEFT JOIN
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal
        FROM a_master_packingkatalog dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan GROUP BY dp.no_penjualan) AS ngebalscan ON ngebalscan.no_penjualan=op.no_penjualan 
        LEFT JOIN 
        (SELECT dr.no_penjualan,COUNT(qty) AS jml_potong                                              
        FROM s_detail_penjualankatalog dr
        LEFT JOIN a_packing_katalog dn ON dn.no_detailpenjualan=dr.no_detail WHERE dn.no_packing IS NULL GROUP BY no_penjualan)
        AS rollall ON rollall.no_penjualan=op.no_penjualan
        GROUP BY no_penjualan
        ORDER BY NO ASC`,

    //=====================================================================================================
    // transaksi_muatCheckTemp1: `SELECT * FROM (
    //     SELECT '' AS kode_customer,tm.no, op.jenis_packing, op.alamat_kirim, op.no_order,nama,
    //     (IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0)) AS a,
    //     IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0) AS b,
    //     CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0)),' of ',  
    //     (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,op.exspedisi         
    //     FROM order_pembelian op JOIN customer c USING(id_customer) JOIN temp_muat tm ON tm.no_order=op.no_order 
    //     LEFT JOIN                                                                                                
    //     (SELECT dp.no_order,COUNT(dp.no_packing) AS jml FROM data_packingkain dp                               
    //     LEFT JOIN detail_ngebal dg ON dg.no_packing_roll=dp.no_packing  WHERE dg.no_packing_roll IS NULL        
    //     GROUP BY dp.no_order) AS pck ON pck.no_order=op.no_order                                              
    //     LEFT JOIN                                                                                              
    //     (SELECT dp.no_order,COUNT(dp.no_packing) AS jml FROM data_packingkain dp                               
    //     LEFT JOIN detail_ngebal dg ON dg.no_packing_roll=dp.no_packing                                         
    //     JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing  WHERE dg.no_packing_roll IS NULL            
    //     GROUP BY dp.no_order) AS pckscan ON pckscan.no_order=op.no_order                                     
    //     LEFT JOIN                                                                                             
    //     (SELECT dp.no_order,COUNT(dp.no_ngebal) AS jmlbal                                                     
    //     FROM data_ngebal dp WHERE dp.no_ngebal IN (SELECT no_ngebal FROM detail_ngebal ) GROUP BY dp.no_order) AS tngebal ON tngebal.no_order=op.no_order                
    //     LEFT JOIN                                                                                            
    //     (SELECT dp.no_order,COUNT(dp.no_ngebal) AS jmlbal                                                    
    //     FROM data_ngebal dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal GROUP BY dp.no_order) AS ngebalscan ON ngebalscan.no_order=op.no_order   
    //     LEFT JOIN                                                                                              
    //     (SELECT dr.no_order,COUNT(no_roll) AS jml_potong                                                      
    //     FROM perincian_order po JOIN detail_order dr USING(no_Detail)                                         
    //     LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll WHERE jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL GROUP BY no_order)  
    //     AS rollall ON rollall.no_order=op.no_order                                                                      
    //     LEFT JOIN                                                                                                        
    //     (SELECT dr.no_order,COUNT(no_roll) AS jml_potong FROM perincian_order po JOIN detail_order dr USING(no_Detail)   
    //     LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll  JOIN  temp_pengeluaran tp ON tp.no_transaksi=po.no_roll     
    //     WHERE jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL GROUP BY no_order) AS  rollscan ON rollscan.no_order=op.no_order 
    //     WHERE no_mobil=? GROUP BY no_order 
    //     UNION 
    //     SELECT '' AS kode_customer,tm.no, op.jenis_packing, op.alamat_kirim, op.no_penjualan,nama,  
    //     (IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)) AS a,
    //     IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0) AS b,                                     
    //     CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)),' of ',                                                   
    //     (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,op.ekspedisi AS exspedisi                                                                                            
    //     FROM s_penjualan_katalog op JOIN customer c USING(id_customer) JOIN temp_muat tm ON tm.no_order=op.no_penjualan      
    //     LEFT JOIN                                                                                                            
    //     (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp                             
    //     LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan  WHERE dg.no_packing IS NULL                      
    //     GROUP BY dp.no_penjualan) AS pck ON pck.no_penjualan=op.no_penjualan                                                 
    //     LEFT JOIN                                                                                                            
    //     (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp                             
    //     LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan                                                   
    //     JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan  WHERE dg.no_packing IS NULL                          
    //     GROUP BY dp.no_penjualan) AS pckscan ON pckscan.no_penjualan=op.no_penjualan                                         
    //     LEFT JOIN                                                                                                            
    //     (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal                                                          
    //     FROM a_master_packingkatalog dp WHERE id_balpenjualan IN(SELECT no_packing FROM a_packing_katalog) GROUP BY dp.no_penjualan) AS tngebal ON tngebal.no_penjualan=op.no_penjualan    
    //     LEFT JOIN                                                                                                                                                                          
    //     (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal                                                                                                                        
    //     FROM a_master_packingkatalog dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan GROUP BY dp.no_penjualan) AS ngebalscan ON ngebalscan.no_penjualan=op.no_penjualan  
    //     LEFT JOIN                                                                                                                                                                          
    //     (SELECT dr.no_penjualan,COUNT(qty) AS jml_potong                                                                                                                                   
    //     FROM s_detail_penjualankatalog dr                                                                                                                                                  
    //     LEFT JOIN a_packing_katalog dn ON dn.no_detailpenjualan=dr.no_detail WHERE dn.no_packing IS NULL GROUP BY no_penjualan)                                                            
    //     AS rollall ON rollall.no_penjualan=op.no_penjualan                                                                                                                                 
    //     WHERE no_mobil=?
    //     GROUP BY no_penjualan                                                                                                                                                              
    //     ORDER BY NO ASC) AS res
    //     WHERE res.a<>res.b`,
    //=====================================================================================================

    transaksi_muat1: `SELECT '' AS kode_customer,tm.no,op.no_order,nama,no_mobil,  
    (SELECT cek_jmlitemsudahcansatpam(op.no_order )) AS a, 
    (SELECT cek_jmlitemsiapkirim(op.no_order )) AS b, 
    CONCAT((SELECT cek_jmlitemsudahcansatpam(op.no_order )),' of ',  
    (SELECT cek_jmlitemsiapkirim(op.no_order ))) AS progres,               
    IFNULL(FORMAT((SELECT cek_jmlitemsudahcansatpam(op.no_order ))/      
    (SELECT cek_jmlitemsiapkirim(op.no_order ))*100,0),0) AS persen,op.exspedisi          
    FROM order_pembelian op JOIN customer c USING(id_customer) JOIN temp_muat tm ON tm.no_order=op.no_order 
    WHERE no_mobil=? GROUP BY no_order 
    UNION 
    SELECT '' AS kode_customer,tm.no,op.no_penjualan,nama,no_mobil,(IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)) AS a,               
    IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0) AS b,                                        
    CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)),' of ',                                                 
    (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,                               
    IFNULL(FORMAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0))/                                                   
    (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))*100,0),0) AS persen,                       
    op.ekspedisi AS exspedisi                                                                                            
    FROM s_penjualan_katalog op JOIN customer c USING(id_customer) JOIN temp_muat tm ON tm.no_order=op.no_penjualan      
    LEFT JOIN                                                                                                            
    (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp                             
    LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan  WHERE dg.no_packing IS NULL                      
    GROUP BY dp.no_penjualan) AS pck ON pck.no_penjualan=op.no_penjualan                                                 
    LEFT JOIN                                                                                                            
    (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp                             
    LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan                                                   
    JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan  WHERE dg.no_packing IS NULL                          
    GROUP BY dp.no_penjualan) AS pckscan ON pckscan.no_penjualan=op.no_penjualan                                         
    LEFT JOIN                                                                                                            
    (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal                                                          
    FROM a_master_packingkatalog dp WHERE id_balpenjualan IN(SELECT no_packing FROM a_packing_katalog) GROUP BY dp.no_penjualan) AS tngebal ON tngebal.no_penjualan=op.no_penjualan   
    LEFT JOIN                                                                                                                                                                         
    (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal                                                                                                                       
    FROM a_master_packingkatalog dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan GROUP BY dp.no_penjualan) AS ngebalscan ON ngebalscan.no_penjualan=op.no_penjualan 
    LEFT JOIN                                                                                                                                                                         
    (SELECT dr.no_penjualan,COUNT(qty) AS jml_potong                                                                                                                                  
    FROM s_detail_penjualankatalog dr                                                                                                                                                 
    LEFT JOIN a_packing_katalog dn ON dn.no_detailpenjualan=dr.no_detail WHERE dn.no_packing IS NULL GROUP BY no_penjualan)                                                           
    AS rollall ON rollall.no_penjualan=op.no_penjualan                                                                                                                                
    WHERE no_mobil=?
    GROUP BY no_penjualan                                                                                                                                                             
    ORDER BY NO ASC`,

    //=====================================================================================================
    // transaksi_muatCheckTemp2: `SELECT * FROM (
    //     SELECT '' AS kode_customer, op.jenis_packing,op.no_order, op.alamat_kirim, nama, 
    //     (IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0)) AS a,
    //     (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0)) AS b,
    //     CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0)),' of ',  
    //     (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,op.exspedisi         
    //     FROM order_pembelian op JOIN customer c USING(id_customer) JOIN detail_muat dtm ON dtm.no_pengeluaran=op.no_order JOIN muat_orderan tm ON tm.no_muat=dtm.no_muat LEFT JOIN a_nourut_muat an ON tm.no_muat=an.no_muat 
    //     LEFT JOIN  
    //     (SELECT no_muat,SUM(ongkir) AS ongkir FROM detail_muat dm  JOIN ongkir ok ON ok.no_transaksi=dm.no_pengeluaran GROUP BY no_muat) AS ghy ON ghy.no_muat=tm.no_muat 
    //     LEFT JOIN                                                                                                
    //     (SELECT dp.no_order,COUNT(dp.no_packing) AS jml FROM data_packingkain dp                               
    //     LEFT JOIN detail_ngebal dg ON dg.no_packing_roll=dp.no_packing  WHERE dg.no_packing_roll IS NULL        
    //     GROUP BY dp.no_order) AS pck ON pck.no_order=op.no_order                                              
    //     LEFT JOIN                                                                                              
    //     (SELECT dp.no_order,COUNT(dp.no_packing) AS jml FROM data_packingkain dp                               
    //     LEFT JOIN detail_ngebal dg ON dg.no_packing_roll=dp.no_packing                                         
    //     JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing  WHERE dg.no_packing_roll IS NULL            
    //     GROUP BY dp.no_order) AS pckscan ON pckscan.no_order=op.no_order                                     
    //     LEFT JOIN                                                                                             
    //     (SELECT dp.no_order,COUNT(dp.no_ngebal) AS jmlbal                                                     
    //     FROM data_ngebal dp WHERE dp.no_ngebal IN (SELECT no_ngebal FROM detail_ngebal ) GROUP BY dp.no_order) AS tngebal ON tngebal.no_order=op.no_order                
    //     LEFT JOIN                                                                                            
    //     (SELECT dp.no_order,COUNT(dp.no_ngebal) AS jmlbal                                                    
    //     FROM data_ngebal dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal GROUP BY dp.no_order) AS ngebalscan ON ngebalscan.no_order=op.no_order   
    //     LEFT JOIN                                                                                              
    //     (SELECT dr.no_order,COUNT(no_roll) AS jml_potong                                                      
    //     FROM perincian_order po JOIN detail_order dr USING(no_Detail)                                         
    //     LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll WHERE jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL GROUP BY no_order)  
    //     AS rollall ON rollall.no_order=op.no_order                                                                      
    //     LEFT JOIN                                                                                                        
    //     (SELECT dr.no_order,COUNT(no_roll) AS jml_potong FROM perincian_order po JOIN detail_order dr USING(no_Detail)   
    //     LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll  JOIN  temp_pengeluaran tp ON tp.no_transaksi=po.no_roll     
    //     WHERE jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL GROUP BY no_order) AS  rollscan ON rollscan.no_order=op.no_order WHERE no_mobil=? AND tm.status=0  AND IFNULL(ghy.ongkir,0)>0 GROUP BY no_order 
    //     UNION 
    //     SELECT '' AS kode_customer,op.jenis_packing,op.no_penjualan, op.alamat_kirim, nama,     
    //     (IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)) AS a,
    //     (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0)) AS b ,                              
    //     CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)),' of ',                                                   
    //     (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,op.ekspedisi AS exspedisi                                                                                            
    //     FROM s_penjualan_katalog op JOIN customer c USING(id_customer) JOIN detail_muat dtm ON dtm.no_pengeluaran=op.no_penjualan JOIN muat_orderan tm ON tm.no_muat=dtm.no_muat      
    //     LEFT JOIN                                                                                                            
    //     (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp                             
    //     LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan  WHERE dg.no_packing IS NULL                      
    //     GROUP BY dp.no_penjualan) AS pck ON pck.no_penjualan=op.no_penjualan                                                 
    //     LEFT JOIN                                                                                                            
    //     (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp                             
    //     LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan                                                   
    //     JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan  WHERE dg.no_packing IS NULL                          
    //     GROUP BY dp.no_penjualan) AS pckscan ON pckscan.no_penjualan=op.no_penjualan                                         
    //     LEFT JOIN                                                                                                            
    //     (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal                                                          
    //     FROM a_master_packingkatalog dp WHERE id_balpenjualan IN(SELECT no_packing FROM a_packing_katalog) GROUP BY dp.no_penjualan) AS tngebal ON tngebal.no_penjualan=op.no_penjualan    
    //     LEFT JOIN                                                                                                                                                                          
    //     (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal                                                                                                                        
    //     FROM a_master_packingkatalog dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan GROUP BY dp.no_penjualan) AS ngebalscan ON ngebalscan.no_penjualan=op.no_penjualan  
    //     LEFT JOIN                                                                                                                                                                          
    //     (SELECT dr.no_penjualan,COUNT(qty) AS jml_potong                                                                                                                                   
    //     FROM s_detail_penjualankatalog dr                                                                                                                                                  
    //     LEFT JOIN a_packing_katalog dn ON dn.no_detailpenjualan=dr.no_detail WHERE dn.no_packing IS NULL GROUP BY no_penjualan)                                                            
    //     AS rollall ON rollall.no_penjualan=op.no_penjualan                                                                                                                                 
    //     WHERE no_mobil=? AND tm.status=0 
    //     GROUP BY no_penjualan) AS res
    //     WHERE res.a<>res.b`,
    //=====================================================================================================
    transaksi_muat2: `SELECT '' AS kode_customer,op.no_order,nama,no_mobil,  
    (SELECT cek_jmlitemsudahcansatpam(op.no_order )) AS a,  
    (SELECT cek_jmlitemsiapkirim(op.no_order )) AS b, 
    CONCAT((SELECT cek_jmlitemsudahcansatpam(op.no_order )),' of ',  
    (SELECT cek_jmlitemsiapkirim(op.no_order ))) AS progres,                 
    IFNULL(FORMAT((SELECT cek_jmlitemsudahcansatpam(op.no_order ))/      
    (SELECT cek_jmlitemsiapkirim(op.no_order ))*100,0),0) AS persen,op.exspedisi             
     FROM order_pembelian op JOIN customer c USING(id_customer) JOIN detail_muat dtm ON dtm.no_pengeluaran=op.no_order JOIN muat_orderan tm ON tm.no_muat=dtm.no_muat 
     JOIN ongkir o ON o.no_transaksi=dtm.no_pengeluaran left join a_nourut_muat an on tm.no_muat=an.no_muat 
      where no_mobil=? and tm.status=0  AND IFNULL(o.ongkir,0)>0 GROUP BY no_order 
      UNION 
      SELECT '' AS kode_customer,op.no_penjualan,nama,no_mobil,(IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)) AS a,                 
      IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0) AS b,                                        
      CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)),' of ',                                                   
      (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,                               
      IFNULL(FORMAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0))/                                                   
      (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))*100,0),0) AS persen,                       
      op.ekspedisi as exspedisi                                                                                            
      FROM s_penjualan_katalog op JOIN customer c USING(id_customer) JOIN detail_muat dtm ON dtm.no_pengeluaran=op.no_penjualan JOIN muat_orderan tm ON tm.no_muat=dtm.no_muat      
      LEFT JOIN                                                                                                            
      (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp                             
      LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan  WHERE dg.no_packing IS NULL                      
      GROUP BY dp.no_penjualan) AS pck ON pck.no_penjualan=op.no_penjualan                                                 
      LEFT JOIN                                                                                                            
      (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp                             
      LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan                                                   
      JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan  WHERE dg.no_packing IS NULL                          
      GROUP BY dp.no_penjualan) AS pckscan ON pckscan.no_penjualan=op.no_penjualan                                         
      LEFT JOIN                                                                                                            
      (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal                                                          
      FROM a_master_packingkatalog dp WHERE id_balpenjualan IN(SELECT no_packing FROM a_packing_katalog) GROUP BY dp.no_penjualan) AS tngebal ON tngebal.no_penjualan=op.no_penjualan    
      LEFT JOIN                                                                                                                                                                          
      (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal                                                                                                                        
      FROM a_master_packingkatalog dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan GROUP BY dp.no_penjualan) AS ngebalscan ON ngebalscan.no_penjualan=op.no_penjualan  
      LEFT JOIN                                                                                                                                                                          
      (SELECT dr.no_penjualan,COUNT(qty) AS jml_potong                                                                                                                                   
      FROM s_detail_penjualankatalog dr                                                                                                                                                  
      LEFT JOIN a_packing_katalog dn ON dn.no_detailpenjualan=dr.no_detail WHERE dn.no_packing IS NULL GROUP BY no_penjualan)                                                            
      AS rollall ON rollall.no_penjualan=op.no_penjualan                                                                                                                                 
      where no_mobil=? and tm.status=0 
      GROUP BY no_penjualan`,

    transaksi_muat3: `SELECT '' AS kode_customer,tm.no, op.jenis_packing, op.alamat_kirim, op.no_order,nama,  
        CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0)),' of ',  
        (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,op.exspedisi         
        FROM order_pembelian op JOIN customer c USING(id_customer) JOIN temp_muat tm ON tm.no_order=op.no_order 
        LEFT JOIN                                                                                                
        (SELECT dp.no_order,COUNT(dp.no_packing) AS jml FROM data_packingkain dp                               
        LEFT JOIN detail_ngebal dg ON dg.no_packing_roll=dp.no_packing  WHERE dg.no_packing_roll IS NULL        
        GROUP BY dp.no_order) AS pck ON pck.no_order=op.no_order                                              
        LEFT JOIN                                                                                              
        (SELECT dp.no_order,COUNT(dp.no_packing) AS jml FROM data_packingkain dp                               
        LEFT JOIN detail_ngebal dg ON dg.no_packing_roll=dp.no_packing                                         
        JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing  WHERE dg.no_packing_roll IS NULL            
        GROUP BY dp.no_order) AS pckscan ON pckscan.no_order=op.no_order                                     
        LEFT JOIN                                                                                             
        (SELECT dp.no_order,COUNT(dp.no_ngebal) AS jmlbal                                                     
        FROM data_ngebal dp WHERE dp.no_ngebal IN (SELECT no_ngebal FROM detail_ngebal ) GROUP BY dp.no_order) AS tngebal ON tngebal.no_order=op.no_order                
        LEFT JOIN                                                                                            
        (SELECT dp.no_order,COUNT(dp.no_ngebal) AS jmlbal                                                    
        FROM data_ngebal dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal GROUP BY dp.no_order) AS ngebalscan ON ngebalscan.no_order=op.no_order   
        LEFT JOIN                                                                                              
        (SELECT dr.no_order,COUNT(no_roll) AS jml_potong                                                      
        FROM perincian_order po JOIN detail_order dr USING(no_Detail)                                         
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll WHERE jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL GROUP BY no_order)  
        AS rollall ON rollall.no_order=op.no_order                                                                      
        LEFT JOIN                                                                                                        
        (SELECT dr.no_order,COUNT(no_roll) AS jml_potong FROM perincian_order po JOIN detail_order dr USING(no_Detail)   
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll  JOIN  temp_pengeluaran tp ON tp.no_transaksi=po.no_roll     
        WHERE jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL GROUP BY no_order) AS  rollscan ON rollscan.no_order=op.no_order 
        WHERE no_mobil=? and op.no_order=? GROUP BY no_order 
        UNION 
        SELECT '' AS kode_customer,tm.no,op.jenis_packing, op.alamat_kirim, op.no_penjualan,nama,                                       
        CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)),' of ',                                                   
        (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,op.ekspedisi AS exspedisi                                                                                            
        FROM s_penjualan_katalog op JOIN customer c USING(id_customer) JOIN temp_muat tm ON tm.no_order=op.no_penjualan      
        LEFT JOIN                                                                                                            
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp                             
        LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan  WHERE dg.no_packing IS NULL                      
        GROUP BY dp.no_penjualan) AS pck ON pck.no_penjualan=op.no_penjualan                                                 
        LEFT JOIN                                                                                                            
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp                             
        LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan                                                   
        JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan  WHERE dg.no_packing IS NULL                          
        GROUP BY dp.no_penjualan) AS pckscan ON pckscan.no_penjualan=op.no_penjualan                                         
        LEFT JOIN                                                                                                            
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal                                                          
        FROM a_master_packingkatalog dp WHERE id_balpenjualan IN(SELECT no_packing FROM a_packing_katalog) GROUP BY dp.no_penjualan) AS tngebal ON tngebal.no_penjualan=op.no_penjualan    
        LEFT JOIN                                                                                                                                                                          
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal                                                                                                                        
        FROM a_master_packingkatalog dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan GROUP BY dp.no_penjualan) AS ngebalscan ON ngebalscan.no_penjualan=op.no_penjualan  
        LEFT JOIN                                                                                                                                                                          
        (SELECT dr.no_penjualan,COUNT(qty) AS jml_potong                                                                                                                                   
        FROM s_detail_penjualankatalog dr                                                                                                                                                  
        LEFT JOIN a_packing_katalog dn ON dn.no_detailpenjualan=dr.no_detail WHERE dn.no_packing IS NULL GROUP BY no_penjualan)                                                            
        AS rollall ON rollall.no_penjualan=op.no_penjualan                                                                                                                                 
        WHERE no_mobil=? and op.no_penjualan=?
        GROUP BY no_penjualan                                                                                                                                                              
        ORDER BY NO ASC`,

    //=====================================================================================================
    transaksi_muat4: `SELECT '' AS kode_customer,op.no_order,op.jenis_packing, op.alamat_kirim, nama,  
        CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0)),' of ',  
        (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,op.exspedisi         
        FROM order_pembelian op JOIN customer c USING(id_customer) JOIN detail_muat dtm ON dtm.no_pengeluaran=op.no_order JOIN muat_orderan tm ON tm.no_muat=dtm.no_muat LEFT JOIN a_nourut_muat an ON tm.no_muat=an.no_muat 
        LEFT JOIN  
        (SELECT no_muat,SUM(ongkir) AS ongkir FROM detail_muat dm  JOIN ongkir ok ON ok.no_transaksi=dm.no_pengeluaran GROUP BY no_muat) AS ghy ON ghy.no_muat=tm.no_muat 
        LEFT JOIN                                                                                                
        (SELECT dp.no_order,COUNT(dp.no_packing) AS jml FROM data_packingkain dp                               
        LEFT JOIN detail_ngebal dg ON dg.no_packing_roll=dp.no_packing  WHERE dg.no_packing_roll IS NULL        
        GROUP BY dp.no_order) AS pck ON pck.no_order=op.no_order                                              
        LEFT JOIN                                                                                              
        (SELECT dp.no_order,COUNT(dp.no_packing) AS jml FROM data_packingkain dp                               
        LEFT JOIN detail_ngebal dg ON dg.no_packing_roll=dp.no_packing                                         
        JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing  WHERE dg.no_packing_roll IS NULL            
        GROUP BY dp.no_order) AS pckscan ON pckscan.no_order=op.no_order                                     
        LEFT JOIN                                                                                             
        (SELECT dp.no_order,COUNT(dp.no_ngebal) AS jmlbal                                                     
        FROM data_ngebal dp WHERE dp.no_ngebal IN (SELECT no_ngebal FROM detail_ngebal ) GROUP BY dp.no_order) AS tngebal ON tngebal.no_order=op.no_order                
        LEFT JOIN                                                                                            
        (SELECT dp.no_order,COUNT(dp.no_ngebal) AS jmlbal                                                    
        FROM data_ngebal dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal GROUP BY dp.no_order) AS ngebalscan ON ngebalscan.no_order=op.no_order   
        LEFT JOIN                                                                                              
        (SELECT dr.no_order,COUNT(no_roll) AS jml_potong                                                      
        FROM perincian_order po JOIN detail_order dr USING(no_Detail)                                         
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll WHERE jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL GROUP BY no_order)  
        AS rollall ON rollall.no_order=op.no_order                                                                      
        LEFT JOIN                                                                                                        
        (SELECT dr.no_order,COUNT(no_roll) AS jml_potong FROM perincian_order po JOIN detail_order dr USING(no_Detail)   
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll  JOIN  temp_pengeluaran tp ON tp.no_transaksi=po.no_roll     
        WHERE jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL GROUP BY no_order) AS  rollscan ON rollscan.no_order=op.no_order 
        WHERE no_mobil=? and op.no_order=? AND tm.status=0  AND IFNULL(ghy.ongkir,0)>0 GROUP BY no_order 
        UNION 
        SELECT '' AS kode_customer,op.no_penjualan, op.jenis_packing, op.alamat_kirim, nama,                                     
        CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)),' of ',                                                   
        (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,op.ekspedisi AS exspedisi                                                                                            
        FROM s_penjualan_katalog op JOIN customer c USING(id_customer) JOIN detail_muat dtm ON dtm.no_pengeluaran=op.no_penjualan JOIN muat_orderan tm ON tm.no_muat=dtm.no_muat      
        LEFT JOIN                                                                                                            
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp                             
        LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan  WHERE dg.no_packing IS NULL                      
        GROUP BY dp.no_penjualan) AS pck ON pck.no_penjualan=op.no_penjualan                                                 
        LEFT JOIN                                                                                                            
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp                             
        LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan                                                   
        JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan  WHERE dg.no_packing IS NULL                          
        GROUP BY dp.no_penjualan) AS pckscan ON pckscan.no_penjualan=op.no_penjualan                                         
        LEFT JOIN                                                                                                            
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal                                                          
        FROM a_master_packingkatalog dp WHERE id_balpenjualan IN(SELECT no_packing FROM a_packing_katalog) GROUP BY dp.no_penjualan) AS tngebal ON tngebal.no_penjualan=op.no_penjualan    
        LEFT JOIN                                                                                                                                                                          
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal                                                                                                                        
        FROM a_master_packingkatalog dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan GROUP BY dp.no_penjualan) AS ngebalscan ON ngebalscan.no_penjualan=op.no_penjualan  
        LEFT JOIN                                                                                                                                                                          
        (SELECT dr.no_penjualan,COUNT(qty) AS jml_potong                                                                                                                                   
        FROM s_detail_penjualankatalog dr                                                                                                                                                  
        LEFT JOIN a_packing_katalog dn ON dn.no_detailpenjualan=dr.no_detail WHERE dn.no_packing IS NULL GROUP BY no_penjualan)                                                            
        AS rollall ON rollall.no_penjualan=op.no_penjualan                                                                                                                                 
        WHERE no_mobil=? and op.no_order=? AND tm.status=0 
        GROUP BY no_penjualan`,

    //=====================================================================================================
    dataPartial: `SELECT dump.no_order,nama,COUNT(*) total,SUM(CASE WHEN stsscan='Belum di Scan' THEN 1 ELSE 0 END) belum,
        SUM(CASE WHEN stsscan='Sudah di Scan' THEN 1 ELSE 0 END) sudah,
        CONCAT('Total : ',COUNT(*),' ; Belum scan : ',SUM(CASE WHEN stsscan='Belum di Scan' THEN 1 ELSE 0 END)) AS tes,
        dump.jenis_packing, dump.exspedisi
        FROM (
        SELECT dp.no_order,dp.no_packing AS notransaksi,SUM(dpc.berat) AS berat,COUNT(dp.no_packing) AS jml_potong,'PACKING' AS sts, op.jenis_packing ,
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, op.exspedisi
        FROM data_packingkain dp JOIN detail_packingkain dpc ON dpc.no_packing=dp.no_packing LEFT JOIN detail_ngebal dg   
        ON dg.no_packing_roll=dp.no_packing LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing 
        JOIN order_pembelian op ON dp.no_order=op.no_order     
        WHERE dg.no_packing_roll IS NULL  
        GROUP BY dp.no_packing                                                                                                             
        UNION                                                                                                                             
        SELECT dp.no_order,dp.no_ngebal AS notransaksi,SUM(dpc.berat) AS berat,SUM(dpc.jml_potong) AS jml_potong,'BAL' AS sts, op.jenis_packing,                 
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, op.exspedisi
        FROM data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal
        JOIN order_pembelian op ON(dp.no_order=op.no_order) 
        GROUP BY dp.no_ngebal                                                                                                            
        UNION                                                                                                                            
        SELECT op.no_order,no_roll AS notransaksi,po.berat,1 AS jml_potong,'ROLLAN' AS sts, op.jenis_packing,                                         
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, op.exspedisi
        FROM perincian_order po JOIN detail_order dr USING(no_Detail) JOIN order_pembelian op USING(no_order) 
        LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=no_roll 
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll 
        WHERE  jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL ) AS dump
        JOIN order_pembelian op ON dump.no_order=op.no_order JOIN customer USING(id_customer)
        LEFT JOIN order_sudahdikirim os ON dump.no_order=os.no_order
        WHERE  os.no_order IS NULL
        GROUP BY dump.no_order
        HAVING total > belum AND belum >0`,

    //=====================================================================================================

    detailPembatalanMuatOrder: `SELECT * FROM (SELECT dp.no_order,dp.no_packing AS notransaksi,SUM(dpc.berat) AS berat,COUNT(dp.no_packing) AS jml_potong,'PACKING' AS sts,
        IF(IFNULL(tp.no_transaksi,0)=0,'Belum di Scan','Sudah di scan') AS stsscan, dp.kode_verifikasi
        FROM data_packingkain dp JOIN detail_packingkain dpc ON dpc.no_packing=dp.no_packing
        LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing
        GROUP BY dp.no_packing
        UNION
        SELECT dp.no_order,dp.no_ngebal AS notransaksi,SUM(dpc.berat) AS berat,SUM(dpc.jml_potong) AS jml_potong,'Bal' AS sts,
        IF(IFNULL(tp.no_transaksi,0)=0,'Belum di Scan','Sudah di scan') AS stsscan, dp.kode_verifikasi
        FROM data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal
        LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal
        GROUP BY dp.no_ngebal
        UNION
        SELECT op.no_order,no_roll AS notransaksi,po.berat,1 AS jml_potong,'ROLLAN' AS sts,
        IF(IFNULL(tp.no_transaksi,0)=0,'Belum di Scan','Sudah di scan') AS stsscan, op.kode_verifikasi
        FROM perincian_order po JOIN detail_order dr USING(no_Detail) JOIN order_pembelian op USING(no_order)
        LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=no_roll
        WHERE jenis_quantity='ROLLAN' AND jenis_pengiriman='DIAMBIL') AS data_scan WHERE no_order=? and notransaksi=?`,

    //=====================================================================================================
    detailPembatalanMuat: `SELECT no_detail,dm.no_muat,op.no_order,c.nama,
        (SELECT SUM(berat) FROM perincian_order po JOIN detail_order dr USING(no_Detail) WHERE no_order=op.no_order GROUP BY no_order) AS berat,
        exspedisi,penanggung,IF(ek.tipe_pembayaran='KONTRA BON',0,ntk.ongkir) AS ongkir,
        (SELECT COUNT(no_ngebal) FROM data_ngebal WHERE no_order=op.no_order GROUP BY no_order) AS jmlbal,ek.tipe_pembayaran,
        IFNULL((SELECT no_urut FROM a_nourut_muat WHERE no_order=op.no_order LIMIT 1),0) AS no_urut, ntk.asuransi AS jumlah_asuransi
        FROM detail_muat dm
        JOIN order_pembelian op ON op.no_order=dm.no_pengeluaran
        JOIN n_temp_kasir ntk ON op.no_order=ntk.no_order
        JOIN customer c ON c.id_customer = ntk.id_customer
        LEFT JOIN ekspedisi ek ON ek.nama=op.exspedisi
        WHERE no_muat=? 
        UNION
        SELECT no_detail,dm.no_muat,spk.no_penjualan,c.nama,
        (SELECT SUM(stk.berat) FROM s_detail_penjualankatalog po JOIN s_tabel_katalog stk ON po.id_katalog=stk.id_katalog
        WHERE no_penjualan=spk.no_penjualan GROUP BY no_penjualan) AS berat,ekspedisi AS exspedisi,
        penanggung_ongkir AS penanggung,IF(ek.tipe_pembayaran='KONTRA BON',0,ntk.ongkir) AS ongkir,1 jmlbal,ek.tipe_pembayaran,
        IFNULL((SELECT no_urut FROM a_nourut_muat WHERE no_order=spk.no_penjualan LIMIT 1),0) AS no_urut, ntk.asuransi AS jumlah_asuransi 
        FROM detail_muat dm 
        JOIN s_penjualan_katalog spk ON spk.no_penjualan=dm.no_pengeluaran 
        JOIN n_temp_kasir ntk ON spk.no_penjualan=ntk.no_order
        JOIN customer c ON c.id_customer = ntk.id_customer
        LEFT JOIN ekspedisi ek ON ek.nama=spk.ekspedisi 
        WHERE no_muat=?
        ORDER BY no_urut,tipe_pembayaran,nama ASC`,

    //=====================================================================================================
    tampilkanSemuaListBarang: `SELECT '' AS jenis_kain,'' AS warna,dp.no_order,dp.no_packing AS notransaksi,SUM(dpc.berat) AS berat,COUNT(dp.no_packing) AS jml_potong,'PACKING' AS sts,
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
    WHERE op.no_order=? AND jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL `,

    //=====================================================================================================
    tampilkanSemuaListBarangBatalKirim: `SELECT dp.no_order,dp.no_packing AS notransaksi,SUM(dpc.berat) AS berat,COUNT(dp.no_packing) AS jml_potong,'PACKING' AS sts,
    IF(tp.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan
    FROM data_packingkain dp JOIN detail_packingkain dpc ON dpc.no_packing=dp.no_packing LEFT JOIN detail_ngebal dg     
    ON dg.no_packing_roll=dp.no_packing LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing  
    WHERE dg.no_packing_roll IS NULL  AND dp.no_order=?        
    GROUP BY dp.no_packing                                                                                                            
    UNION                                                                                                                            
    SELECT dp.no_order,dp.no_ngebal AS notransaksi,SUM(dpc.berat) AS berat,SUM(dpc.jml_potong) AS jml_potong,'BAL' AS sts,                     
    IF(tp.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan
    FROM data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal 
    WHERE dp.no_order=?                                                      
    GROUP BY dp.no_ngebal                                                                                                           
    UNION                                                                                                                           
    SELECT op.no_order,no_roll AS notransaksi,po.berat,1 AS jml_potong,'ROLLAN' AS sts,                                               
    IF(tp.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan
    FROM perincian_order po JOIN detail_order dr USING(no_Detail) JOIN order_pembelian op USING(no_order)
    LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=no_roll
    LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll
    WHERE op.no_order=?AND jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL `,

    //=====================================================================================================
    tampilkanSemuaListBarangUsingNoRoll: `SELECT dp.no_order,SUM(dpc.berat) AS berat,COUNT(dp.no_packing) AS jml_potong,'PACKING' AS jenis_packing,
    IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(ls.no_lokasi,'-') AS lokasi
    FROM data_packingkain dp JOIN detail_packingkain dpc ON dpc.no_packing=dp.no_packing left join detail_ngebal dg  
    ON dg.no_packing_roll=dp.no_packing LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing  
    LEFT JOIN lokasi_selesai ls ON ls.no_transaksi = dp.no_packing   
    where dg.no_packing_roll is null  and dp.no_packing=?       
    GROUP BY dp.no_packing                                                                                                         
    UNION                                                                                                                         
    SELECT dp.no_order,SUM(dpc.berat) AS berat,SUM(dpc.jml_potong) AS jml_potong,'BAL' AS jenis_packing,                  
    IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(ls.no_lokasi,'-') AS lokasi
    FROM data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal
    LEFT JOIN lokasi_selesai ls ON ls.no_transaksi = dp.no_ngebal
    where dp.no_ngebal=?                                                  
    GROUP BY dp.no_ngebal                                                                                                        
    UNION                                                                                                                        
    SELECT op.no_order,po.berat,1 AS jml_potong,'ROLLAN' AS jenis_packing,                                            
    IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(pp.no_lokasi,'-') AS lokasi
    FROM perincian_order po JOIN detail_order dr USING(no_Detail) JOIN order_pembelian op USING(no_order)
    LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=no_roll
    LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll
    LEFT JOIN perincian_penerimaanstok pp ON pp.no_roll = po.no_roll
    WHERE po.no_roll=? and jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL`,
    //=====================================================================================================
    compareNoOrder: `
        SELECT dp.no_order as no_order,SUM(dpc.berat) AS berat,COUNT(dp.no_packing) AS jml_potong,'PACKING' AS jenis_packing,
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(ls.no_lokasi,'-') AS lokasi
        FROM data_packingkain dp JOIN detail_packingkain dpc ON dpc.no_packing=dp.no_packing left join detail_ngebal dg  
        ON dg.no_packing_roll=dp.no_packing LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing  
        LEFT JOIN lokasi_selesai ls ON ls.no_transaksi = dp.no_packing   
        where dg.no_packing_roll is null  and dp.no_packing=?      
        GROUP BY dp.no_packing                                                                                                         
        UNION                                                                                                                         
        SELECT dp.no_order as no_order,SUM(dpc.berat) AS berat,SUM(dpc.jml_potong) AS jml_potong,'BAL' AS jenis_packing,                  
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(ls.no_lokasi,'-') AS lokasi
        FROM data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal
        LEFT JOIN lokasi_selesai ls ON ls.no_transaksi = dp.no_ngebal
        where dp.no_ngebal=?                                             
        GROUP BY dp.no_ngebal                                                                                                        
        UNION                                                                                                                        
        SELECT op.no_order as no_order,po.berat,1 AS jml_potong,'ROLLAN' AS jenis_packing,                                            
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(pp.no_lokasi,'-') AS lokasi
        FROM perincian_order po JOIN detail_order dr USING(no_Detail) JOIN order_pembelian op USING(no_order)
        LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=no_roll
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll
        LEFT JOIN perincian_penerimaanstok pp ON pp.no_roll = po.no_roll
        WHERE po.no_roll=? and jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL `,
    //=====================================================================================
    tampilkanSemuaListBarangCustomer: `SELECT '' AS jenis_kain,'' AS warna,dp.no_order,dp.no_packing AS notransaksi,SUM(dpc.berat) AS berat,COUNT(dp.no_packing) AS jml_potong,'PACKING' AS sts,
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

    //=====================================================================================================
    tampilkanBelumScanBarang: `SELECT dp.no_order,dp.no_packing as notransaksi,SUM(dpc.berat) AS berat,COUNT(dp.no_packing) AS jml_potong,'PACKING' AS jenis_packing,
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(ls.no_lokasi,'-') AS lokasi
        FROM data_packingkain dp JOIN detail_packingkain dpc ON dpc.no_packing=dp.no_packing left join detail_ngebal dg
        ON dg.no_packing_roll=dp.no_packing LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing
        LEFT JOIN lokasi_selesai ls ON ls.no_transaksi = dp.no_packing
        where dg.no_packing_roll is null  and dp.no_order=? and IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan')='Belum di Scan'         
        GROUP BY dp.no_packing                                                                                                       
        UNION                                                                                                                       
        SELECT dp.no_order,dp.no_ngebal as notransaksi,SUM(dpc.berat) AS berat,SUM(dpc.jml_potong) AS jml_potong,'BAL' AS jenis_packing,                
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(ls.no_lokasi,'-') AS lokasi
        FROM data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal
        LEFT JOIN lokasi_selesai ls ON ls.no_transaksi = dp.no_ngebal 
        where dp.no_order=? and IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan')='Belum di Scan'
        GROUP BY dp.no_ngebal                                                                                                      
        UNION                                                                                                                      
        SELECT op.no_order,po.no_roll as notransaksi,po.berat,1 AS jml_potong,'ROLLAN' AS jenis_packing,                                          
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(pp.no_lokasi,'-') AS lokasi
        FROM perincian_order po JOIN detail_order dr USING(no_Detail) JOIN order_pembelian op USING(no_order)
        LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=no_roll
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll
        LEFT JOIN perincian_penerimaanstok pp ON pp.no_roll = po.no_roll 
        WHERE op.no_order=?  and jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL and IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan')='Belum di Scan' `,

    //=====================================================================================================
    qData: `SELECT dp.no_order,dp.no_packing as notransaksi,SUM(dpc.berat) AS berat,COUNT(dp.no_packing) AS jml_potong,'PACKING' AS jenis_packing,
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(ls.no_lokasi,'-') AS lokasi
        FROM data_packingkain dp JOIN detail_packingkain dpc ON dpc.no_packing=dp.no_packing left join detail_ngebal dg     
        ON dg.no_packing_roll=dp.no_packing LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing
        LEFT JOIN lokasi_selesai ls ON ls.no_transaksi = dp.no_packing
        where dg.no_packing_roll is null  and dp.no_order=?            
        GROUP BY dp.no_packing                                                                                                            
        UNION                                                                                                                            
        SELECT dp.no_order,dp.no_ngebal as notransaksi,SUM(dpc.berat) AS berat,SUM(dpc.jml_potong) AS jml_potong,'BAL' AS jenis_packing,                     
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(ls.no_lokasi,'-') AS lokasi
        FROM data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal
        LEFT JOIN lokasi_selesai ls ON ls.no_transaksi = dp.no_ngebal
        where dp.no_order=?                                                        
        GROUP BY dp.no_ngebal                                                                                                           
        UNION                                                                                                                           
        SELECT op.no_order,po.no_roll as notransaksi,po.berat,1 AS jml_potong,'ROLLAN' AS jenis_packing,                                               
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(pp.no_lokasi,'-') AS lokasi
        FROM perincian_order po JOIN detail_order dr USING(no_Detail) JOIN order_pembelian op USING(no_order)
        LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=no_roll
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll
        LEFT JOIN perincian_penerimaanstok pp ON pp.no_roll = po.no_roll
        WHERE op.no_order=?  and jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL`,

    //=====================================================================================================
    qMuat1: `SELECT '' AS kode_customer,tm.no,op.no_order,nama,no_mobil, 
        (IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0)) as a,
        IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0) as b,
        CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0)),' of ', 
        (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,              
        IFNULL(FORMAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0))/    
        (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))*100,0),0) AS persen,op.exspedisi        
        FROM order_pembelian op JOIN customer c USING(id_customer) JOIN temp_muat tm ON tm.no_order=op.no_order
        LEFT JOIN                                                                                               
        (SELECT dp.no_order,COUNT(dp.no_packing) AS jml FROM data_packingkain dp                              
        LEFT JOIN detail_ngebal dg ON dg.no_packing_roll=dp.no_packing  WHERE dg.no_packing_roll IS NULL       
        GROUP BY dp.no_order) AS pck ON pck.no_order=op.no_order                                             
        LEFT JOIN                                                                                             
        (SELECT dp.no_order,COUNT(dp.no_packing) AS jml FROM data_packingkain dp                              
        LEFT JOIN detail_ngebal dg ON dg.no_packing_roll=dp.no_packing                                        
        JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing  WHERE dg.no_packing_roll IS NULL           
        GROUP BY dp.no_order) AS pckscan ON pckscan.no_order=op.no_order                                    
        LEFT JOIN                                                                                            
        (SELECT dp.no_order,COUNT(dp.no_ngebal) AS jmlbal                                                    
        FROM data_ngebal dp WHERE dp.no_ngebal IN (SELECT no_ngebal FROM detail_ngebal ) GROUP BY dp.no_order) AS tngebal ON tngebal.no_order=op.no_order               
        LEFT JOIN                                                                                           
        (SELECT dp.no_order,COUNT(dp.no_ngebal) AS jmlbal                                                   
        FROM data_ngebal dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal GROUP BY dp.no_order) AS ngebalscan ON ngebalscan.no_order=op.no_order  
        LEFT JOIN                                                                                             
        (SELECT dr.no_order,COUNT(no_roll) AS jml_potong                                                     
        FROM perincian_order po JOIN detail_order dr USING(no_Detail)                                        
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll WHERE jenis_quantity='ROLLAN' and dn.no_packing_roll IS NULL GROUP BY no_order) 
        AS rollall ON rollall.no_order=op.no_order                                                                     
        LEFT JOIN                                                                                                       
        (SELECT dr.no_order,COUNT(no_roll) AS jml_potong FROM perincian_order po JOIN detail_order dr USING(no_Detail)  
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll  JOIN  temp_pengeluaran tp ON tp.no_transaksi=po.no_roll    
        WHERE jenis_quantity='ROLLAN' and dn.no_packing_roll IS NULL GROUP BY no_order) AS  rollscan ON rollscan.no_order=op.no_order where no_mobil=? GROUP BY no_order
        UNION
        SELECT '' AS kode_customer,tm.no,op.no_penjualan,nama,no_mobil,(IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)) AS a,                
        IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0) AS b,                                       
        CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)),' of ',                                                  
        (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,                              
        IFNULL(FORMAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0))/                                                  
        (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))*100,0),0) AS persen,                      
        op.ekspedisi as exspedisi                                                                                           
        FROM s_penjualan_katalog op JOIN customer c USING(id_customer) JOIN temp_muat tm ON tm.no_order=op.no_penjualan     
        LEFT JOIN                                                                                                           
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp                            
        LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan  WHERE dg.no_packing IS NULL                     
        GROUP BY dp.no_penjualan) AS pck ON pck.no_penjualan=op.no_penjualan                                                
        LEFT JOIN                                                                                                           
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jml FROM a_master_packingkatalog dp                            
        LEFT JOIN a_packing_katalog dg ON dg.no_packing=dp.id_balpenjualan                                                  
        JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan  WHERE dg.no_packing IS NULL                         
        GROUP BY dp.no_penjualan) AS pckscan ON pckscan.no_penjualan=op.no_penjualan                                        
        LEFT JOIN                                                                                                           
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal                                                         
        FROM a_master_packingkatalog dp WHERE id_balpenjualan IN(SELECT no_packing FROM a_packing_katalog) GROUP BY dp.no_penjualan) AS tngebal ON tngebal.no_penjualan=op.no_penjualan   
        LEFT JOIN                                                                                                                                                                         
        (SELECT dp.no_penjualan,COUNT(dp.id_balpenjualan) AS jmlbal                                                                                                                       
        FROM a_master_packingkatalog dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan GROUP BY dp.no_penjualan) AS ngebalscan ON ngebalscan.no_penjualan=op.no_penjualan 
        LEFT JOIN                                                                                                                                                                         
        (SELECT dr.no_penjualan,COUNT(qty) AS jml_potong                                                                                                                                  
        FROM s_detail_penjualankatalog dr                                                                                                                                                 
        LEFT JOIN a_packing_katalog dn ON dn.no_detailpenjualan=dr.no_detail WHERE dn.no_packing IS NULL GROUP BY no_penjualan)                                                           
        AS rollall ON rollall.no_penjualan=op.no_penjualan                                                                                                                                
        where no_mobil=?
        GROUP BY no_penjualan                                                                                                                                                             
        order by no asc`,

    //=====================================================================================================
    qMuat2: `SELECT '' AS kode_customer,op.no_order,nama,no_mobil, 
        (IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0)) as a,
        IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0) as b,
        CONCAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0)),' of ', 
        (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))) AS progres,              
        IFNULL(FORMAT((IFNULL(pckscan.jml,0)+IFNULL(ngebalscan.jmlbal,0)+IFNULL(rollscan.jml_potong,0))/    
        (IFNULL(pck.jml,0)+IFNULL(tngebal.jmlbal,0)+IFNULL(rollall.jml_potong,0))*100,0),0) AS persen,op.exspedisi        
        FROM order_pembelian op JOIN customer c USING(id_customer) JOIN detail_muat dtm ON dtm.no_pengeluaran=op.no_order JOIN muat_orderan tm ON tm.no_muat=dtm.no_muat left join a_nourut_muat an on tm.no_muat=an.no_muat
        LEFT JOIN 
        (SELECT no_muat,SUM(ongkir) AS ongkir FROM detail_muat dm  JOIN ongkir ok ON ok.no_transaksi=dm.no_pengeluaran GROUP BY no_muat) AS ghy ON ghy.no_muat=tm.no_muat
        LEFT JOIN                                                                                               
        (SELECT dp.no_order,COUNT(dp.no_packing) AS jml FROM data_packingkain dp                              
        LEFT JOIN detail_ngebal dg ON dg.no_packing_roll=dp.no_packing  WHERE dg.no_packing_roll IS NULL       
        GROUP BY dp.no_order) AS pck ON pck.no_order=op.no_order                                             
        LEFT JOIN                                                                                             
        (SELECT dp.no_order,COUNT(dp.no_packing) AS jml FROM data_packingkain dp                              
        LEFT JOIN detail_ngebal dg ON dg.no_packing_roll=dp.no_packing                                        
        JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing  WHERE dg.no_packing_roll IS NULL           
        GROUP BY dp.no_order) AS pckscan ON pckscan.no_order=op.no_order                                    
        LEFT JOIN                                                                                            
        (SELECT dp.no_order,COUNT(dp.no_ngebal) AS jmlbal                                                    
        FROM data_ngebal dp WHERE dp.no_ngebal IN (SELECT no_ngebal FROM detail_ngebal ) GROUP BY dp.no_order) AS tngebal ON tngebal.no_order=op.no_order               
        LEFT JOIN                                                                                           
        (SELECT dp.no_order,COUNT(dp.no_ngebal) AS jmlbal                                                   
        FROM data_ngebal dp JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal GROUP BY dp.no_order) AS ngebalscan ON ngebalscan.no_order=op.no_order  
        LEFT JOIN                                                                                             
        (SELECT dr.no_order,COUNT(no_roll) AS jml_potong                                                     
        FROM perincian_order po JOIN detail_order dr USING(no_Detail)                                        
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll WHERE jenis_quantity='ROLLAN' and dn.no_packing_roll IS NULL GROUP BY no_order) 
        AS rollall ON rollall.no_order=op.no_order                                                                     
        LEFT JOIN                                                                                                       
        (SELECT dr.no_order,COUNT(no_roll) AS jml_potong FROM perincian_order po JOIN detail_order dr USING(no_Detail)  
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll  JOIN  temp_pengeluaran tp ON tp.no_transaksi=po.no_roll    
        WHERE jenis_quantity='ROLLAN' and dn.no_packing_roll IS NULL GROUP BY no_order) AS  rollscan ON rollscan.no_order=op.no_order where no_mobil=? and 
        tm.status=0  AND IFNULL(ghy.ongkir,0)>0 GROUP BY no_order order by an.no_urut asc`,

    //=====================================================================================================

    validationQuery: `select * from kode_verifikasipenjualan kv left join relasi_orderdanpenjualan ro on 
        kv.no_penjualan=ro.no_penjualan   where no_order not in (select no_order from order_sudahdikirim) and 
        kv.no_penjualan=? and kode_verifikasi=? 
        and kv.status=0 AND SUBSTR(kv.no_penjualan,1,2) <> 'KT'`,
    //=====================================================================================================
    checkVerifikasiQuery: `select * from penjualan_kainstok where no_pengeluaran=?`,
    //=====================================================================================================
    verifikasiCodeQuery: `select * from kode_verifikasipenjualan kv left join relasi_orderdanpenjualan ro on kv.no_penjualan=ro.no_penjualan
        where no_order  in (select no_order from order_sudahdikirim) and kv.no_penjualan=? and 
        kode_verifikasi=? and kv.status=0 and kv.status=0 AND SUBSTR(kv.no_penjualan,1,2) <> 'KT'`,
    //=====================================================================================================
    getInformationCustomerQuery: `SELECT kv.no_penjualan,nama FROM kode_verifikasipenjualan kv JOIN penjualan_kainstok pks
        ON kv.no_penjualan=pks.no_pengeluaran  JOIN customer c USING(id_customer) left join relasi_orderdanpenjualan ro on kv.no_penjualan=ro.no_penjualan
        where no_order not in (select no_order from order_sudahdikirim) and kv.no_penjualan=? and kode_verifikasi=? and kv.status=0`,
    //=====================================================================================================
    validationDataQuery: `select * from relasi_orderdanpenjualan where no_penjualan=? and no_order!='' order by no desc limit 1`,
    //=====================================================================================================
    getOngkirQuery: `select * from ongkir where no_transaksi=? and ongkir > 0`,
    //=====================================================================================================
    validationRelasiQuery: `select exspedisi from relasi_orderdanpenjualan ro join order_pembelian using(no_order) where ro.no_penjualan=?`,
    //=====================================================================================================

    validationEkspedisiQuery: `select status_pengambilan from ekspedisi where nama=?`,

    //=====================================================================================================
    validationRelasiOrderQuery: `select * from relasi_orderdanpenjualan where no_penjualan=? and no_order!='' order by no desc limit 1`,
    //=====================================================================================================

    validasiAccPerubahanQuery: `select * from a_acc_perubahanexspedisi where no_order=?`,

    //=====================================================================================================
    checkAccPerubahanQuery: `SELECT * FROM a_acc_perubahanexspedisi where no_order=?
        AND tanggal < (SELECT MAX(tanggal) FROM a_histori_cetakfakturasli WHERE no_order = ? GROUP BY no_order)`,
    //=====================================================================================================

    checkingQuery: `select * from konfirmasi_pembayaran where no_order=? and (status_verifikasi='SUDAH DI VERIFIKASI' or status_verifikasi='SUDAH DI VERIFIKASI SATPAM')`,
    //=====================================================================================================

    validationJenisQuery: `select * from order_pembelian where no_order=?`,
    //=====================================================================================================

    validationRelasiOrderdanPenjualanQuery: `select * from relasi_orderdanpenjualan where no_order=?`,
    //=====================================================================================================

    validationOrderQuery: `select no_order from order_sudahdikirim where no_order=?`,

    //=====================================================================================================
    getInformationCustomerOtherQuery: `SELECT * FROM  order_pembelian JOIN customer c USING(id_customer)
        JOIN n_kodeunik_6digit nkd USING(id_customer) WHERE no_order=?`,

    //=====================================================================================================
    validationOrderGabungQuery: `select * from  a_group_order ago
        LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS asal ON asal.no_order=ago.no_order_asal
        LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS gabung ON gabung.no_order=ago.no_order_gabung
        where no_order_asal=? AND gabung.no_order IS NULL AND asal.no_order IS NULL`,
    //=====================================================================================================

    verifikasiPenjualanQuery: `SELECT * FROM kode_verifikasipenjualan kv
        WHERE no_penjualan NOT IN (SELECT no_order FROM order_sudahdikirim) AND
        kv.no_penjualan=? and kode_verifikasi=? and kv.status=0 AND SUBSTR(no_penjualan,1,2)='KT'`,

    //=====================================================================================================
    checkPenjualanQuery: `select * from s_penjualan_katalog where no_penjualan=?`,

    //=======================================================================================================

    kodeVerifikasiPenjualan: `SELECT * FROM kode_verifikasipenjualan kv
    WHERE no_penjualan IN (SELECT no_order FROM order_sudahdikirim) AND 
    no_penjualan=? and kode_verifikasi=? and kv.status=0 AND SUBSTR(no_penjualan,1,2) = 'KT'`,

    //=====================================================================================================
    validationCodeOrderKatalogQuery: `SELECT * FROM kode_verifikasipenjualan kv 
        WHERE no_penjualan IN (SELECT no_order FROM order_sudahdikirim) AND   
        SUBSTR(kv.no_penjualan,LENGTH(kv.no_penjualan)-2,3)=? and kode_verifikasi=? and kv.status=0 AND SUBSTR(no_penjualan,1,2) = 'KT'`,

    //=====================================================================================================
    getInformationCustomerOrderKatalogQuery: `SELECT kv.no_penjualan,nama FROM kode_verifikasipenjualan kv JOIN s_penjualan_katalog pks 
        USING(no_penjualan)  JOIN customer c USING(id_customer) WHERE no_penjualan NOT IN (SELECT no_order FROM order_sudahdikirim) and
        SUBSTR(kv.no_penjualan,LENGTH(kv.no_penjualan)-2,3)=? and kode_verifikasi=? and kv.status=0`,
    //=====================================================================================================

    getOngkirOrderKatalogQuery: `select * from ongkir where no_transaksi=? and ongkir > 0`,
    //=====================================================================================================

    validationRelasiOrderKatalogQuery: `SELECT ekspedisi FROM s_penjualan_katalog where no_penjualan=?`,
    //=====================================================================================================

    validationEkspedisiOrderKatalogQuery: `select status_pengambilan from ekspedisi where nama=?`,

    //=====================================================================================================
    validationAccPerubahanEkspedisiOrderKatalogQuery: `select * from a_acc_perubahanexspedisi where no_order=?`,
    //=====================================================================================================

    validasiKatalogOrderKatalogQuery: `select * from s_penjualan_katalog where no_penjualan=?`,

    //=====================================================================================================
    checkValidasiOrderKatalogQuery: `SELECT * FROM a_acc_perubahanexspedisi where no_order=?
        AND tanggal < (SELECT MAX(tanggal) FROM a_histori_cetakfakturasli WHERE no_order = ? GROUP BY no_order)`,

    //=====================================================================================================
    validasiPembayaranOrderKatalogQuery: `select * from konfirmasi_pembayaran where no_order=? and (status_verifikasi='SUDAH DI VERIFIKASI' or status_verifikasi='SUDAH DI VERIFIKASI SATPAM')`,

    //=====================================================================================================
    validasiKatalog2Query: `select * from s_penjualan_katalog where no_penjualan=? and no_order='SELESAI' and status_scan='1'`,

    //=====================================================================================================
    validasiNoOrderQuery: `select no_order from order_sudahdikirim where no_order=?`,

    //=====================================================================================================
    getInformationCustomerOrderKatalogOtherQuery: `select * from  s_penjualan_katalog join customer c USING(id_customer)
        join n_kodeunik_6digit nkd using(id_customer) where no_penjualan=?`,
    //=====================================================================================================

    validationOrderGabungOrderKatalogQuery: `select * from  a_group_order ago
        LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS asal ON asal.no_order=ago.no_order_asal
        LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS gabung ON gabung.no_order=ago.no_order_gabung
        where no_order_asal=? AND gabung.no_order IS NULL AND asal.no_order IS NULL`,

    //=====================================================================================================
    checkKodeRollVerifikasiKodeVerifikasiQuery: `select * from data_cabang where kode_roll=?`,
    //=====================================================================================================

    validationKodeVerifikasiKodeVerifikasiQuery: `SELECT * FROM a_kodeverifikasi ak WHERE kode=? and no_order is not null`,

    //=====================================================================================================
    getInformationVerifikasiKodeVerifikasiQuery: `SELECT * FROM a_kodeverifikasi ak WHERE kode=? and no_order=?`,
    //=====================================================================================================

    validationOngkirVerifikasiKodeVerifikasiQuery: `select * from ongkir where no_transaksi=? and ongkir > 0`,

    //=====================================================================================================
    validationAccPerubahanVerifikasiKodeVerifikasiQuery: `select * from a_acc_perubahanexspedisi where no_order=?`,

    //=====================================================================================================
    validasiEkspedisiVerifikasiKodeVerifikasiQuery: `SELECT * FROM a_acc_perubahanexspedisi where no_order=?
        AND tanggal < (SELECT MAX(tanggal) FROM a_histori_cetakfakturasli WHERE no_order = ? GROUP BY no_order)`,

    //=====================================================================================================
    resCustomerVerfikasiKodeVerifikasiQuery: `select o.*,c.*,u.nama as admin,nkd.kode AS kode_customer from order_pembelian o join customer c using(id_customer)
        join n_kodeunik_6digit nkd using(id_customer) join user u on o.id_karyawan=u.id_user where no_order=?`,
    //=====================================================================================================

    resCustomerVerfikasiKodeVerifikasiOtherQuery: `SELECT spk.*,c.*,IFNULL(u.username,'') AS admin,nkd.kode AS kode_customer  FROM s_penjualan_katalog spk
        JOIN customer c USING(id_customer) left JOIN n_kodeunik_6digit nkd USING(id_customer)
        LEFT JOIN a_userorder_katalog USING(no_penjualan) LEFT JOIN user u USING(id_user)
        where no_penjualan=?`,

    //=====================================================================================================
    validationPenjualanVerifkasiKodeVerifikasiQuery: `select * from s_penjualan_katalog where no_penjualan=?`,
    //=====================================================================================================

    getStatusVerifikasiKodeVerifikasiQuery: `select * from konfirmasi_pembayaran where no_order=? and (status_verifikasi='SUDAH DI VERIFIKASI' or status_verifikasi='SUDAH DI VERIFIKASI SATPAM')`,
    //=====================================================================================================

    validationOrderPembelianVerifikasiKodeVerifikasiQuery: `select * from order_pembelian where no_order=?`,
    //=====================================================================================================

    getKonfirmasiVerifikasiKodeVerifikasiQuery: `select * from konfirmasi_pembayaran where no_order=? and (status_verifikasi='SUDAH DI VERIFIKASI' or status_verifikasi='SUDAH DI VERIFIKASI SATPAM')`,
    //=====================================================================================================

    getStatusVerifikasiKodeVerifikasiOtherQuery: `SELECT * FROM penjualan_kainstok WHERE no_pengeluaran=? AND status='1'`,
    //=====================================================================================================

    getNoOrderVakidationVerifikasiKodeVerfikasiQuery: `select no_order from order_sudahdikirim where no_order=?`,

    //=====================================================================================================
    validationPackingKatalogVerifikasiKodeVerifikasiQuery: `select * from a_master_packingkatalog dp join a_packing_katalog dpc 
        ON dpc.no_packing=dp.id_balpenjualan where dp.no_penjualan=?`,
    //=====================================================================================================

    resCustomerVerfikasiKodeVerifikasiOther3Query: `select *, '-' as tanggal_lunas from  s_penjualan_katalog spk join customer c USING(id_customer)
        join n_kodeunik_6digit nkd using(id_customer) where no_penjualan=?`,
    //=====================================================================================================

    resCustomerVerfikasiKodeVerifikasiOther4Query: `select *, '-' as tanggal_lunas from order_pembelian op join customer c USING(id_customer)
        join n_kodeunik_6digit nkd using(id_customer) where no_order=?`,
    //=====================================================================================================

    validationOrdeGabung2VerifikasiKodeVerifikasi: `select * from  a_group_order ago
        LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS asal ON asal.no_order=ago.no_order_asal
        LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS gabung ON gabung.no_order=ago.no_order_gabung
        where no_order_gabung=? AND gabung.no_order IS NULL AND asal.no_order IS NULL`,
    //=====================================================================================================

    getAdminKatalogVerifikasiOrderVerifikasi: `select * from a_userorder_katalog join user using(id_user) where no_penjualan=?`,

    //=====================================================================================================
    getAdminVerifikasiOrderVerifikasi: `select * from order_pembelian op join user on(op.id_karyawan=user.id_user) where no_order=?`,

    //=====================================================================================================
    progressOrderVerifikasiOrderVerifikasi: `SELECT cek_statusprogressorder(?) AS progress_order`,

    //=====================================================================================================
    jmlOrder2VerifikasiOrderVerifikasi: `SELECT CONCAT(apk.status, ' of ',sdp.qty ) AS jumlah_rollan, '-' AS jumlah_kgan 
    FROM s_detail_penjualankatalog sdp LEFT JOIN a_packing_katalog apk ON(sdp.no_detail=apk.no_detailpenjualan) 
    WHERE sdp.no_penjualan=?`,

    //=====================================================================================================
    getTanggalOrderVerifikasiOrderVerifikasi: `select CONCAT(DATE(IFNULL('-', tanggal)), ' ', TIME(IFNULL('', tanggal))), jenis from s_penjualan_katalog where no_penjualan=?`,

    //=====================================================================================================
    getTanggalEstimasiVerifikasiOrderVerifikasi: `select CONCAT(DATE(tanggal_edit), ' ', TIME(tanggal_edit)) as tanggal_estimasi from s_historipenjualan_katalog where no_penjualan=?`,
    //=====================================================================================================

    getTanggalOrderVerifikasiOrderVerifikasi2: `SELECT op.no_order, CONCAT(DATE(IFNULL(op.tanggal, spk.tanggal)), ' ', TIME(IFNULL(op.tanggal, spk.tanggal))) AS tanggal_order, op.jenis FROM order_pembelian op 
        LEFT JOIN s_penjualan_katalog spk ON(op.no_order=spk.no_order) WHERE op.no_order=?`,

    //=====================================================================================================
    getTanggalEstimasiVerifikasiOrderVerifikasi2: `select CONCAT(DATE(janji_kirim), ' ', TIME(janji_kirim)) as tanggal_estimasi from v_nprogresorder where no_order=?`,

    //=====================================================================================================
    jmlOrderVerifikasiOrderVerifikasi: `SELECT op.no_order,c.nama AS customer,jenis,telepon,op.tanggal,IFNULL(pnm.nama,'') AS operator,exspedisi,
    CONCAT(TIMEDIFF(NOW(),IFNULL(kp.tanggal,op.tanggal)),'') AS durasi_tunggu,                                               
    TIME_TO_SEC(TIMEDIFF(NOW(),IFNULL(kp.tanggal,op.tanggal)))/60 AS menit,id_karyawan,                                        
    IFNULL(FORMAT((IFNULL(kg.jml,0)/IFNULL(tkg.jml,0))*100,0),0) AS proseskgan,                                                
     concat(ifnull(kg.jml,0),' of ',ifnull(kpersen.jml,0)) as progreskganangka,                                              
     concat(ifnull(rollpersenscan.jml,0),' of ',ifnull(rollpersen.jml,0)) as progresrollanangka,                             
    IFNULL(FORMAT((IFNULL(rll.jml,0)/IFNULL(trll.jml,0))*100,0),0) AS prosesrollan,                                            
    status_bayar,status_order,u.nama AS admin,IFNULL(ta.tanggal,'TIDAK DI SET') AS tgl_ambil,                                
    IFNULL(CONCAT(FORMAT(TIME_TO_SEC(TIMEDIFF(ta.tanggal,NOW()))/60,0),' Menit'),1000) AS sisa_Waktu,                        
    IFNULL(FORMAT(TIME_TO_SEC(TIMEDIFF(ta.tanggal,NOW()))/60,0),1000) AS urutan,IFNULL(ao.nama,'') AS admin_order             
    FROM order_pembelian op JOIN customer c USING(id_customer) JOIN muliaabadi_baru.user u ON u.id_user=op.id_karyawan          
    LEFT JOIN                                                                                                                   
    (SELECT no_order,COUNT(no_detail) AS jml FROM detail_order WHERE  jenis_quantity='KGAN' GROUP BY no_order)                 
    AS kpersen ON kpersen.no_order=op.no_order                                                                                    
    LEFT JOIN                                                                                                                       
    (SELECT no_order,SUM(berat_ataujmlroll) AS jml FROM detail_order WHERE  jenis_quantity='ROLLAN' GROUP BY no_order)              
    AS rollpersen ON rollpersen.no_order=op.no_order                                                                                    
    LEFT JOIN                                                                                                                                
    (SELECT no_order,COUNT(no_roll) AS jml FROM detail_order JOIN perincian_order pr USING(no_detail) WHERE  jenis_quantity='ROLLAN' GROUP BY no_order) 
    AS rollpersenscan ON rollpersenscan.no_order=op.no_order                                                                                      
    LEFT JOIN                                                                                                                                   
    (SELECT no_order,COUNT(no_order) AS jml FROM detail_order WHERE  dikerjakan='SIAP KIRIM' AND jenis_quantity='KGAN' GROUP BY no_order)   
    AS kg ON kg.no_order=op.no_order                                                                                                            
    LEFT JOIN                                                                                                                                   
    (SELECT no_order,COUNT(no_order) AS jml FROM detail_order WHERE  jenis_quantity='KGAN' GROUP BY no_order)                                 
    AS tkg ON tkg.no_order=op.no_order                                                                                                          
    LEFT JOIN                                                                                                                                   
    (SELECT no_order,COUNT(no_order) AS jml FROM detail_order WHERE  dikerjakan='SIAP KIRIM' AND jenis_quantity='ROLLAN' GROUP BY no_order) 
    AS rll ON rll.no_order=op.no_order                                                                                                          
    LEFT JOIN                                                                                                                                   
    (SELECT no_order,COUNT(no_order) AS jml FROM detail_order WHERE  jenis_quantity='ROLLAN' GROUP BY no_order)                               
    AS trll ON trll.no_order=op.no_order                                                                                                         
    LEFT JOIN                                                                                                                                    
    tgl_ambilorder ta ON ta.no_order=op.no_order                                                                                                  
    LEFT JOIN konfirmasi_pembayaran kp ON kp.no_order=op.no_order                                                                                    
    LEFT JOIN (SELECT no_order,nama FROM status_pekerjaan sp JOIN muliaabadi_baru.user u ON u.id_user=sp.id_karyawan WHERE sp.jenis_pekerjaan='PENIMBANGAN' and status=0)
    AS pnm ON pnm.no_order=op.no_order                                                                                                                      
    LEFT JOIN (SELECT nama,no_order FROM admin_order od JOIN muliaabadi_baru.user  u ON od.id_karyawan=u.id_user) AS ao ON ao.no_order=op.no_order
    where op.no_order=?
    ORDER BY  jenis DESC,TIME_TO_SEC(TIMEDIFF(NOW(),IFNULL(kp.tanggal,op.tanggal)))/60 ASC,menit DESC`,

    //=====================================================================================================
    jmlOrderVerifikasiOrderVerifikasi1: `(SELECT CONCAT(COUNT(data_awal), ' of ', COUNT(data_akhir)) AS jumlah_rollan, (
        SELECT CONCAT(COUNT(data_awal), ' of ', COUNT(data_akhir)) AS jumlah_kgan
        FROM (SELECT dor.no_order AS data_awal, po.no_roll AS data_akhir  FROM order_pembelian op JOIN detail_order dor 
        ON(op.no_order=dor.no_order) JOIN perincian_order po ON(dor.no_detail=po.no_detail)
        LEFT JOIN detail_packingkain dpk ON(po.no_roll=dpk.no_roll) 
        WHERE jenis_packing<>'LANGSUNG KIRIM' AND dor.jenis_quantity='KGAN' AND op.no_order=?) AS data2) AS jumlah_kgan
        FROM (SELECT dor.no_order AS data_awal, po.no_roll AS data_akhir  FROM order_pembelian op JOIN detail_order dor 
        ON(op.no_order=dor.no_order) JOIN perincian_order po ON(dor.no_detail=po.no_detail)
        WHERE jenis_packing<>'LANGSUNG KIRIM' AND dor.jenis_quantity='ROLLAN' AND po.status=2 AND op.no_order=?) AS data1)`,
    //=====================================================================================================

    checkSpenjualanKirim: `select * from s_penjualan_katalog where no_penjualan=?`,
    //=====================================================================================================

    checkSpenjualanKirim2: `select * from order_pembelian where no_order=?`,

    //=====================================================================================================
    checkPengeluaranSatpamKirim: `select * from pengeluaran_satpam where no_order=?`,

    //=====================================================================================================
    getMaxNoPengeluaran: `select max(no) as no from pengeluaran_satpam`,

    //=====================================================================================================
    getDataVerifikasiKainManual: `SELECT dp.id_balpenjualan,SUM(dpc.status) AS jmlkatalog,'DIBAL' AS sts FROM a_master_packingkatalog dp  JOIN
        a_packing_katalog dpc ON dpc.no_packing=dp.id_balpenjualan  where dp.id_balpenjualan=?`,
    //=====================================================================================================

    checkOrderGabungVerifikasiKainManual: `select * from  a_group_order ago
        LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS asal ON asal.no_order=ago.no_order_asal
        LEFT JOIN (SELECT no_order FROM order_sudahdikirim) AS gabung ON gabung.no_order=ago.no_order_gabung
        where no_order_gabung=? AND gabung.no_order IS NULL AND asal.no_order IS NULL`,

    //=====================================================================================================
    dataScanVerifikasiKainManual: `SELECT dp.no_penjualan AS no_order,dp.id_balpenjualan AS notransaksi,SUM(dpc.status) AS jml_potong,0.00 AS berat,'DIBAL' AS sts, IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, '_' as lokasi
        FROM a_master_packingkatalog dp JOIN a_packing_katalog dpc ON dpc.no_packing=dp.id_balpenjualan
        LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan WHERE dp.no_penjualan=?  and dp.id_balpenjualan=?`,

    //=====================================================================================================
    checkNoMuatVerifikasiKainManual: `SELECT * FROM muat_orderan mo
        join detail_muat dm using(no_muat) left join ongkir ok ON ok.no_transaksi=dm.no_pengeluaran
        JOIN user u ON u.id_user=mo.id_user WHERE mo.status=0 AND ongkir > 0 and no_mobil=? GROUP BY no_muat`,
    //=====================================================================================================

    dataScanVerifikasiKainManual2: `SELECT dp.no_order,dp.no_packing as notransaksi,SUM(dpc.berat) AS berat,COUNT(dp.no_packing) AS jml_potong,'PACKING' AS sts,
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(ls.no_lokasi,'-') AS lokasi
        FROM data_packingkain dp JOIN detail_packingkain dpc ON dpc.no_packing=dp.no_packing left join detail_ngebal dg     
        ON dg.no_packing_roll=dp.no_packing LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing
        LEFT JOIN lokasi_selesai ls ON ls.no_transaksi = dp.no_packing
        where dg.no_packing_roll is null  and dp.no_order=?             
        GROUP BY dp.no_packing                                                                                                            
        UNION                                                                                                                            
        SELECT dp.no_order,dp.no_ngebal as notransaksi,SUM(dpc.berat) AS berat,SUM(dpc.jml_potong) AS jml_potong,'BAL' AS sts,                     
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(ls.no_lokasi,'-') AS lokasi
        FROM data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal
        LEFT JOIN lokasi_selesai ls ON ls.no_transaksi = dp.no_ngebal
        where dp.no_order=?                                                        
        GROUP BY dp.no_ngebal                                                                                                           
        UNION                                                                                                                           
        SELECT op.no_order,po.no_roll as notransaksi,po.berat,1 AS jml_potong,'ROLLAN' AS sts,                                               
        IF(tp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan') AS stsscan, IFNULL(pp.no_lokasi,'-') AS lokasi
        FROM perincian_order po JOIN detail_order dr USING(no_Detail) JOIN order_pembelian op USING(no_order)
        LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=no_roll
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll
        LEFT JOIN perincian_penerimaanstok pp ON pp.no_roll = po.no_roll
        WHERE op.no_order=? and jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL`,
    //=====================================================================================================

    jenisPengirimanScanBatalKirim: `SELECT dp.no_penjualan AS no_order,dp.id_balpenjualan AS notransaksi,SUM(dpc.status) 
        AS jml_potong,SUM(stk.berat * sdp.qty) AS berat,'DIBAL' AS sts, 
        IF(tp.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan
        FROM a_master_packingkatalog dp
        JOIN a_packing_katalog dpc ON dpc.no_packing=dp.id_balpenjualan
        LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan
        LEFT JOIN s_detail_penjualankatalog sdp ON sdp.no_detail=dpc.no_detailpenjualan 
        LEFT JOIN s_tabel_katalog stk USING(id_katalog)
        WHERE dp.no_penjualan=?`,
    //=====================================================================================================

    jenisPengirimanScanBatalKirim2: `SELECT dp.no_order,dp.no_packing as notransaksi,SUM(dpc.berat) AS berat,
        COUNT(dp.no_packing) AS jml_potong,'PACKING' AS sts, 
        IF(tp.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan 
        FROM data_packingkain dp JOIN detail_packingkain dpc ON dpc.no_packing=dp.no_packing left join detail_ngebal dg      
        ON dg.no_packing_roll=dp.no_packing LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing  
        where dg.no_packing_roll is null  and dp.no_order=?             
        GROUP BY dp.no_packing                                                                                                             
        UNION                                                                                                                             
        SELECT dp.no_order,dp.no_ngebal as notransaksi,SUM(dpc.berat) AS berat,SUM(dpc.jml_potong) AS jml_potong,'BAL' AS sts,                      
        IF(tp.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan 
        FROM data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal LEFT JOIN temp_pengeluaran tp 
        ON tp.no_transaksi=dp.no_ngebal where dp.no_order=?                                                        
        GROUP BY dp.no_ngebal                                                                                                            
        UNION                                                                                                                            
        SELECT op.no_order,no_roll as notransaksi,po.berat,1 AS jml_potong,'ROLLAN' AS sts,                                                
        IF(tp.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan 
        FROM perincian_order po JOIN detail_order dr USING(no_Detail) JOIN order_pembelian op USING(no_order) 
        LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=no_roll 
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll 
        WHERE op.no_order=? and jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL  
        UNION 
        SELECT if(spk.no_penjualan IS NULL,'KATALOG','ADA') AS no_order,spk.no_penjualan AS notransaksi,SUM(sdp.qty) 
        AS jml_potong,SUM(stk.berat * sdp.qty) AS berat,'DIBAL' AS sts,
        IF(spk.no_penjualan IS NULL,'Sudah di scan','Sudah di scan') AS stsscan    
        FROM s_penjualan_katalog spk
        LEFT JOIN s_detail_penjualankatalog sdp USING(no_penjualan)
        LEFT JOIN s_tabel_katalog stk USING(id_katalog)
        WHERE spk.no_order=?`,
    //=====================================================================================================

    getDataOptionalScanBsSegel: `SELECT no_ngebal,sum(jml) as jml,sum(berat) as berat,if(vs.no_transaksi is not null,'SUDAH','BELUM') as sts
        from (SELECT no_ngebal,no_pengeluaran,p.tanggal,jml, SUM(berat) AS berat
        FROM data_ngebal_bssegel d JOIN detail_ngebal_bssegel dn USING(no_ngebal) JOIN n_relasi_bssegel n USING(no_ngebal) 
        JOIN penjualan_kainstok p USING(no_pengeluaran) WHERE d.status=2 GROUP BY no_ngebal) AS dump 
        left join (SELECT no_transaksi FROM detail_pengeluaransatpam_bssegel GROUP BY no_transaksi) as vs on no_ngebal=no_transaksi GROUP BY no_ngebal`,
    //=====================================================================================================

    dataOrderHistoriBarangKeluar: `SELECT ps.no_pengeluaran AS no_penjualan, '-' AS no_order, u.nama FROM pengeluaran_satpam_bssegel ps 
        JOIN relasi_orderdanpenjualan ro ON ps.no_pengeluaran=ro.no_penjualan
        JOIN user u USING(id_user) WHERE DATE(tanggal) BETWEEN ? AND ?
        UNION
        SELECT ps.no_pengeluaran AS no_penjualan, '-' AS no_order, u.nama FROM pengeluaran_satpam_transfer ps 
        JOIN relasi_orderdanpenjualan ro ON ps.no_pengeluaran=ro.no_penjualan
        JOIN user u USING(id_user) WHERE DATE(tanggal) BETWEEN ? AND ?
        UNION
        SELECT ro.no_penjualan, dm.no_pengeluaran AS no_order, u.nama FROM detail_muat dm 
        JOIN muat_orderan mo ON(dm.no_muat=mo.no_muat) JOIN user u USING(id_user) 
        JOIN relasi_orderdanpenjualan ro ON(dm.no_pengeluaran=ro.no_order) 
        WHERE DATE(mo.tanggal) BETWEEN ? AND ?`,
    //=====================================================================================================

    summarySatpamHistoriBarangKeluar: `CALL sp_get_histori_pengeluaran(?,'jumlahitemtanggal',?,?,?)`,
    //=====================================================================================================

    getPengeluaranKainPengeluaranPo: `SELECT IFNULL(RIGHT(dn.no_ngebal,3),'-') AS nobal FROM pengeluaran_kain pk 
        JOIN detail_pengeluarankain dr USING(no_pengeluaran) JOIN perincian_detailpengeluarankain pp USING(no_detail)
        LEFT JOIN detail_ngebal_po dn ON dn.no_packing_roll=pp.no_roll  WHERE pk.no_pengeluaran=?`,
    //=====================================================================================================

    getDataPoPengeluaranPo1: `SELECT pk.no_order AS no_pengeluaran,dr.no_ngebal AS notransaksi,SUM(dr.berat) AS berat,
        COUNT(pk.no_ngebal) AS jml_potong,'ROLLAN' AS sts,IF(dsp.no_transaksi IS NULL,'Belum di Scan','Sudah di scan')  AS stsscan ,
        IFNULL(RIGHT(dr.no_ngebal,3),'-') AS nobal, c.nama FROM data_ngebal_po pk JOIN pengeluaran_kain pka ON(pk.no_order=pka.no_pengeluaran) 
        JOIN detail_ngebal_po dr USING(no_ngebal) JOIN customer c USING (id_customer)
        LEFT JOIN detail_pengeluaransatpam_po dsp ON dsp.no_transaksi=dr.no_ngebal WHERE pk.no_order=? GROUP BY pk.no_ngebal`,
    //=====================================================================================================

    getDataPoPengeluaranPo2: `SELECT pk.no_pengeluaran,no_roll AS notransaksi,pp.berat,1 AS jml_potong,'ROLLAN' AS sts,
        IF(dsp2.no_transaksi IS NULL,'Belum di Scan','Sudah di scan')  AS stsscan ,'-' AS nobal, c.nama FROM pengeluaran_kain pk 
        JOIN detail_pengeluarankain dr USING(no_pengeluaran) JOIN perincian_detailpengeluarankain pp USING(no_detail) 
        LEFT JOIN detail_pengeluaransatpam_po dsp2 ON dsp2.no_transaksi=pp.no_roll JOIN customer c USING (id_customer)
        WHERE pk.no_pengeluaran=?`,
    //=====================================================================================================

    jenisPengirimanPembatalanKirim1: `SELECT dp.no_penjualan AS no_order,dp.id_balpenjualan AS notransaksi,SUM(dpc.status) AS jml_potong,SUM(stk.berat * sdp.qty) AS berat,''DIBAL'' AS sts, IF(tp.no_transaksi IS NULL,''Belum di scan'',''Sudah di scan'') AS stsscan
        FROM a_master_packingkatalog dp
        JOIN a_packing_katalog dpc ON dpc.no_packing=dp.id_balpenjualan
        LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.id_balpenjualan
        LEFT JOIN s_detail_penjualankatalog sdp ON sdp.no_detail=dpc.no_detailpenjualan 
        LEFT JOIN s_tabel_katalog stk USING(id_katalog)
        WHERE dp.no_penjualan=?`,
    //=====================================================================================================

    jenisPengirimanPembatalanKirim2: `SELECT dp.no_order,dp.no_packing as notransaksi,SUM(dpc.berat) AS berat,COUNT(dp.no_packing) AS jml_potong,'PACKING' AS sts, 
        IF(tp.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan 
        FROM data_packingkain dp JOIN detail_packingkain dpc ON dpc.no_packing=dp.no_packing left join detail_ngebal dg      
        ON dg.no_packing_roll=dp.no_packing LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_packing  where dg.no_packing_roll is null  and dp.no_order=?             
        GROUP BY dp.no_packing                                                                                                             
        UNION                                                                                                                             
        SELECT dp.no_order,dp.no_ngebal as notransaksi,SUM(dpc.berat) AS berat,SUM(dpc.jml_potong) AS jml_potong,'BAL' AS sts,                      
        IF(tp.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan 
        FROM data_ngebal dp JOIN detail_ngebal dpc ON dpc.no_ngebal=dp.no_ngebal LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=dp.no_ngebal where dp.no_order=?                                                        
        GROUP BY dp.no_ngebal                                                                                                            
        UNION                                                                                                                            
        SELECT op.no_order,no_roll as notransaksi,po.berat,1 AS jml_potong,'ROLLAN' AS sts,                                                
        IF(tp.no_transaksi IS NULL,'Belum di scan','Sudah di scan') AS stsscan 
        FROM perincian_order po JOIN detail_order dr USING(no_Detail) JOIN order_pembelian op USING(no_order) 
        LEFT JOIN temp_pengeluaran tp ON tp.no_transaksi=no_roll 
        LEFT JOIN detail_ngebal dn ON dn.no_packing_roll=po.no_roll 
        WHERE op.no_order=? and jenis_quantity='ROLLAN' AND dn.no_packing_roll IS NULL  
        UNION 
        SELECT if(spk.no_penjualan IS NULL,'KATALOG','ADA') AS no_order,spk.no_penjualan AS notransaksi,SUM(sdp.qty) AS jml_potong,SUM(stk.berat * sdp.qty) AS berat,'DIBAL' AS sts,IF(spk.no_penjualan IS NULL,'Sudah di scan','Sudah di scan') AS stsscan    
        FROM s_penjualan_katalog spk
        LEFT JOIN s_detail_penjualankatalog sdp USING(no_penjualan)
        LEFT JOIN s_tabel_katalog stk USING(id_katalog)
        WHERE spk.no_order=?`
}


