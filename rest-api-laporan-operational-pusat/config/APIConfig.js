/* eslint-disable no-undef */
const { default: axios } = require("axios");
const { IP } = require("../constant/IP");

exports.ChangeIP = (cabang) => {
    const getIP = IP[Object.keys(IP).filter(x => x.includes(cabang || 'HOLIS'))]
    return getIP
}

exports.API = async ({ address, method, append }) => {
    const getToken = await axios.post(`http://${IP.HOLIS}:8522/api/v1/laporan/marketing/login`, {
        "username": process.env.CABANG_USER,
        "password": process.env.CABANG_PASS
    })
    const data = await axios({
        url: `http://${address}:8522/api/v1/laporan/marketing${append}`,
        method: method,
        headers: {
            API_KEY: getToken.data.message.token
        }
    })
    return data
}

// Set Authorization Token Header
// exports.setAuthToken = async () => {
//     const getToken = await this.API('192.168.20.25', 'post', '/login', {
//         "username": process.env.CABANG_USER,
//         "password": process.env.CABANG_PASS
//     })
//     return console.log(getToken);
//     const token = getToken.data.message.token
//     if (token) {
//         this.API.defaults.headers.common["API_KEY"] = token;
//     } else {
//         delete this.API.defaults.headers.commin["API_KEY"];
//     }
//     return token
// };