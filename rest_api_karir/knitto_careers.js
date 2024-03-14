var express = require('express')
var app = express()
var cors = require('cors');
const fs = require('fs')
const router = require('./src/routes/router');
var bodyParser = require('body-parser');
const resIp = require('request-ip');
const nocache = require("nocache");
const helmet = require("helmet");
const rimraf = require('rimraf');
require('dotenv').config()
var port = process.env.PORT || 7000
app.use(helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "fonts.googleapis.com"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        connectSrc: ["'self'", "wss://video.geekwisdom.net"],
    },
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(helmet.frameguard({ action: 'deny' }));
app.use(nocache());
app.use(resIp.mw())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    credentials: true,
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://192.168.21.23:3000',
        'http://192.168.21.23:3001',
        'http://192.168.20.21:8053',
        'http://192.168.20.21:8054',
        'https://recruitment.knitto.co.id',
        'https://hr-hiring.knitto.co.id',
    ]
}));
app.use('/api/knitto_careers', router)
app.use("/SOALTIU", express.static("SOALTIU"));
app.use("/doc", express.static("doc"));

setInterval(() => {
    if (!fs.existsSync('./doc')) {
        fs.mkdirSync('./doc')
    }
    rimraf.sync(`./doc`)
    fs.mkdirSync('./doc')
}, 57600000)

app.listen(port, () =>
    console.log(`knitto_careers:${port} || ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`));