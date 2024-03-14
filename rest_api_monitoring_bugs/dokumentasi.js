require("dotenv").config();

var express = require('express')
var app = express()
var cors = require('cors');
var cluster = require('cluster')
var bodyParser = require('body-parser');
var numCPUs = require('os').cpus().length
var routes = require('./src/routes/routes');
var server = require("http").createServer(app);

var port = process.env.PORT || 8000

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
const io = require('socket.io')(server, { cors: { origin: "*" } });
const SocketRouter = require('./src/routes/socketRouter')(io)

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log(`${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`)
});

routes(app);
app.use(SocketRouter)

server.listen(port, () =>
    console.log(`dokumentasi:${port} || ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`));