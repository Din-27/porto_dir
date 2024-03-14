var connection = require("../conn/conn");
const winston = require('winston')
const Transport = require('winston-transport');


exports.ok = async (values, status, res) => {
  var data = {
    status: status,
    values: values,
  };
  var msg = data.values.pesan
  const temp = res.req.url.split("/").slice(-1);
  let handle = {
    host: res.req.rawHeaders,
    method: res.req.method,
    url: res.req.url,
    file: __dirname.slice(0, -4) + res.req.url + ".js",
  };
  if (data.values.status === 'GAGAL') {
    await connection.query(`INSERT INTO monitor_log_error VALUES(?, ?, ?, NOW())`, [
      handle.file,
      handle.url,
      JSON.stringify(msg) + msg,
    ]);
    return res.json(data);
  }
  return res.json(data);
};
