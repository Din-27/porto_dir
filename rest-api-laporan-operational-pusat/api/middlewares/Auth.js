/* eslint-disable no-undef */
const { verify } = require("jsonwebtoken")
const { DumpError } = require("../../helpers/SqlCoreModule");
const { ResponseUnAuthorized } = require("../../helpers/ResponseCoreModule");

exports.Auth = async (req, res, next) => {
    const authHeader = req.header("Authorization")
    const token = authHeader && authHeader.split(' ')[1]
    if (!authHeader) {
        return ResponseUnAuthorized(res)
    }
    try {
        const verified = verify(String(token), process.env.TOKEN_KEY)
        res.set('user', String(verified));
        return next()
    } catch (error) {
        DumpError(new Error(String(error)))
        return ResponseUnAuthorized(res, 'Invalid API KEY !')
    }
}; 