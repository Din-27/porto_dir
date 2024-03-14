const { LoginServiceModule } = require("../services/LoginService");
const router = require("express").Router();

router.post('/laporan/marketing/pusat/login', LoginServiceModule)

module.exports = router;
