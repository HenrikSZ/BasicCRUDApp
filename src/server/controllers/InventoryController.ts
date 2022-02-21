/**
 * Contains the InventoryController for anything related to the inventory
 */

import express from  "express"
import logger from "../logger.js"
import { ErrorType, ErrorResponse, handleDbError, CustomError as ClientRequestError, isCustomError, CustomError, handleUnexpectedError }
    from "../error_handling.js"
import DeletionModel from "../models/DeletionModel.js"
import ItemModel from "../models/ItemModel.js"
import { stringify } from "csv-stringify/sync"
import validator from "validator"


/**
 * Anything about the Inventory is controlled here
 */
export default class InventoryController {
    invModel: ItemModel
    deletionModel: DeletionModel


    constructor(model: ItemModel, deletionModel: DeletionModel) {
        this.invModel = model
        this.deletionModel = deletionModel
    }

    
    /**
     * Checks if there is a valid id provided in the url
     *
     * @param req the request from express.js
     * @param res the response from express.js
     * @param next function to the next middleware
     */
    entryIdMiddleware(req: express.Request, res: express.Response,
        next: express.NextFunction) {
        if (validator.isInt(req.params.id + "", { min: 1 })) {
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
     * @param next function to the next middleware
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
     * @param next function to the next middleware
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
     * Checks if the request parameters contain a name that should be looked for
     * 
     * @param req the request from express.js
     * @param res the response from express.js
     * @param next function to the next middleware
     */
    getItemLikeMiddleware(req: express.Request, res: express.Response,
        next: express.NextFunction) {
        if (typeof req.params.name === "string" && req.params.name.length >= 1) {
            next()
        } else {
            logger.info(`${req.hostname} requested to get items `
                + `like an empty name`)

            const body: ErrorResponse = {
                name: ErrorType.FIELD,
                message: "There has to be at least one character to find items"
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
            && entry.name.length !== 0 && validator.isInt(entry.count + "", { min: 0 })
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

        return this.invModel.getItem(Number.parseInt(req.params.id))
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
     * request body.
     * TODO: Correctly implement item count initiation.
     *
     * @param req the request from express.js
     * @param res the response from express.js
     */
    postNewInventoryItem(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested to create entry `
                + `in inventory`)

        return this.invModel.createItem(req.body)
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

        return this.invModel.updateItem(req.body,
            Number.parseInt(req.params.id)
        )
        .then(wasUpdated => {
            if (wasUpdated) {
                logger.info(`${req.hostname} updated entry with `
                    + `id ${req.params.id}`)

                res.send()
            } else {
                logger.info(`${req.hostname} tried to update non-existent `
                    + `entry with id ${req.params.id} in inventory`)

                const errorResponse: ErrorResponse = {
                    name: ErrorType.FIELD,
                    message: "The entry with the specified id is not "
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

        return this.invModel.getDeletionId(Number.parseInt(req.params.id))
        .then(deletionId => {
            if (deletionId !== -1) {
                logger.info(`${req.hostname} started to restore entry `
                    + `id ${req.params.id} in inventory`)

                return this.deletionModel.delete(deletionId).then((wasDeleted) => {
                    if (!wasDeleted) {
                        const errorResponse: ErrorResponse = {
                            name: ErrorType.FIELD,
                            message: "The deletion comment with the specified "
                                + "deletion id does not exist"
                        }
        
                        throw new ClientRequestError(errorResponse)
                    }
                })
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

        return this.invModel.getDeletionId(Number.parseInt(req.params.id))
        .then(deletionId => {
            if (deletionId === -1) {
                const body: ErrorResponse = {
                    name: ErrorType.FIELD,
                    message: `The specified entry with id ${req.params.id} `
                        + `does not exist`
                }

                throw new CustomError(body)
            } else if (deletionId > 0) {
                const body: ErrorResponse = {
                    name: ErrorType.FIELD,
                    message: `The specified entry with id ${req.params.id} `
                        +`is already deleted`
                }

                throw new CustomError(body)
            }

            return this.deletionModel.insert(req.body.comment)
        })
        .then(insertId => {
            logger.info(`${req.hostname} added a deletion comment for entry `
                + `with id ${req.params.id} in inventory`)

            return this.invModel.updateItem({ deletion_id: insertId },
                Number.parseInt(req.params.id)
            )
        })
        .then(() => {
            logger.info(`${req.hostname} marked entry with `
                + `id ${req.params.id} in inventory as deleted`)

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
     * Exports the inventory table as csv.
     * 
     * @param req the request from express.js
     * @param res the response from express.js
     */
    exportInventoryAsCsv(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested csv report of the inventory`)

        return this.invModel.getAllItems()
        .then(items => {
            return stringify(items, {
                header: true,
                columns: ["id", "name", "count"]
            })
        })
        .then((file) => {
            res.set("Content-Type", "text/csv")
            res.set("Content-Disposition", "attachment; filename=\"inventory_report.csv\"")
            res.send(file)
        }, error => {
            handleUnexpectedError(error, req, res)
        })
    }

    /**
     * Exports the inventory table as csv.
     * 
     * @param req the request from express.js
     * @param res the response from express.js
     */
     exportDeletedInventoryAsCsv(req: express.Request, res: express.Response) {
        logger.info(`${req.hostname} requested csv report of the deleted inventory`)

        return this.invModel.getAllDeletedItems()
        .then(items => {
            return stringify(items, {
                header: true,
                columns: ["id", "name", "count", "comment"]
            })
        })
        .then((file) => {
            res.set("Content-Type", "text/csv")
            res.set("Content-Disposition", "attachment; filename=\"deleted_inventory_report.csv\"")
            res.send(file)
        }, error => {
            handleUnexpectedError(error, req, res)
        })
    }

    /** Returns items that have a part of that in their name
    * 
    * @param req the request from express.js.
    * @param res the response from express.js.
    */
   getItemLike(req: express.Request, res: express.Response) {
       logger.info(`${req.hostname} requested inventory items like `
           + `${req.params.name} id ${req.params.id}`)
       
       return this.invModel.getItemLike(req.params.name)
       .then((items) => {
           res.send(items)
       }, error => {
           handleDbError(error, req, res)
       })
    }
}
