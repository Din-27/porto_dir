const { verify } = require("jsonwebtoken")
const { db } = require("../config/MysqlConfig")

/**
 * 
 * this function for execute query
 * 
 * @param query 
 * @param params 
 * @returns 
 */

exports.queryDB = (query, queryvalue) => {
    let err
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            db.query(query, queryvalue, async function (error, rows, fields) {
                await db.query(`FLUSH HOSTS;`);
                if (error) {
                    err = "Error mysql -> " + error + " <- " + this.sql;
                    reject(err);
                } else {
                    resolve({
                        rows,
                        fields,
                    });
                }
            });
        }, 0);
    });
}

/**
 * 
 * @param err 
 * 
 * this funstion for describe error
 */
exports.DumpError = (err) => {
    if (typeof err === "object") {
        if (err) {
            console.log(err);
            console.log("\nMessage: " + err);
        }
        if (err.stack) {
            console.log("\nStacktrace:");
            console.log("====================");
            console.log(err.stack);
        }
    } else {
        console.error(err);
    }
}


/**
 * this function for start transaction sql query
 */
exports.StartTransaction = async () => {
    await this.Query("START TRANSACTION")
}

/**
 * this function for commit finist start transaction
 */
exports.Commit = async () => {
    await this.Query("COMMIT")
}

/**
 * this function for error sql start transaction rollback
 */
exports.Rollback = async () => {
    await this.Query("ROLLBACK")
}

/**
 * 
 * this function for decoded token jwt 
 * 
 * @param req 
 * @returns 
 */

exports.DecodedToken = (req) => {
    const authHeader = req.header("Authorization")
    const token = authHeader && authHeader.split(' ')[1]
    const decoded = verify(String(token), 'process.env.TOKEN_KEY')
    return decoded
}