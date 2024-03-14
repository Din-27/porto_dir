const { dumpError } = require("../conn/tabel")
const jwt = require('jsonwebtoken')

exports.auth = async (req, res, next) => {
    const authHeader = req.header("Authorization")
    const token = authHeader && authHeader.split(' ')[1]
    if (!authHeader) {
        return res.status(401).send({ message: "Access denied" })
    }
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET_KEY)
        req.user = verified
        return next()
    } catch (error) {
        dumpError(error)
        return res.status(400).send({ message: 'Invalid token' })
    }
};