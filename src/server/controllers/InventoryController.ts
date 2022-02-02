/**
 * Contains the InventoryController for anything related to the inventory
 */

import express from  "express"
import logger from "../logger.js"
import { ErrorType, ErrorResponse, handleDbError, CustomError as ClientRequestError, isCustomError }
    from "../error_handling.js"
import { isInteger } from "../util.js"
import DeletionModel from "../models/DeletionModel.js"
import InventoryModel from "../models/InventoryModel.js"


/**
 * Anything about the Inventory is controlled here
 */
export default class InventoryController {
    invModel: InventoryModel
    deletionModel: DeletionModel


    constructor(model: InventoryModel, deletionModel: DeletionModel) {
        this.invModel = model
        this.deletionModel = deletionModel
    }

    /**
     * Checks if there is a valid id provided in the url
     *
     * @param req the request from express.js
     * @param res the response from express.js
     * @param next function to the next middleware to be called
     */
    entryIdMiddleware(req: express.Request, res: express.Response,
        next: express.NextFunction) {
        if (isInteger(req.params.id)) {
            next()
        } else {
            logger.info(`${req.hostname} tried to access inventory`
                + `without a valid entry id (${req.params.id})`)

            const body: ErrorResponse = {
                name: ErrorType.FIELD,
                message: "The id has to be specified as number in the url path"
            }

            res.status(400).send(body)
        }
    }

    /**
     * Checks if the request body contains all valid fields for a new
     * inventory item
     *
     * @param req the request from express.js
     * @param res the response from express.js
     * @param next function to the next middleware to be called
     */
    newInventoryItemMiddleware(req: express.Request, res: express.Response,
        next: express.NextFunction) {
        if (this.isValidNewEntry(req.body)) {
            next()
        } else {
            logger.info(`${req.hostname} sent malformed/missing creation `
                + `parameters for inventory item`)

            const body: ErrorResponse = {
                name: ErrorType.FIELD,
                message: "Missing or malformed json fields"
            }

            res.status(400).send(body)
        }
    }

    /**
     * Checks if the request body contains a comment field
     *
     * @param req the request from express.js
     * @param res the response from express.js
     * @param next function to the next middleware to be called
     */
    deleteCommentMiddleware(req: express.Request, res: express.Response,
        next: express.NextFunction) {
        if (req.body.hasOwnProperty("comment")) {
            next()
        } else {
            logger.info(`${req.hostname} requested to delete entry in `
                + `inventory without a deletion comment`)

            const body: ErrorResponse = {
                name: ErrorType.FIELD,
                message: "There has to be a deletion comment for a deletion"
            }

            res.status(400).send(body)
        }
    }

    /**
     * Checks if an object contains all properties of a new inventory item
     * TODO: pull out in separate method
     *
     * @param entry the object that should be checked
     * @returns true if the entry is valid
     */
    isValidNewEntry(entry: any) {
        return (
            Object.keys(entry).length == 2
            && entry.hasOwnProperty("name") && entry.hasOwnProperty("count")
            && entry.name.length !== 0 && isInteger(entry.count)
            && entry.count >= 0
        )
    }

    /**
     * Reads the complete inventory and sends all its fields as a
     * json array
     *
     * @param req the request from express.js
     * @param res the response from express.js
     */
    getInventory(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested all inventory entries`)

        return this.invModel.getAllItems()
        .then(results => {
            logger.info(`${req.hostname} requested all entries`)

            res.send(results)
        }, (error) => {
            handleDbError(error, req, res)
        })
    }

    /**
     * Reads one item specified from the id in the request parameters (url)
     * from the inventory and sends it as a json object
     *
     * @param req the request from express.js
     * @param res the response from express.js
     */
    getInventoryItem(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested inventory entry with `
            + `id ${req.params.id}`)

        return this.invModel.getItem(req.params.id)
        .then(item => {
            if (item) {
                logger.info(`Retrieved inventory entry id ${req.params.id} for `
                    + `${req.hostname}`)

                res.send(item)
            } else {
                logger.info(`${req.hostname} requested unavailable inventory `
                    + `entry id ${req.params.id}`)

                const errorResponse: ErrorResponse = {
                    name: ErrorType.FIELD,
                    message: `The request inventory entry with id ${req.params.id} `
                        + `is unavailable`
                }

                res.status(400).send(errorResponse)
            }
        }, (error) => {
            handleDbError(error, req, res)
        })
    }

    /**
     * Reads all delete entries from the inventory and sends all their fields as a
     * json array
     *
     * @param req the request from express.js
     * @param res the response from express.js
     */
    getDeletedInventory(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested all deleted inventory entries`)

        return this.invModel.getAllDeletedItems()
        .then(results => {
            logger.info(`Retrieved all deleted inventory entries for `
                + `${req.hostname}`)

            res.send(results)
        }, (error) => {
            handleDbError(error, req, res)
        })
    }

    /**
     * Creates a new inventory item from the fields specified in the
     * request body
     *
     * @param req the request from express.js
     * @param res the response from express.js
     */
    postNewInventoryItem(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested to create entry `
                + `in inventory`)

        return this.invModel.insertItem(req.body)
        .then(insertId => {
            logger.info(`${req.hostname} created entry with `
                + `id ${insertId} in inventory`)

            res.status(201).send({
                name: req.body.name,
                count: req.body.count,
                id: insertId
            })
        }, (error) => {
            handleDbError(error, req, res)
        })
    }

    /**
     * Updates an inventory item according to the fields in the request body
     *
     * @param req the request from express.js
     * @param res the response from express.js
     */
    updateInventoryItem(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested to update entry `
                + `${req.params.id} in inventory`)

        return this.invModel.updateItem(req.body, req.params.id)
        .then(results => {
            if (results.affectedRows > 0) {
                logger.info(`${req.hostname} updated entry with `
                    + `id ${req.params.id}`)

                res.send()
            } else {
                logger.info(`${req.hostname} tried to update non-existent `
                    + `entry with id ${req.params.id} in inventory`)

                const errorResponse: ErrorResponse = {
                    name: ErrorType.FIELD,
                    message: "The entry with the specified it is not"
                        + "in the inventory"
                }

                res.status(400).send(errorResponse)
            }
        }, (error) => {
            handleDbError(error, req, res)
        })
    }

    /**
     * Restores a delete inventory item that has the id specified in the request
     * parameters (url)
     *
     * @param req the request from express.js
     * @param res the response from express.js
     */
    restoreInventoryItem(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested to restore inventory entry `
            + `id ${req.params.id}`)

        return this.invModel.getDeletionId(req.params.id)
        .then(deletionId => {
            if (deletionId !== -1) {
                logger.info(`${req.hostname} started to restore entry `
                    + `id ${req.params.id} in inventory`)

                return this.deletionModel.delete(deletionId)
            } else {
                logger.info(`${req.hostname} tried to restore entry `
                    + `id ${req.params.id} in inventory which is not deleted`)

                const errorResponse: ErrorResponse = {
                    name: ErrorType.FIELD,
                    message: "The entry with the specified id is not in "
                        + "the deleted entries"
                }

                throw new ClientRequestError(errorResponse)
            }
        })
        .then(() => {
            logger.info(`${req.hostname} successfully restored entry `
                    + `id ${req.params.id} in inventory`)

            res.send()
        }, (error) => {
            if (isCustomError(error)) {
                res.status(400).send(error.response)
            } else {
                handleDbError(error, req, res)
            }
        })
    }

    /**
     * Either updates or restores an inventory item depending on the request body
     * Only if it is empty, it is tried to be restored
     * Otherwise it is tried to be updated
     *
     * @param req the request from express.js
     * @param res the response from express.js
     */
    putExistingInventoryItem(req: express.Request, res: express.Response) {
        const update = req.body.hasOwnProperty("name")
            || req.body.hasOwnProperty("count")

        if (update) {
            return this.updateInventoryItem(req, res)
        } else {
            return this.restoreInventoryItem(req, res)
        }
    }

    /**
     * Deletes an inventory item with a comment set as field in the
     * request body
     *
     * @param req the request from express.js
     * @param res the reponse from express.js
     */
    deleteInventoryItem(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested to delete inventory entry `
            + `id ${req.params.id}`)

        return this.deletionModel.insert(req.body.comment)
        .then(insertId => {
            logger.info(`${req.hostname} added a deletion comment for entry `
                + `with id ${req.params.id} in inventory`)

            return this.invModel.updateItem({ deletion_id: insertId},
                req.params.id)
        })
        .then(() => {
            logger.info(`${req.hostname} marked entry with `
                + `id ${req.params.id} in inventory as deleted`)

            res.send()
        }, (error) => {
            handleDbError(error, req, res)
        })
    }
}
