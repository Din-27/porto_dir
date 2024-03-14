const { queryDB, dumpError } = require('../../../config/conn/tabel')
const response = require('../../../config/res/res')
const jwt = require('jsonwebtoken');
require('dotenv').config()

exports.handleLogin = async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        //
        const GET_USER = await queryDB(`select id_user, username, password, hint_password from user where aktif=1 and lower(username)=? and password=md5(?)`,
            [username.toLowerCase(), password.toLowerCase()]);
        //
        if (GET_USER.rows.length == 0) {
            return response.ok({ status: "GAGAL", pesan: "username atau password salah", }, 300, res);
        } else {
            const tokenKey = jwt.sign({ id: GET_USER.rows[0].id_user }, process.env.TOKEN_KEY);
            var status = 200;
            return response.ok({ status: "SUKSES", username, secretkey: tokenKey, }, status, res)
        }
    } catch (e) {
        dumpError(e);
        console.log(e)
        return response.ok({ status: "GAGAL", error: e.message, }, 300, res)
    }
}