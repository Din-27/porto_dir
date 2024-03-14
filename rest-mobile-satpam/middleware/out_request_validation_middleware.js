'use strict'

const Logger = require('../utils/init_logger')
const logger = new Logger('dev')

module.exports = (validations, err) => {
    if (err) {
        logger.error('Outgoing request', {
            method: validations.method,
            url: validations.url || validations.uri,
            params: validations.params,
            query: validations.query,
            headers: validations.headers,
            body: JSON.parse(validations.body) || validations.body,
            response: validations.response
        }, err);
    } else {
        logger.info('Outgoing request', {
            method: validations.method,
            url: validations.url || validations.uri,
            params: validations.params,
            query: validations.query,
            headers: validations.headers,
            body: JSON.parse(validations.body) || validations.body,
            response: validations.response
        });
    }

    return null
}