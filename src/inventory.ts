import express from  "express"
import mysql2, { OkPacket, RowDataPacket } from "mysql2"
import dbPromise from "./db"
import logger from "./logger"
import { Error, ErrorResponse, handleMixedError, isInteger } from "./util"


declare global {
    namespace Express {
        export interface Request {
            inventoryEntryId?: number
        }
    }
}


export default class InventoryController {
    router: express.Router

    constructor() {
        this.router = express.Router()

        this.router.get("/", this.getInventory)
        this.router.get("/deleted", this.getDeletedInvetory)
        this.router.put("/item", this.putNewInventoryItem)

        this.router.use("/item/:id", this.entryIdMiddleware)

        this.router.get("/item/:id", this.getInventoryItem)
        this.router.put("/item/:id", this.putExistingInventoryItem)
        this.router.delete("/item/:id", this.deleteInventoryItem)
    }

    entryIdMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (isInteger(req.params.id)) {
            req.inventoryEntryId = Number.parseInt(req.params.id, 10)
            next()
        } else {
            logger.info(`${req.hostname} tried to access inventory without a valid`
            + `entry id (${req.inventoryEntryId})`)

            const body: ErrorResponse = {
                name: Error.FIELD,
                message: "The id has to be specified as number in the url path"
            }

            res.status(400).send()
        }
    }

    getInventory(req: express.Request, res: express.Response) {
        const stmt = "SELECT * FROM inventory WHERE deletion_id IS NULL"

        dbPromise.query(stmt)
        .then(([results, fields]) => {
            logger.info(`${req.hostname} requested all entries`)

            res.send(results)
        }, (error) => {
            handleMixedError(error, req, res)
        })
    }

    getInventoryItem(req: express.Request, res: express.Response) {
        const stmt = "SELECT * FROM inventory WHERE id = ?"

        dbPromise.query(stmt, req.inventoryEntryId)
        .then(([results, fields]) => {
            results = results as RowDataPacket[]
            logger.info(`${req.hostname} requested entry with id ${req.inventoryEntryId}`)

            res.send(results[0])
        }, (error) => {
            handleMixedError(error, req, res)
        })
    }

    getDeletedInvetory(req: express.Request, res: express.Response) {
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
    }

    putNewInventoryItem(req: express.Request, res: express.Response) {
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
    }

    updateInventoryItem(req: express.Request, res: express.Response) {
        const stmt = `UPDATE inventory SET ? WHERE id = ${mysql2.escape(req.inventoryEntryId)}`

        dbPromise.query(stmt, req.body)
        .then(([results, fields]) => {
            results = results as OkPacket

            if (results.affectedRows > 0) {
                logger.info(`${req.hostname} updated entry with id ${req.inventoryEntryId}`)
            } else {
                logger.info(`${req.hostname} tried to update non-existent entry `
                + `with id ${req.inventoryEntryId} from inventory`)
            }

            return Promise.resolve(0)
        })
        .then(() => {
            res.send()
        }, (error) => {
            return handleMixedError(error, req, res)
        })
    }

    restoreInventoryItem(req: express.Request, res: express.Response) {
        let stmt = "SELECT deletion_id FROM inventory "
            + "WHERE id = ? AND deletion_id IS NOT NULL"

        dbPromise.query(stmt, req.inventoryEntryId)
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

    putExistingInventoryItem(req: express.Request, res: express.Response) {
        const update = req.body.hasOwnProperty("name") || req.body.hasOwnProperty("count")

        if (update) {
            this.updateInventoryItem(req, res)
        } else {
            this.restoreInventoryItem(req, res)
        }
    }

    deleteInventoryItem(req: express.Request, res: express.Response) {
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
            + `id ${req.inventoryEntryId} in inventory`)

            results = results as OkPacket
            const deletionId = mysql2.escape(results.insertId)

            const stmt = `UPDATE inventory SET ? WHERE id = ${mysql2.escape(req.inventoryEntryId)}`

            return dbPromise.query(stmt, { deletion_id: deletionId })
        })
        .then(() => {
            logger.info(`${req.hostname} marked entry with id ${req.inventoryEntryId} in `
            + `inventory as deleted`)

            res.send()
        }, (error) => {
            return handleMixedError(error, req, res)
        })
    }
}
