const jwt = require("jsonwebtoken");
const response = require("../../config/res/res");
const { queryDB } = require("../../config/conn/tabel");

exports.login = async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const GET_USER = await queryDB(
            `select * from user where username=? and password=md5(?) and aktif='1'`,
            [username, password]
        );
        if (GET_USER.rows.length === 0) {
            return response.ok(
                { status: "GAGAL", pesan: "Password  Salah!" },
                200,
                res
            );
        } else {
            const tokenKey = jwt.sign(
                { id: GET_USER.rows[0].id_user },
                process.env.TOKEN_KEY
            );
            var status = 200;
            console.log(tokenKey)
            return response.ok(
                { status: "SUKSES", username, secretkey: tokenKey },
                status,
                res
            );
        }
    } catch (e) {
        dumpError(e);
        return response.ok(
            { status: "Ada kesalahan sistem silahkan coba lagi!", pesan: e.message },
            200,
            res
        );
    }
};
