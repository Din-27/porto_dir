'use strict'

const assert = require('assert-plus')
const fs = require('fs')

const logLocation = 'logs'
const fileName = 'rest_api_mobile_satpam_log'

class Logger {
    constructor() {
        this.log = console.log
        this.fileStream = function (data) {
            if (!fs.existsSync(logLocation)) {
                fs.mkdirSync(logLocation)
            }

            let date = new Date()
            date = date.toISOString().split('T')[0]

            return fs.appendFileSync(`${logLocation}/${fileName}_${date}`, data + '\n')
        }
    }

    info(message, context) {
        assert.string(message)
        assert.optionalObject(context)

        const data = JSON.stringify({
            level: 'info',
            timestamp: new Date(),
            message,
            context
        })

        this.fileStream(data)
        // this.log(data)

        return null
    }

    error(message, context, err) {
        assert.string(message)
        assert.object(err)
        assert.optionalObject(context)

        const data = JSON.stringify({
            level: 'error',
            timestamp: new Date(),
            message,
            context
        })

        this.fileStream(data)
        this.log(data)

        return null
    }
}

module.exports = Logger