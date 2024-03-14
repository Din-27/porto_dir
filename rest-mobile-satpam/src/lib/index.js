const { default: fetch } = require("node-fetch");
const { networkInterfaces } = require('os')
const localip = Object.values(networkInterfaces()).flat().find((i) => i?.family === 'IPv4' && !i?.internal)?.address;

const triggerPrint = async (props) => {
    return new Promise(async (resolve, reject) => {
        try {
            await fetch(`http://${localip}:8134/appupdater/cetak/TambahCetak`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jenis: props.jenis,
                    parameter: JSON.stringify(props.parameter),
                    id_karyawan: props.id_user || props.id_karyawan
                })
            })
                .then((res) => {
                    return res.json()
                })
                .then(async function (json) {
                    resolve(json);
                });
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = {
    triggerPrint,
}