const jwt = require('jsonwebtoken');
const { dumpError } = require('../config/conn/tabel');

exports.isAuthorized = async (req, res, next) => {
    const authHeader = req.header("Authorization")
    const token = authHeader && authHeader.split(' ')[1]
    if (!authHeader) {
        return res.status(401).send({ message: "Access denied" })
    }
    try {
        const verified = jwt.verify(token, process.env.TOKEN_KEY)
        req.user = verified
        return next()
    } catch (error) {
        dumpError(error)
        if(error.message === 'jwt expired'){
            return res.status(300).send({status : 'GAGAL', pesan : 'test hanya berlaku sehari setelah login, mohon untuk login kembali menggunakan email baru !'})
        }
        return res.status(400).send({ message: error.message })
    }
};
