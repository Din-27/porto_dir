const lodash = require('lodash')
const response = require('../res/res')
const { API } = require('../conn/axios/axios')
const { apiAsana, authAsana } = require('../conn/tabel')
const { dumpError, queryDB, get, set, del } = require('../conn/tabel')

const current = new Date()
const month = new Date().getMonth()
const years = current.getFullYear()
const first = current.getDate() - current.getDay()
const last = first + 6
const firstday = new Date(current.setDate(first)).getDate()
const lastday = new Date(current.setDate(last)).getDate()

let results

exports.sistem_monitor = async (req, res) => {
    try {
        let responseCode
        let responseStatus
        let loopNameSistem

        const key = 'sistem_monitor'
        const cacheResults = await get(key)
        const GET_BUGS = await queryDB(`SELECT nb.nama_kategori, 
        nb.nama_sistem, kategori FROM notifikasi_bugs_sistem nb JOIN 
        kategori_sistem ks USING(nama_kategori) WHERE nb.status_sistem=0 AND ks.status_kategori=0`)

        const data = lodash(GET_BUGS.rows).groupBy('nama_kategori').map((item, name) => {
            return {
                nama_kategori: name,
                item
            }
        }).value()

        loopNameSistem = data === JSON.parse(cacheResults)
        if (cacheResults === true) {
            if (loopNameSistem === true) {
                isCached = true
                results = JSON.parse(cacheResults);
            } else {
                await del(key);
                await set(key, JSON.stringify(data));
                results = data
            }
        } else {
            results = data;
            if (results.length === 0) {
                throw "API returned an empty array";
            }
            await set(key, JSON.stringify(results));
        }
        return response.ok({
            status: responseStatus,
            pesan: results
        }, responseCode, res)
    } catch (e) {
        dumpError(e)
        return response.ok({
            status: 'GAGAL',
            pesan: e.message
        }, 300, res)
    }
}

//endpoint individu, memiliki 1 macam data 
const add_task_automatically = async () => {
    try {
        const data = await API('get', apiAsana + `/sections/1202485508633892/tasks`, authAsana)
        const getApi = data.data.data
        getApi.map(async (x) => {
            const CHECKING = await queryDB(`select * from bugs_tim_developer where no_gid=?`, [x.gid])
            if (CHECKING.rows.length === 0) {
                await queryDB('insert into bugs_tim_developer values(?, ?, now())', [x.gid, x.name])
            }
        })
    } catch (e) {
        dumpError(e)
        console.log(e)
    }
}

const startAddTask = () => {
    setInterval(async () => {
        add_task_automatically()
    }, 3000)
}
// console.log(startAddTask())
startAddTask()