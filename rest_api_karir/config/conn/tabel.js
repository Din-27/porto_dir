"use strict";

var fs = require("fs");
require('dotenv').config()
var connection = require('./conn');
var response = require("../res/res");
var multer = require("multer");
var err = "";
var apiAsana = process.env.API_ASANA;
var dirRefund = "./fhoto/refund/";
var authAsana = { Authorization: process.env.TOKEN_ASANA };
const { google } = require("googleapis")
const { Base64 } = require("js-base64")
const gmail = google.gmail("v1");
const token = require("../../token.json");
const credentials = require("../../credentials.json");
const jwt = require("jsonwebtoken")
const multerS3 = require('multer-s3')
const { S3Client } = require('@aws-sdk/client-s3')
const s3 = new S3Client({
  region: "us-east-1",
  endpoint: {
    protocol: "http",
    hostname: process.env.S3_HOST,
    port: 80,
  },
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
})


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

const decodedToken = (req) => {
  const authHeader = req.header("Authorization")
  const token = authHeader && authHeader.split(' ')[1]
  const decoded = jwt.verify(token, process.env.TOKEN_KEY)
  return decoded
}

const sizeInMB = 10;
const maxSize = sizeInMB * 1000 * 1000;
var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'knitto-karir',
    metadata: async (req, file, callback) => {
      callback(null, { fieldname: file.fieldname });
    },
    key: async function (req, file, callback) {
      const { identitas } = decodedToken(req)
      const getName = await queryDB(`select nama_lengkap from identitas_pelamar where id_identitas=?`, [identitas])
      console.log(getName.rows)
      callback(null, Date.now() + '-' + getName.rows[0]?.nama_lengkap + '-' + file.fieldname + '-' + file.originalname.replace(/\s/g, ""))
    }
  }),
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

const oAuth2Client = new google.auth.OAuth2(
  credentials.installed.client_id,
  credentials.installed.client_secret,
  credentials.installed.redirect_uris[0]
);

oAuth2Client.setCredentials(token);

const makeBody = (
  to,
  from,
  replyTo,
  subject,
  message,
) => {
  const str = [
    'Content-Type:  text/html;\n',
    "MINE-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    `to: ${to} \n`,
    `from: ${from} \n`,
    `Reply-To: ${replyTo}\n`,
    `subject:${subject} \n\n`,
    message
  ].join("");

  const encodedMail = Base64.encodeURI(str);
  return encodedMail;
};

const sendMessage = (
  to,
  from,
  replyTo,
  subject,
  token
) => {
  const message = `<html>
            <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <style type="text/css" rel="stylesheet" media="all">
            @media only screen and (max-width: 600px) {
            .email-body_inner,
            .email-footer {
                width: 100% !important;
            }
            }
            @media only screen and (max-width: 500px) {
            .button {
                width: 100% !important;
            }
            }
            </style>
            </head>
            <body dir="ltr" style="height: 100%; margin: 0; line-height: 1.4; background-color: #F2F4F6; color: #74787E; -webkit-text-size-adjust: none; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box; width: 100%;">
            <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box; width: 100%; margin: 0; padding: 0; background-color: #F2F4F6;" bgcolor="#F2F4F6">
                <tr>
                <td align="center" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box;">
                    <table class="email-content" width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box; width: 100%; margin: 0; padding: 0;">
                    <!-- Logo -->
                    <tr>
                        <td class="email-masthead" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box; padding: 25px 0; text-align: center;" align="center">
                        <a class="email-masthead_name" href="https://knitto.co.id/" target="_blank" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box; font-size: 16px; font-weight: bold; color: #2F3133; text-decoration: none; text-shadow: 0 1px 0 white;">
                                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBVQx3nPZbU8Eojvn8RwlB83qWecqu9VZwpA&usqp=CAU" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box; height: 50px;" alt height="50">
                            </a>
                        </td>
                    </tr>
                    <!-- Email Body -->
                    <tr>
                        <td class="email-body" width="100%" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box; width: 100%; margin: 0; padding: 0; border-top: 1px solid #EDEFF2; border-bottom: 1px solid #EDEFF2; background-color: #FFF;" bgcolor="#FFF">
                        <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box; width: 570px; margin: 0 auto; padding: 0;">
                            <!-- Body content -->
                            <tr>
                            <td class="content-cell" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box; padding: 35px;">
                                <h1 style="margin-top: 0; color: #2F3133; font-size: 19px; font-weight: bold; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box;">Hi, ${to.slice(0, -10)}</h1>
                                    <p style="margin-top: 0; color: #74787E; font-size: 16px; line-height: 1.5em; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box;">Welcome to Knitto Careers! We're very excited to have you on board.</p>
                                <!-- Dictionary -->
                                <!-- Table -->
                                <!-- Action -->
                                    <p style="margin-top: 0; color: #74787E; font-size: 16px; line-height: 1.5em; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box;">To get started the test, please click here:</p>
                                    <!--[if mso]>
                                    <center>
                                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://knitto.co.id/" style="height: 45px; v-text-anchor: middle; width: 200px;" arcsize="10%" stroke="f" fillcolor="#2f3574">
                                            <w:anchorlock/>
                                            <center style="color: #ffffff; font-family: sans-serif; font-size: 15px;">
                                                Link Test
                                            </center>
                                            </v:roundrect>
                                    </center>
                                    <![endif]-->
                                    <![if !mso]>
                                    <table class="body-action" align="center" cellpadding="0" cellspacing="0" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box; width: 100%; margin: 30px auto; padding: 0; text-align: center;" width="100%">
                                        <tr>
                                            <td align="center" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box;">
                                            <a href='${process.env.RECRUITMENT_WEBSITE_URL}/data-employee?page=${token}' class="button" target="_blank" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box; display: inline-block; width: 200px; border-radius: 3px; color: #ffffff; font-size: 15px; line-height: 45px; text-align: center; text-decoration: none; -webkit-text-size-adjust: none; mso-hide: all; background-color: #2f3574;">
                                                Link Test
                                            </a>
                                            </td>
                                        </tr>
                                    </table>
                                    <![endif]>
                                <!-- Support for Gmail Go-To Actions -->
                                    <p style="margin-top: 0; color: #74787E; font-size: 16px; line-height: 1.5em; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box;">Need help, or have questions? Just reply to this email, we'd love to help.</p>
                                <p style="margin-top: 0; color: #74787E; font-size: 16px; line-height: 1.5em; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box;">
                                    Yours truly,
                                    <br>
                                    HR Knitto
                                </p>
                            </td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box;">
                        <table class="email-footer" align="center" width="570" cellpadding="0" cellspacing="0" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box; width: 570px; margin: 0 auto; padding: 0; text-align: center;">
                            <tr>
                            <td class="content-cell" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box; padding: 35px;">
                                <p class="sub center" style="margin-top: 0; line-height: 1.5em; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-box-sizing: border-box; box-sizing: border-box; color: #AEAEAE; font-size: 12px; text-align: center;">
                                Copyright © 2022 Knitto. All rights reserved.
                                </p>
                            </td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                    </table>
                </td>
                </tr>
            </table>
            </body>
            </html>`
  const raw = makeBody(to, from, replyTo, subject, message);
  return gmail.users.messages.send({
    auth: oAuth2Client,
    userId: "me",
    requestBody: { raw },
  });
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
  apiAsana,
  authAsana,
  options,
  circuit,
  sendMessage,
  decodedToken
};
