const jwt = require('jsonwebtoken')
const { DumpError, queryDB } = require('../../helpers/SqlCoreModule');
const { ValidateSchema } = require('../../helpers/ValidateSchema');
const { RequestLoginSchema, ResponseLoginSchema } = require('../schema/LoginSchema');
const { ResponseError, ResponseNetworkError, ResponseOk } = require('../../helpers/ResponseCoreModule');

exports.LoginServiceModule = async (req, res) => {
    const { username, password } = req.body
    const { validate, data } = ValidateSchema(RequestLoginSchema, req.body)
    if (!validate) return ResponseNetworkError(data, res)
    try {
        await queryDB(`select id_user,nama, username from user where password=md5(?) and username=?`,
            [password, username]).then(({ rows }) => {
                if (rows.length === 0) {
                    return ResponseError('email and password not match', res)
                }
                // eslint-disable-next-line no-undef
                const token = jwt.sign({ id: rows[0].id_user, username }, process.env.TOKEN_KEY)
                return ResponseOk({
                    dataParams: {
                        ...rows.map(x => {
                            return {
                                nama: x.nama,
                                username: x.username
                            }
                        })[0], token: token
                    }, schema: ResponseLoginSchema, res
                })
            })
    } catch (e) {
        DumpError(e)
        return ResponseNetworkError(e.message, res)
    }
}