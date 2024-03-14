var express = require('express')
var app = express()
var cors = require('cors');
var bodyParser = require('body-parser');
const router = require('./src/routes/routes');
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
global.io = io;

require('dotenv').config()
var port = process.env.PORT || 8979

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use('/sku/master_data_sortir', router)
app.use("/xlsx", express.static("xlsx"));


app.listen(port, () =>
    console.log(`server:${port} || ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`));