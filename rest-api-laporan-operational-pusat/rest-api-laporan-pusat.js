require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const resIp = require("request-ip");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const RoutesLoader = require("./helpers/RoutesLoader");
// const { setAuthToken } = require("./config/APIConfig");
// const Synchronizze = require("./models/sync");
// eslint-disable-next-line no-undef
const port = process.env.PORT || 8524;

app.use(
    cors({
        credentials: true,
        origin: "*",
    })
);
// setAuthToken()
app.use(resIp.mw());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/export/excel/laporan", express.static("excel"));
// eslint-disable-next-line no-undef
RoutesLoader.loadToAppFromPath(app, require("path").join(__dirname, "/api/controllers"))

app.listen(port, () =>
    console.log(
        `laporan_marketing_pusat:${port} || ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`
    )
);