import express from "express"
import bodyParser from "body-parser"
import mysql2, { OkPacket, QueryError, RowDataPacket } from "mysql2"
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

declare global {
    namespace Express {
         export interface Request {
                custom: {
                    inventoryEntryId?: number
                }
         }
    }
}


function logDbError(error: QueryError, hostname?: string) {
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


function isMysqlError(error: ErrorResponse | QueryError): error is QueryError {
    return Boolean((error as QueryError).name)
}

function handleMixedError(error: ErrorResponse | QueryError,
    req: express.Request, res: express.Response) {
    if (isMysqlError(error)) {
        logDbError(error, req.hostname)

        const body: ErrorResponse = { name: Error.DB }
        res.status(500).send(body)
    } else {
        res.send(error)
    }

    return 0
}


const app = express()
app.use(bodyParser.json())

app.use((req, res, next) => {
    req.custom = {}
    next()
})

app.use("/inventory/item/:id", (req, res, next) => {
    if (isInteger(req.params.id)) {
        req.custom.inventoryEntryId = Number.parseInt(req.params.id, 10)
        next()
    } else {
        logger.info(`${req.hostname} tried to access inventory without a valid`
        + `entry id (${req.custom.inventoryEntryId})`)

        const body: ErrorResponse = {
            name: Error.FIELD,
            message: "The id has to be specified as number in the url path"
        }

        res.status(400).send()
    }
})

app.get("/inventory", (req, res) => {
    const stmt = "SELECT * FROM inventory WHERE deletion_id IS NULL"

    dbPromise.query(stmt)
    .then(([results, fields]) => {
        logger.info(`${req.hostname} requested all entries`)

        res.send(results)
    }, (error) => {
        handleMixedError(error, req, res)
    })
})

app.get("/inventory/deleted", (req, res) => {
    const stmt = "SELECT inventory.id, inventory.name, inventory.count, "
    + "deletions.comment FROM inventory INNER JOIN deletions "
    + "ON inventory.deletion_id=deletions.id WHERE deletion_id IS NOT NULL"

    dbPromise.query(stmt)
    .then(([results, fields]) => {
        logger.info(`${req.hostname} requested all deleted entries`)

        res.send(results)
    }, (error) => {
        handleMixedError(error, req, res)
    })
})

app.get("/inventory/item/:id", (req, res) => {
    const stmt = "SELECT * FROM inventory WHERE id = ?"

    dbPromise.query(stmt, req.custom.inventoryEntryId)
    .then(([results, fields]) => {
        results = results as RowDataPacket[]
        logger.info(`${req.hostname} requested entry with id ${req.custom.inventoryEntryId}`)

        res.send(results[0])
    }, (error) => {
        handleMixedError(error, req, res)
    })
})

app.put("/inventory", (req, res) => {
    if (req.body.hasOwnProperty("name") && req.body.hasOwnProperty("count")
        && req.body.name.length !== 0 && isInteger(req.body.count) && req.body.count >= 0) {
        const stmt = "INSERT INTO inventory SET ?"

        dbPromise.query(stmt, req.body)
        .then(([results, fields]) => {
            results = results as OkPacket
            logger.info(`${req.hostname} created entry with id ${results.insertId} in inventory`)

            res.status(201).send({
                name: req.body.name,
                count: req.body.count,
                id: results.insertId
            })
        }, (error) => {
            return handleMixedError(error, req, res)
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
    const update = req.body.hasOwnProperty("name") || req.body.hasOwnProperty("count")

    if (update) {
        const stmt = `UPDATE inventory SET ? WHERE id = ${mysql2.escape(req.custom.inventoryEntryId)}`

        dbPromise.query(stmt, req.body)
        .then(([results, fields]) => {
            results = results as OkPacket

            if (results.affectedRows > 0) {
                logger.info(`${req.hostname} updated entry with id ${req.custom.inventoryEntryId}`)
            } else {
                logger.info(`${req.hostname} tried to update non-existent entry `
                + `with id ${req.custom.inventoryEntryId} from inventory`)
            }

            return Promise.resolve(0)
        })
        .then(() => {
            res.send()
        }, (error) => {
            return handleMixedError(error, req, res)
        })
     } else {
        Promise.resolve()
        .then(() => {
            const stmt = "SELECT deletion_id FROM inventory "
            + "WHERE id = ? AND deletion_id IS NOT NULL"

            return dbPromise.query(stmt, req.custom.inventoryEntryId)
        })
        .then(([results, fields]) => {
            results = results as RowDataPacket[]

            if (results.length === 1) {
                const deletionId = results[0].deletion_id
                const stmt = "DELETE FROM deletions WHERE id = ?"

                return dbPromise.query(stmt, deletionId)
            } else {
                const body: ErrorResponse = {
                    name: Error.FIELD,
                    message: "The entry with the specified id is not in "
                    + "the deleted entries"
                }

                return Promise.reject(body)
            }
        })
        .then(() => {
            res.send()
        }, (error) => {
            return handleMixedError(error, req, res)
        })
    }
})

app.delete("/inventory/item/:id", (req, res) => {
    new Promise((resolve, reject) => {
        if (req.body.hasOwnProperty("comment")) {
            resolve(req.body.comment)
        } else {
            logger.info(`${req.hostname} requested to delete entry in `
            + `inventory without a deletion comment`)

            const body: ErrorResponse = {
                name: Error.FIELD,
                message: "There has to be a deletion comment for a deletion"
            }

            res.status(400)
            reject(body)
        }
    })
    .then((comment) => {
        const stmt = "INSERT INTO deletions (comment) VALUES (?)"
        return dbPromise.query(stmt, comment)
    })
    .then(([results, fields]) => {
        logger.info(`${req.hostname} added a deletion comment for entry with `
        + `id ${req.custom.inventoryEntryId} in inventory`)

        results = results as OkPacket
        const deletionId = mysql2.escape(results.insertId)

        const stmt = `UPDATE inventory SET ? WHERE id = ${mysql2.escape(req.custom.inventoryEntryId)}`

        return dbPromise.query(stmt, { deletion_id: deletionId })
    })
    .then(() => {
        logger.info(`${req.hostname} marked entry with id ${req.custom.inventoryEntryId} in `
        + `inventory as deleted`)

        res.send()
    }, (error) => {
        return handleMixedError(error, req, res)
    })
})

app.use(express.static(path.resolve(__dirname, "..", "public")))


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
    .then(() => {
        return new Promise((resolve, reject) => {
            const port = process.env.PORT
            app.listen(port, () => {
                logger.info(`Started web server listening on port ${port}`)
            })

            resolve(0)
        })
    })
    .catch(logDbError)
