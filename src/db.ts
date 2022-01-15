import mysql2 from "mysql2"
import { logDbError } from "./util"
import logger from "./logger"


const dbConnConfig: mysql2.ConnectionOptions = {
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
}

const dbConnection = mysql2.createConnection(dbConnConfig)

dbConnection.connect(err => {
    if (!err) {
        logger.info(`Connected to database ${dbConnConfig.database} `
        + `on ${dbConnConfig.host}:${dbConnConfig.port} `
        + `as user ${dbConnConfig.user}`)
    } else {
        logDbError(err)
    }
})

const dbPromise = dbConnection.promise()
dbPromise.query(
    "CREATE TABLE IF NOT EXISTS deletions "
    + "(id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, "
    + "created_at TIMESTAMP NOT NULL DEFAULT NOW(), "
    + "update_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(), "
    + "comment VARCHAR(255) NOT NULL)")
    .then(() => {
        return dbPromise.query("CREATE TABLE IF NOT EXISTS inventory "
        + "(id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, "
        + "deletion_id BIGINT, "
        + "created_at TIMESTAMP NOT NULL DEFAULT NOW(), "
        + "updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(), "
        + "name VARCHAR(64) NOT NULL, "
        + "count INT NOT NULL DEFAULT 0, "
        + "FOREIGN KEY (deletion_id) REFERENCES deletions (id) ON DELETE SET NULL)")
    })
    .catch(logDbError)


export default dbPromise
