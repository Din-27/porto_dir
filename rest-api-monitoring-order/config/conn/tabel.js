"use strict";

var fs = require("fs");
var connection = require('./conn');
var response = require("../res/res");
const { promisify } = require("util");
var err = "";

const redis = require('redis')

let redisClient;
redisClient = redis.createClient({ url: process.env.URL_REDIS });
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


module.exports = {
  queryDB: queryDB,
  DBPusat: DBPusat,
  starttransaction: starttransaction,
  commit: commit,
  rollback: rollback,
  dumpError: dumpError,
  dateTimeToMYSQL: dateTimeToMYSQL,
  GetError: GetError,
  del, get, set, setex
};
