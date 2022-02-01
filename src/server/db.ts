/**
 * Whenever the database is accessed, it is through this module
 */


import mysql2 from "mysql2"
import dotenv from "dotenv"
dotenv.config()

const dbConnConfig: mysql2.ConnectionOptions = {
    host: process.env.DB_HOST ?? "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
}

if (process.env.DB_CONN_LIMIT)
    dbConnConfig.connectionLimit = Number.parseInt(process.env.DB_CONN_LIMIT, 10)

if (process.env.DB_PORT)
    dbConnConfig.port = Number.parseInt(process.env.DB_CONN_LIMIT, 10)


const dbConnection = mysql2.createPool(dbConnConfig)
const dbPromise = dbConnection.promise()


export default dbPromise
