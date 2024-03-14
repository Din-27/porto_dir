"use strict";

var fs = require("fs");
var connection = require('../conn/conn');
const requestIp = require('request-ip');
var response = require("../res/res");
var multer = require("multer");
const redis = require("redis");
const { promisify } = require("util");
var { rateLimit, MemoryStore } = require("express-rate-limit");
var err = "";
var apiAsana = process.env.ASANA_API_BASE_URL;
var dirRefund = "./fhoto/refund/";
var authAsana = { Authorization: process.env.ASANA_API_TOKEN };


const ipMiddleware = function (req, res, next) {
    const clientIp = requestIp.getClientIp(req);
    next();
};

let redisClient;
redisClient = redis.createClient({
    url: process.env.REDIS_URL,
});
redisClient.on("error", (error) => {
    dumpError(error);
    console.log(error);
    return;
});

const del = promisify(redisClient.del).bind(redisClient);
const get = promisify(redisClient.get).bind(redisClient);
const set = promisify(redisClient.set).bind(redisClient);
const setex = promisify(redisClient.setex).bind(redisClient);

function queryDB(query, queryvalue) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            connection.query(query, queryvalue, async function (error, rows, fields) {
                if (error) {
                    err = "Error mysql -> " + error + " <- " + this.sql;
                    reject(err);
                } else {
                    resolve({
                        rows,
                        fields,
                    });
                }
            });
        }, 0);
    });
}

function DBPusat(query, queryvalue) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            connpusat.query(query, queryvalue, function (error, rows, fields) {
                if (error) {
                    err = "Error mysql -> " + error + " <- " + this.sql;
                    reject(err);
                } else {
                    resolve({
                        rows,
                        fields,
                    });
                }
            });
        }, 0);
    });
}

function dumpError(req, res) {
    if (typeof err === "object") {
        if (err) {
            console.log(err);
            console.log("\nMessage: " + err);
        }
        if (err.stack) {
            console.log("\nStacktrace:");
            console.log("====================");
            console.log(err.stack);
        }
    } else {
        console.log(err);
    }
}

async function starttransaction() {
    await queryDB("START TRANSACTION", "").then(async function () { });
}

async function commit() {
    await queryDB("COMMIT", "").then(async function () { });
}

async function rollback() {
    await queryDB("ROLLBACK", "").then(async function () { });
}

function dateTimeToMYSQL(datx) {
    var d = new Date(datx),
        month = "" + (d.getMonth() + 1),
        day = d.getDate().toString(),
        year = d.getFullYear(),
        hours = d.getHours().toString(),
        minutes = d.getMinutes().toString(),
        secs = d.getSeconds().toString();
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    if (hours.length < 2) hours = "0" + hours;
    if (minutes.length < 2) minutes = "0" + minutes;
    if (secs.length < 2) secs = "0" + secs;
    return [year, month, day].join("-");
    // + ' ' + [hours, minutes, secs].join(':');
}

async function GetError(e) {
    dumpError(e);
    let error = e.toString();
    error.substr(0, 11) === "Error mysql" ? (error = e) : (error = e.message);
    return error;
}

var storage = multer.diskStorage({
    destination: async (req, file, callback) => {
        const SEE_FOTO = await queryDB(`SELECT nama FROM alamat_fhoto WHERE kategori='REFUND'`);
        if (SEE_FOTO.rows.length === 0) {
            return response.ok(
                {
                    status: "GAGAL",
                    pesan: "Alamat file untuk refund belum terdaftar, silahkan hubungi bagian IT! ",
                },
                300,
                res
            );
        }
        let alamat_foto = SEE_FOTO.rows[0].nama;
        callback(null, alamat_foto);
    },
    filename: function (req, file, callback) {
        callback(null, req.params.norefund + file.fieldname + ".JPG");
        console.log(file.fieldname + ".JPG");
    },
});
const fileFilter = function (req, file, cb) {
    if (file.fieldname === file.fieldnamele) {
        if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/)) {
            req.fileValidationError = {
                message: "Only image files are allowed",
            };
            return cb(new Error("Only image files are allowed"), false);
        }
    }
    cb(null, true);
};

const sizeInMB = 10;
const maxSize = sizeInMB * 1000 * 1000;
var uploadRefund = multer({
    storage,
    fileFilter,
    limits: { filesize: maxSize },
});

const copyFile = async (file, src, destination) => {
    smb2Client.readFile(`${src}${file}`, function (err, data) {
        if (err) throw err;
        fs.writeFile(`${destination}\\${file}`, data, (err) => {
            if (err) throw err;
        });
    });
};

const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    store: new MemoryStore(),
    message: "Too many clicked from this IP, please try again after an hour",
});

const options = {
    timeout: 3000, // If our function takes longer than 1 millisecond, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
    resetTimeout: 30000, // After 30 seconds, try again.
};

const circuit = (asyncFunctionThatCouldFail) => {
    const breaker = new circuitBreaker(asyncFunctionThatCouldFail, options);
    breaker.fallback(() => "Sorry, out of service right now");
    breaker.fire().then(console.log).catch(console.error);
};

module.exports = {
    queryDB: queryDB,
    DBPusat: DBPusat,
    starttransaction: starttransaction,
    commit: commit,
    rollback: rollback,
    dumpError: dumpError,
    dateTimeToMYSQL: dateTimeToMYSQL,
    GetError: GetError,
    uploadRefund,
    copyFile,
    apiLimiter,
    apiAsana,
    authAsana,
    options,
    circuit,
    get,
    set,
    del,
    setex,
    ipMiddleware
};
