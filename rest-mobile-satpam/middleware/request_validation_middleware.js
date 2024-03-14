"use strict";

const Logger = require("../utils/init_logger");
const logger = new Logger("dev");

module.exports = (validations) => {
  const { res, next } = validations;
  // console.log("res", res)
  // return async (req, res, next) => {
  // console.log("Promise")

  // await Promise.all(validations.map(validation => validation.run(req)));
  // console.log("req", req)

  logger.info("Incoming request", {
    clientIp: res.req.clientIp,    
    method: validations.method,
    url: validations.url,
    params: validations.params,
    query: validations.query,
    headers: validations.headers,
    body: validations.body,
    // host: validations.host
  });

  return next();
  // }
};
