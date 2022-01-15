import express from "express"
import bodyParser from "body-parser"
import mysql2, { OkPacket, RowDataPacket } from "mysql2"
import dotenv from "dotenv"
import path from "path"
import winston from "winston"


enum Error {
    DB = "Database Error",
    FIELD = "Field Error"
}

type ErrorResponse = {
    name: Error,
    errno?: number,
    message?: string
}


function logDbError(error: mysql2.QueryError, hostname?: string) {
    if (hostname) {
        logger.error(`${hostname} caused database error ${error.code}: ${error.message}`)
    } else {
        logger.error(`Database error ${error.code}: ${error.message}`)
    }
}


function isInteger(n: string): boolean {
    return /^-?\d+$/.test(n)
}

dotenv.config()

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL,
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ]
})

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


dbConnection.query(
    "CREATE TABLE IF NOT EXISTS deletions "
    + "(id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, "
    + "created_at TIMESTAMP NOT NULL DEFAULT NOW(), "
    + "update_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(), "
    + "comment VARCHAR(255) NOT NULL)",
    (error, results, fields) => {
        if (error) {
            logDbError(error)
        }
    })

dbConnection.query(
    "CREATE TABLE IF NOT EXISTS inventory "
    + "(id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, "
    + "deletion_id BIGINT, "
    + "created_at TIMESTAMP NOT NULL DEFAULT NOW(), "
    + "updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(), "
    + "name VARCHAR(64) NOT NULL, "
    + "count INT NOT NULL DEFAULT 0, "
    + "FOREIGN KEY (deletion_id) REFERENCES deletions (id))",
    (error, results, fields) => {
        if (error) {
            logDbError(error)
        }
    })


const app = express()
app.use(bodyParser.json())

app.get("/inventory", (req, res) => {
    dbConnection.query("SELECT * FROM inventory WHERE deletion_id IS NULL",
    (error, results, fields) => {
        if (!error) {
            logger.info(`${req.hostname} requested all entries`)

            res.send(results)
        } else {
            logDbError(error, req.hostname)

            const body: ErrorResponse = { name: Error.DB }
            res.status(500).send(body)
        }
    })
})

app.get("/inventory/deleted", (req, res) => {
    dbConnection.query("SELECT inventory.id, inventory.name, inventory.count, "
    + "deletions.comment FROM inventory INNER JOIN deletions "
    + "ON inventory.deletion_id=deletions.id WHERE deletion_id IS NOT NULL ",
    (error, results, fields) => {
        if (!error) {
            logger.info(`${req.hostname} requested all deleted entries`)

            res.send(results)
        } else {
            logDbError(error, req.hostname)

            const body: ErrorResponse = { name: Error.DB }
            res.status(500).send(body)
        }
    })
})

app.get("/inventory/item/:id", (req, res) => {
    dbConnection.query(`SELECT * FROM inventory WHERE id = ${mysql2.escape(req.params.id)}`,
    (error, results: mysql2.RowDataPacket, fields) => {
        if (!error) {
            logger.info(`${req.hostname} requested entry with id ${req.params.id}`)

            res.send(results[0])
        } else {
            logDbError(error, req.hostname)

            const body: ErrorResponse = { name: Error.DB }
            res.status(500).send(body)
        }
    })
})

app.put("/inventory", (req, res) => {
    if (req.body.hasOwnProperty("name") && req.body.hasOwnProperty("count")
        && req.body.name.length !== 0 && isInteger(req.body.count) && req.body.count >= 0) {
        const name = mysql2.escape(req.body.name)
        const count = mysql2.escape(req.body.count)

        dbConnection.query(`INSERT INTO inventory (name, count) VALUES (${name}, ${count})`,
            (error, results: mysql2.OkPacket, fields) => {
            if (!error) {
                logger.info(`${req.hostname} created entry with id ${results.insertId} in inventory`)

                res.status(201).send({
                    name: req.body.name,
                    count: req.body.count,
                    id: results.insertId
                })
            } else {
                logDbError(error, req.hostname)

                const body: ErrorResponse = { name: Error.DB }
                res.status(500).send(body)
            }
        })
    } else {
        logger.info(`Received malformed/missing creation parameters from ${req.hostname}`)

        const body: ErrorResponse = {
            name: Error.FIELD,
            message: "Missing or malformed json fields"
        }

        res.status(400).send(body)
    }
})

app.put("/inventory/item/:id", (req, res) => {
    if (!isInteger(req.params.id)) {
        logger.info(`${req.hostname} tried to update without a valid entry id (${req.params.id})`)

        const body: ErrorResponse = {
            name: Error.FIELD,
            message: "The id has to be specified as number in the url path"
        }

        res.status(400).send(body)
        return
    }

    const id = Number.parseInt(req.params.id, 10)
    if (req.body.hasOwnProperty("name") || req.body.hasOwnProperty("count")) {
        // Request to update

        dbConnection.query(`UPDATE inventory SET ? WHERE id = ${mysql2.escape(id)}`,
        req.body, (error, results: mysql2.OkPacket, fields) => {
            if (!error) {
                if (results.affectedRows > 0) {
                    logger.info(`${req.hostname} updated entry with id ${id}`)
                } else {
                    logger.info(`${req.hostname} tried to update non-existent entry `
                    + `with id ${id} from inventory`)
                }

                res.send()
            } else {
                logDbError(error, req.hostname)

                const body: ErrorResponse = { name: Error.DB }
                res.status(500).send(body)
            }
        })
    } else {
        // Request to restore

        dbConnection.query(`SELECT deletion_id FROM inventory `
            + `WHERE id = ${mysql2.escape(id)} AND deletion_id IS NOT NULL`,
            (error, results: mysql2.RowDataPacket, fields) => {
                if (!error) {
                    if (results.length === 1) {
                        const deletionId = results[0].deletion_id

                        dbConnection.query(`UPDATE inventory SET deletion_id = NULL `
                        + `WHERE id = ${mysql2.escape(id)}`,
                        (error2, results2, fields2) => {
                            if (!error2) {
                                dbConnection.query(`DELETE FROM deletions WHERE id = ${mysql2.escape(deletionId)}`,
                                (error3, results3, fields3) => {
                                    if (!error3) {
                                        res.send()
                                    } else {
                                        logDbError(error3, req.hostname)

                                        const body: ErrorResponse = { name: Error.DB }
                                        res.status(500).send(body)
                                    }
                                })
                            } else {
                                logDbError(error2, req.hostname)

                                const body: ErrorResponse = { name: Error.DB }
                                res.status(500).send(body)
                            }
                        })
                    }
                } else {
                    logDbError(error, req.hostname)

                    const body: ErrorResponse = { name: Error.DB }
                    res.status(500).send(body)
                }
            })
    }
})

app.delete("/inventory/item/:id", (req, res) => {
    if (!isInteger(req.params.id)) {
        logger.info(`${req.hostname} tried to delete without a valid entry id (${req.params.id})`)

        const body: ErrorResponse = {
            name: Error.FIELD,
            message: "The id has to be specified as number in the url path"
        }

        res.status(400).send(body)
        return
    }

    if (req.body.hasOwnProperty("comment")) {
        // TODO: Handle if entry already marked for deletion.
        const comment = mysql2.escape(req.body.comment)

        const stmt = `INSERT INTO deletions (comment) VALUES (${comment})`

        dbConnection.query(stmt,
        (error, results: mysql2.OkPacket, fields) => {
            if (!error) {
                const deletionId = mysql2.escape(results.insertId)
                const id = Number.parseInt(req.params.id, 10)

                logger.info(`${req.hostname} added a deletion comment for entry with id ${id} in inventory`)

                dbConnection.query(`UPDATE inventory SET ? WHERE id = ${mysql2.escape(id)}`,
                { deletion_id: deletionId }, (error2, results2, fields2) => {
                    if (!error2) {
                        logger.info(`${req.hostname} marked entry with id ${id} in inventory as deleted`)

                        res.send()
                    } else {
                        logDbError(error2, req.hostname)

                        const body: ErrorResponse = { name: Error.DB }
                        res.status(500).send(body)
                    }
                })
            } else {
                logDbError(error, req.hostname)

                const body: ErrorResponse = { name: Error.DB }
                res.status(500).send(body)
            }
        })
    }
})

app.use(express.static(path.resolve(__dirname, "..", "public")))


const port = process.env.PORT
app.listen(port, () => {
    logger.info(`Started web server listening on port ${port}`)
})
