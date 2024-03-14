// const { existsSync, mkdirSync } = require("fs");
// const { join } = require("path");
// const rfs = require("rotating-file-stream");
// const logDirectory = join(__dirname, "axiosLogs");

// const initializeAxiosLogger = (axios) => {
//   existsSync(logDirectory) || mkdirSync(logDirectory);

//   const reqLogStream = rfs.createStream("requests.log", {
//     interval: "1d", // New log file daily
//     path: logDirectory,
//   });
//   const resLogStream = rfs.createStream("responses.log", {
//     interval: "1d", // New log file daily
//     path: logDirectory,
//   });

//   axios.interceptors.request.use((request) => {
//     const logMsgJSON = {
//       timestamp: new Date(),
//       method: request.method.toUpperCase(),
//       url: request.url,
//       body: request.data,
//       headers: makeHeaders(request.headers),
//     };
//     const logMsg = JSON.stringify(logMsgJSON) + ",\n";
//     reqLogStream.write(logMsg);
//     return request;
//   });
//   axios.interceptors.response.use((response) => {
//     const logMsgJSON = {
//       timestamp: new Date(),
//       method: response.config.method.toUpperCase(),
//       url: response.config.url,
//       status: [response.status, response.statusText],
//       requestBody: response.config.data ? JSON.parse(response.config.data) : {},
//       responseBody: response.data,
//       requestHeaders: makeHeaders(response.config.headers),
//       responseHeaders: makeHeaders(response.headers),
//     };
//     const logMsg = JSON.stringify(logMsgJSON) + ",\n";
//     resLogStream.write(logMsg);
//     return response;
//   });
// };

// module.exports = initializeAxiosLogger;

// const filteredHeaderList = [
//   "common",
//   "delete",
//   "get",
//   "head",
//   "post",
//   "put",
//   "patch",
//   "content-type",
//   "content-length",
//   "vary",
//   "date",
//   "connection",
//   "content-security-policy",
// ];

// const makeHeaders = (headers) => {
//   const headerMap = {};
//   for (let key in headers) {
//     if (!filteredHeaderList.includes(key)) {
//       headerMap[key] = headers[key];
//     }
//   }

//   return headerMap;
// };

// const makeBody = (body) => {
//   const str = typeof body === `string` ? body : body || {};
//   return str;
// };
