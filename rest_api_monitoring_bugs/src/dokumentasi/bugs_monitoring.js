const response = require('../res/res')
const { API } = require('../conn/axios/axios')
const { dumpError } = require('../conn/tabel')
const { apiAsana, authAsana } = require('../conn/tabel')


exports.bugs_belum_diproses = async (req, res) => {
    try {
        const getDataTechnicalSupport = await API('get', apiAsana + `/sections/1202485483189137/tasks`, authAsana)
        const getDataBelumDiproses = await API('get', apiAsana + `/sections/1202485508633892/tasks`, authAsana)
        const getDataSistemAnalis = await API('get', apiAsana + `/sections/1202485508633890/tasks`, authAsana)
        const getDataProgrammer = await API('get', apiAsana + `/sections/1202485508633892/tasks`, authAsana)
        return response.ok({
            status: 'SUKSES',
            pesan: {
                bugsBelumDiproses: getDataBelumDiproses.data.data.length,
                bugsDitanganiTechnicalSupport: getDataTechnicalSupport.data.data.length,
                bugsDitanganiSistemAnalis: getDataSistemAnalis.data.data.length,
                bugsDitanganiTimIT: getDataProgrammer.data.data.length
            }
        }, 200, res)
    } catch (e) {
        dumpError(e)
        return response.ok({
            status: 'GAGAL',
            pesan: e.message
        }, 300, res)
    }
}
