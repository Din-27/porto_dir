"use strict";

var fs = require("fs");
require("dotenv").config();
var multer = require("multer");
var connection = require("./conn");
const jwt = require("jsonwebtoken");
var response = require("../res/res");
var nodemailer = require("nodemailer");
var err = "";

function queryDB(query, queryvalue) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      connection.query(query, queryvalue, async function (error, rows, fields) {
        await connection.query(`FLUSH HOSTS;`);
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

function dumpError(err) {
  if (typeof err === 'object') {
    if (err.message) {
      console.log('\nMessage: ' + err.message)
    }
    if (err.stack) {
      console.log('\nStacktrace:')
      console.log('====================')
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

function GetError(e) {
  dumpError(e)
  let error = e.toString()
  error.substr(0, 11) === "Error mysql" ? error = e : error = e.message
  return error
}
var storage = multer.diskStorage({
  destination: async (req, file, callback) => {
    const SEE_FOTO = await queryDB(
      `SELECT nama FROM alamat_fhoto WHERE kategori='REFUND'`
    );
    if (SEE_FOTO.rows.length === 0) {
      return response.ok(
        {
          status: "GAGAL",
          pesan:
            "Alamat file untuk refund belum terdaftar, silahkan hubungi bagian IT! ",
        },
        300,
        res
      );
    }
    let alamat_foto = SEE_FOTO.rows[0].nama;
    callback(null, __dirname.slice(0, -11) + "uploads");
  },
  filename: async function (req, file, callback) {
    const getName = await queryDB(
      `select nama_lengkap from identitas_pelamar where id_identitas=?`,
      [req?.cookies?.identitas]
    );
    callback(
      null,
      Date.now() +
      "-" +
      getName.rows[0]?.nama_lengkap +
      "-" +
      file.fieldname +
      "-" +
      file.originalname.replace(/\s/g, "")
    );
  },
});

const fileFilter = function (req, file, cb) {
  if (file.fieldname === file.fieldname) {
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
var upload = multer({
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
  upload,
  copyFile,
  options,
  circuit,
  decodedToken,
  // del, get, set, setex
};
