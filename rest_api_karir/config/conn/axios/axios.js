const axios = require('axios')
const initializeAxiosLogger = require('../axiosLogger')

const API = async (method, url, header, body) => {
    const result = await axios({
        method: method,
        url: url,
        headers: header,
        body: body
    })
    return result
}

// initializeAxiosLogger(axios)

module.exports = { API }