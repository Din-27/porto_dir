require('dotenv').config()

const fetchData = (getSoal) => {
    return getSoal.rows.map((x, y) => {
        return {
            no: `${y + 1}. ${process.env.EXPOSED_HOST}/SOALTIU/${x.soal}`,
            options: [
                `1. ${process.env.EXPOSED_HOST}/SOALTIU/${x.jawaban_a.slice(3)}`,
                `2. ${process.env.EXPOSED_HOST}/SOALTIU/${x.jawaban_b.slice(3)}`,
                `3. ${process.env.EXPOSED_HOST}/SOALTIU/${x.jawaban_c.slice(3)}`,
                `4. ${process.env.EXPOSED_HOST}/SOALTIU/${x.jawaban_d.slice(3)}`,
                `5. ${process.env.EXPOSED_HOST}/SOALTIU/${x.jawaban_e.slice(3)}`
            ]
        }
    })
}

module.exports = { fetchData }