var mysql = require("mysql");
// const process = require("../../../connections/componentAddress");

var db_config = {
  connectionLimit: 50,
  connectTimeout: 60 * 60 * 1000,
  acquireTimeout: 60 * 60 * 1000,
  timeout: 60 * 60 * 1000,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  multipleStatements: true,
};

function handleDisconnect() {
  connection = mysql.createPool(db_config);
  connection.getConnection(function (err, connection) {
    if (err) {
      connection.release();
      throw err;
    }

    connection.release();
  });

  module.exports = connection;
}

handleDisconnect();
