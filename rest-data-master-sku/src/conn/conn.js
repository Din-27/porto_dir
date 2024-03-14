
var mysql = require('mysql');
require('dotenv').config()
var db_config = {
  connectTimeout: 10000,
  waitForConnections: 10000,
  connectionLimit: 100,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  multipleStatements: true
};

function handleDisconnect() {
  connection = mysql.createPool(db_config);
  connection.getConnection(function (err, connection) {
    if (err) {
      connection.release();
      throw err;
    }

    connection.release()
  })

  module.exports = connection;
}

handleDisconnect();
