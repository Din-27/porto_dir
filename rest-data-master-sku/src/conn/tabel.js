"use strict";
var jwt = require("jsonwebtoken");
var response = require("../res/res");
var multer = require("multer");
const circuitBreaker = require("opossum");
var { rateLimit, MemoryStore } = require('express-rate-limit')
var err = "";


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
                        fields
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

const uploadFile = (excelFile) => {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "xlsx")
        },
        filename: function (req, file, cb) {
            cb(null, 'excel.xlsx')
        }
    })
    const fileFilter = function (req, file, cb) {
        if (file.fieldname === excelFile) {
            if (!file.originalname.match(/\.(xlsx|XLSX|xls|XLS)$/)) {
                req.fileValidationError = {
                    message: "Only excel files are allowed"
                }
                return cb(new Error("Only excel files are allowed"), false)
            }
        }
        cb(null, true)
    }

    const sizeInMB = 10
    const maxSize = sizeInMB * 1000 * 1000

    const upload = multer({
        storage,
        fileFilter,
        limits: {
            fileSize: maxSize
        }
    }).single(excelFile)

    return (req, res, next) => {
        upload(req, res, function (err) {
            if (req.fileValidationError)
                return res.status(400).send(req.fileValidationError)

            if (!req.file && !err)
                return res.status(400).send({
                    message: "Please select files to upload"
                })

            if (err) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).send({
                        message: "Max file size 10MB"
                    })
                }
                return res.status(400).send(err)
            }

            return next()
        })
    }
};

const uploadFilePiket = (excelFile) => {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "xlsx")
        },
        filename: function (req, file, cb) {
            cb(null, 'excel_piket.xlsx')
        }
    })
    const fileFilter = function (req, file, cb) {
        if (file.fieldname === excelFile) {
            if (!file.originalname.match(/\.(xlsx|XLSX|xls|XLS)$/)) {
                req.fileValidationError = {
                    message: "Only excel files are allowed"
                }
                return cb(new Error("Only excel files are allowed"), false)
            }
        }
        cb(null, true)
    }

    const sizeInMB = 10
    const maxSize = sizeInMB * 1000 * 1000

    const upload = multer({
        storage,
        fileFilter,
        limits: {
            fileSize: maxSize
        }
    }).single(excelFile)

    return (req, res, next) => {
        upload(req, res, function (err) {
            if (req.fileValidationError)
                return res.status(400).send(req.fileValidationError)

            if (!req.file && !err)
                return res.status(400).send({
                    message: "Please select files to upload"
                })

            if (err) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).send({
                        message: "Max file size 10MB"
                    })
                }
                return res.status(400).send(err)
            }

            return next()
        })
    }
};

const decodedToken = (req) => {
    const authHeader = req.header("Authorization");
    const token = authHeader && authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    return decoded;
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
    uploadFile,
    uploadFilePiket,
    decodedToken
};
