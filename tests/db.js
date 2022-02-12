/**
 * Whenever the database is accessed, it is through this module
 */


import mysql2 from "mysql2"
import dotenv from "dotenv"
dotenv.config()

const dbConnConfig = {
    host: process.env.TEST_DB_HOST ?? "localhost",
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASS,
    database: process.env.TEST_DB_NAME
}

if (process.env.TEST_DB_CONN_LIMIT)
    dbConnConfig.connectionLimit = Number.parseInt(process.env.TEST_DB_CONN_LIMIT, 10)

if (process.env.TEST_DB_PORT)
    dbConnConfig.port = Number.parseInt(process.env.TEST_DB_CONN_LIMIT, 10)

function createPool() {
    const dbConnection = mysql2.createPool(dbConnConfig)
    return dbConnection.promise()
}

export default createPool
