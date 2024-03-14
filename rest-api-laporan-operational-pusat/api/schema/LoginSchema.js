exports.RequestLoginSchema = {
    type: "object",
    properties: {
        username: { type: "string", nullable: false },
        password: { type: "string", nullable: false }
    },
    required: ["username", "password"],
    additionalProperties: false
}

exports.ResponseLoginSchema = {
    type: "object",
    properties: {
        nama: { type: "string", nullable: false },
        username: { type: "string", nullable: false },
        token: { type: "string", nullable: false }
    },
    required: ["nama", "username", "token"],
    additionalProperties: false
}