const jwt = require("jsonwebtoken");
const response = require("../res/res");
const { queryDB, dumpError } = require("../conn/tabel");

exports.login_user = async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const GET_USER = await queryDB(`select id_user, username, password, hint_password from user where aktif=1 and username=? and password=md5(?)`, [username, password]);
    if (GET_USER.rows.length == 0) {
      return response.ok(
        {
          status: "GAGAL",
          pesan: "username atau password salah",
        },
        300,
        res
      );
    } else {
      const tokenKey = jwt.sign({ id: GET_USER.rows[0].id_user }, process.env.JWT_SECRET_KEY);
      var status = 200;
      return response.ok(
        {
          status: "SUKSES",
          username,
          secretkey: tokenKey,
        },
        status,
        res
      );
    }
  } catch (e) {
    dumpError(e);
    return response.ok(
      {
        status: "GAGAL",
        pesan: e.message,
      },
      300,
      res
    );
  }
};
