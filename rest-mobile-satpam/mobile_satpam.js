var express = require("express");
var app = express();
var cors = require("cors");
const resIp = require("request-ip");
var bodyParser = require("body-parser");
const router = require("./src/routes/router");
const cookieParser = require("cookie-parser");
const Logger = require("./utils/init_logger");
const logger = new Logger("dev");
const validate = require("./middleware/request_validation_middleware");


require("dotenv").config();
app.use(
    cors({
        credentials: true,
        origin: "*",
    })
);
var port = process.env.PORT || 7001;
app.use(resIp.mw());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(validate)
app.use("/api/mobile_satpam", router);
app.use("/SOALTIU", express.static("SOALTIU"));
app.use("/uploads", express.static("uploads"));

app.listen(port, () =>
    console.log(
        `mobile_satpam:${port} || ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`
    )
);
logger.info(`mobile_satpam:${port} || ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`, {});
