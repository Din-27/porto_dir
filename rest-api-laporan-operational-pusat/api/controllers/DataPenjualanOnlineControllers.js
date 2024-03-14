const { Auth } = require("../middlewares/Auth");
const { DataServiceModule, ExportExcelServiceModule } = require("../services/DataPenjualanOnlineService");
const router = require("express").Router();

router.post('/laporan/marketing/pusat/summary', Auth, DataServiceModule)
router.post('/laporan/marketing/pusat/export', Auth, ExportExcelServiceModule)

module.exports = router;
