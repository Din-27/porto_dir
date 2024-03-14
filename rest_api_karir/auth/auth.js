const jwt = require('jsonwebtoken');
const { dumpError } = require('../config/conn/tabel');

exports.auth = async (req, res, next) => {
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
        return res.status(400).send({ message: 'Invalid token' })
    }
};