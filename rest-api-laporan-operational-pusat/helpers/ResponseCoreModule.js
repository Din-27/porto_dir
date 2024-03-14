const { DumpError } = require("./SqlCoreModule")
// const { ValidateSchema } = require("./ValidateSchema")

exports.ResponseOk = ({ dataParams, res }) => {
    // if (schema) {
    //     const { validate, data } = ValidateSchema(schema, dataParams)
    //     if (!validate) return this.ResponseNetworkError(data, res)
    // }
    return res.status(200).send({
        status: 'SUCCESS',
        message: dataParams
    })
}

exports.ResponseError = (data, res) => {
    if (data) {
        console.log(data);
        return res.status(400).send({
            status: 'FAILED',
            message: data
        })
    }
    return this.ResponseNetworkError('Parameter data is null! ERROR', res)
}

exports.ResponseUnAuthorized = (res, data) => {
    DumpError(data)
    console.log(new Error(data));
    return res.status(401).send({
        status: 'FAILED',
        message: "Error Unauthorized !"
    })
}

exports.ResponseNetworkError = (data, res) => {
    if (data) {
        DumpError(data)
        console.log(new Error(data));
        return res.status(500).send({
            status: 'NETWORK ERROR',
            message: 'Errors from the Server !'
        })
    }
    DumpError(new Error('Parameter data is null!, NetworkError'))
    return this.ResponseNetworkError('Parameter data is null!', res)
}