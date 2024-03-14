const crypto = require('crypto');

exports.MD5 = (request) => {
    const md5 = crypto.createHash('md5');
    return md5.update(request).digest('hex')
}