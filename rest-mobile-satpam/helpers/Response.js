const response = require("../config/res/res");


exports.ResponseErrorService = (res) => {
    response.ok({ message: 'ERROR SERVICE' }, 505, res)
    return
}
exports.ResponseError = (msg, res) => {
    response.ok({ message: msg }, 403, res)
    return
}