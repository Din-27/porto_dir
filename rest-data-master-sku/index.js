var express = require('express')
var app = express()
var cors = require('cors');
const router = require('./src/routes/routes');
require('dotenv').config()
var port = process.env.PORT || 8979

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/sku/master_data_sortir', router)
app.use("/xlsx", express.static("xlsx"));


app.listen(port, () =>
    console.log(`server:${port} || ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`));