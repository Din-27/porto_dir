const Ajv = require("ajv")
const ajv = new Ajv()

exports.ValidateSchema = (Schema, dataDto) => {

    const validate = ajv.compile(Schema)
    switch (Boolean(validate(dataDto))) {
        case true:
            return {
                validate: true,
                data: dataDto
            }
        default:
            return {
                validate: false,
                data: validate.errors[0].message
            }
    }
}