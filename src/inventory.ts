import express from  "express"
import { OkPacket, RowDataPacket } from "mysql2"
import dbPromise from "./db"
import logger from "./logger"
import { Error, ErrorResponse, handleMixedError, isInteger } from "./util"


export default class InventoryController {
    router: express.Router

    constructor() {
        this.router = express.Router()

        this.router.get("/", this.getInventory.bind(this))
        this.router.get("/deleted", this.getDeletedInventory.bind(this))

        this.router.use("/item/new",
            this.newInventoryItemMiddleware.bind(this))
        this.router.put("/item/new",
            this.putNewInventoryItem.bind(this))

        this.router.use("/item/existing/:id",
            this.entryIdMiddleware.bind(this))
        this.router.get("/item/existing/:id",
            this.getInventoryItem.bind(this))
        this.router.put("/item/existing/:id",
            this.putExistingInventoryItem.bind(this))
        this.router.delete("/item/existing/:id",
            this.deleteCommentMiddleware.bind(this),
            this.deleteInventoryItem.bind(this))
    }

    entryIdMiddleware(req: express.Request, res: express.Response,
        next: express.NextFunction) {
        if (isInteger(req.params.id)) {
            next()
        } else {
            logger.info(`${req.hostname} tried to access inventory`
                + `without a valid entry id (${req.params.id})`)

            const body: ErrorResponse = {
                name: Error.FIELD,
                message: "The id has to be specified as number in the url path"
            }

            res.status(400).send()
        }
    }

    newInventoryItemMiddleware(req: express.Request, res: express.Response,
        next: express.NextFunction) {
        if (this.isValidNewEntry(req.body)) {
            next()
        } else {
            logger.info(`${req.hostname} sent malformed/missing creation `
                + `parameters for inventory item`)

            const body: ErrorResponse = {
                name: Error.FIELD,
                message: "Missing or malformed json fields"
            }

            res.status(400).send(body)
        }
    }

    deleteCommentMiddleware(req: express.Request, res: express.Response,
        next: express.NextFunction) {
        if (req.body.hasOwnProperty("comment")) {
            next()
        } else {
            logger.info(`${req.hostname} requested to delete entry in `
                + `inventory without a deletion comment`)

            const body: ErrorResponse = {
                name: Error.FIELD,
                message: "There has to be a deletion comment for a deletion"
            }

            res.status(400).send()
        }
    }

    isValidNewEntry(entry: any) {
        return (entry.hasOwnProperty("name") && entry.hasOwnProperty("count")
            && entry.name.length !== 0 && isInteger(entry.count)
            && entry.count >= 0)
    }

    getInventory(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested all inventory entries`)

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
        logger.info(`${req.hostname} requested inventory entry with `
            + `id ${req.params.id}`)

        const stmt = "SELECT * FROM inventory WHERE id = ?"

        dbPromise.query(stmt, req.params.id)
        .then(([results, fields]) => {
            results = results as RowDataPacket[]
            logger.info(`Retrieved inventory entry id ${req.params.id} for `
                + `${req.hostname}`)

            res.send(results[0])
        }, (error) => {
            handleMixedError(error, req, res)
        })
    }

    getDeletedInventory(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested all deleted inventory entries`)

        const stmt = "SELECT inventory.id, inventory.name, inventory.count, "
            + "deletions.comment FROM inventory INNER JOIN deletions "
            + "ON inventory.deletion_id=deletions.id "
            + "WHERE deletion_id IS NOT NULL"

        dbPromise.query(stmt)
        .then(([results, fields]) => {
            logger.info(`Retrieved all deleted inventory entries for `
                + `${req.hostname}`)

            res.send(results)
        }, (error) => {
            handleMixedError(error, req, res)
        })
    }

    putNewInventoryItem(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested to create entry `
                + `in inventory`)

        const stmt = "INSERT INTO inventory SET ?"

        dbPromise.query(stmt, req.body)
        .then(([results, fields]) => {
            results = results as OkPacket
            logger.info(`${req.hostname} created entry with `
                + `id ${results.insertId} in inventory`)

            res.status(201).send({
                name: req.body.name,
                count: req.body.count,
                id: results.insertId
            })
        }, (error) => {
            return handleMixedError(error, req, res)
        })
    }

    updateInventoryItem(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested to update entry `
                + `${req.params.id} in inventory`)

        const stmt = "UPDATE inventory SET ? WHERE id = ?"

        dbPromise.query(stmt, [req.body, req.params.id])
        .then(([results, fields]) => {
            results = results as OkPacket

            if (results.affectedRows > 0) {
                logger.info(`${req.hostname} updated entry with `
                    + `id ${req.params.id}`)
            } else {
                logger.info(`${req.hostname} tried to update non-existent `
                    + `entry with id ${req.params.id} in inventory`)
            }

            res.send()
        }, (error) => {
            return handleMixedError(error, req, res)
        })
    }

    restoreInventoryItem(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested to restore inventory entry `
            + `id ${req.params.id}`)

        let stmt = "SELECT deletion_id FROM inventory "
            + "WHERE id = ? AND deletion_id IS NOT NULL"

        dbPromise.query(stmt, req.params.id)
        .then(([results, fields]) => {
            results = results as RowDataPacket[]

            if (results.length === 1) {
                logger.info(`${req.hostname} started to restore entry `
                    + `id ${req.params.id} in inventory`)

                const deletionId = results[0].deletion_id
                stmt = "DELETE FROM deletions WHERE id = ?"

                return dbPromise.query(stmt, deletionId)
            } else {
                logger.info(`${req.hostname} tried to restore entry `
                    + `id ${req.params.id} in inventory which is not deleted`)

                const body: ErrorResponse = {
                    name: Error.FIELD,
                    message: "The entry with the specified id is not in "
                        + "the deleted entries"
                }

                return Promise.reject(body)
            }
        })
        .then(() => {
            logger.info(`${req.hostname} successfully restored entry `
                    + `id ${req.params.id} in inventory`)

            res.send()
        }, (error) => {
            return handleMixedError(error, req, res)
        })
    }

    putExistingInventoryItem(req: express.Request, res: express.Response) {
        const update = req.body.hasOwnProperty("name")
            || req.body.hasOwnProperty("count")

        if (update) {
            this.updateInventoryItem(req, res)
        } else {
            this.restoreInventoryItem(req, res)
        }
    }

    deleteInventoryItem(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested to delete inventory entry `
            + `id ${req.params.id}`)

        let stmt = "INSERT INTO deletions (comment) VALUES (?)"

        dbPromise.query(stmt, req.body.comment)
        .then(([results, fields]) => {
            logger.info(`${req.hostname} added a deletion comment for entry `
                + `with id ${req.params.id} in inventory`)

            results = results as OkPacket
            stmt = "UPDATE inventory SET ? WHERE id = ?"

            return dbPromise.query(stmt,
                [{ deletion_id: results.insertId }, req.params.id])
        })
        .then(() => {
            logger.info(`${req.hostname} marked entry with `
                + `id ${req.params.id} in inventory as deleted`)

            res.send()
        }, (error) => {
            return handleMixedError(error, req, res)
        })
    }
}
