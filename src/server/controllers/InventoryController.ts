/**
 * Contains the InventoryController for anything related to the inventory
 */

import { FastifyReply, FastifyRequest } from "fastify"
import logger from "../logger.js"
import { ErrorType, ErrorResponse, handleDbError, CustomError as ClientRequestError, isCustomError, CustomError, handleUnexpectedError }
    from "../error_handling.js"
import DeletionModel, { ICreateDeletion } from "../models/DeletionModel.js"
import ItemModel, { ICreateItem, ILikeItem, IUpdateItem } from "../models/ItemModel.js"
import { stringify } from "csv-stringify/sync"


export interface IAccessItemParameters {
    item_id: number
}

/**
 * Anything about the Inventory is controlled here
 */
export default class InventoryController {
    invModel: ItemModel
    deletionModel: DeletionModel


    constructor(model: ItemModel = new ItemModel(),
            deletionModel: DeletionModel = new DeletionModel()) {
        this.invModel = model
        this.deletionModel = deletionModel
    }
    

    /**
     * Reads the complete inventory and sends all its fields as a
     * json array
     *
     * @param req the request from express.js
     * @param res the response from express.js
     */
    getInventory(req: FastifyRequest, res: FastifyReply) {
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
    getInventoryItem(req: FastifyRequest<{
        Params: IAccessItemParameters
      }>, res: FastifyReply) {
        logger.info(`${req.hostname} requested inventory entry with `
            + `id ${req.params.item_id}`)

        return this.invModel.getItem(req.params.item_id)
        .then(item => {
            if (item) {
                logger.info(`Retrieved inventory entry id ${req.params.item_id} for `
                    + `${req.hostname}`)

                res.send(item)
            } else {
                logger.info(`${req.hostname} requested unavailable inventory `
                    + `entry id ${req.params.item_id}`)

                const errorResponse: ErrorResponse = {
                    name: ErrorType.FIELD,
                    message: `The request inventory entry with id ${req.params.item_id} `
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
    getDeletedInventory(req: FastifyRequest, res: FastifyReply) {
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
    postNewInventoryItem(req: FastifyRequest<{Body: ICreateItem}>, res: FastifyReply) {
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
    updateInventoryItem(req: FastifyRequest<{Params: IAccessItemParameters, Body: IUpdateItem}>,
            res: FastifyReply) {
        logger.info(`${req.hostname} requested to update entry `
                + `${req.params.item_id} in inventory`)

        return this.invModel.updateItem(req.body, req.params.item_id)
        .then(wasUpdated => {
            if (wasUpdated) {
                logger.info(`${req.hostname} updated entry with `
                    + `id ${req.params.item_id}`)

                res.send()
            } else {
                logger.info(`${req.hostname} tried to update non-existent `
                    + `entry with id ${req.params.item_id} in inventory`)

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
    restoreInventoryItem(req: FastifyRequest<{Params: IAccessItemParameters}>, res: FastifyReply) {
        logger.info(`${req.hostname} requested to restore inventory entry `
            + `id ${req.params.item_id}`)

        return this.invModel.getDeletionId(req.params.item_id)
        .then(deletionId => {
            if (deletionId !== -1) {
                logger.info(`${req.hostname} started to restore entry `
                    + `id ${req.params.item_id} in inventory`)

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
                    + `id ${req.params.item_id} in inventory which is not deleted`)

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
                    + `id ${req.params.item_id} in inventory`)

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
    putExistingInventoryItem(
            req: FastifyRequest<{Params: IAccessItemParameters, Body: IUpdateItem}>,
            res: FastifyReply) {
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
    deleteInventoryItem(
            req: FastifyRequest<{Params: IAccessItemParameters, Body: ICreateDeletion}>,
            res: FastifyReply) {
        logger.info(`${req.hostname} requested to delete inventory entry `
            + `id ${req.params.item_id}`)

        return this.invModel.getDeletionId(req.params.item_id)
        .then(deletionId => {
            if (deletionId === -1) {
                const body: ErrorResponse = {
                    name: ErrorType.FIELD,
                    message: `The specified entry with id ${req.params.item_id} `
                        + `does not exist`
                }

                throw new CustomError(body)
            } else if (deletionId > 0) {
                const body: ErrorResponse = {
                    name: ErrorType.FIELD,
                    message: `The specified entry with id ${req.params.item_id} `
                        +`is already deleted`
                }

                throw new CustomError(body)
            }

            return this.deletionModel.create(req.body)
        })
        .then(insertId => {
            logger.info(`${req.hostname} added a deletion comment for entry `
                + `with id ${req.params.item_id} in inventory`)

            return this.invModel.updateItem(
                { deletion_id: insertId }, req.params.item_id)
        })
        .then(() => {
            logger.info(`${req.hostname} marked entry with `
                + `id ${req.params.item_id} in inventory as deleted`)

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
    exportInventoryAsCsv(req: FastifyRequest, res: FastifyReply) {
        logger.info(`${req.hostname} requested csv report of the inventory`)

        return this.invModel.getAllItems()
        .then(items => {
            return stringify(items, {
                header: true,
                columns: ["id", "name", "count"]
            })
        })
        .then((file) => {
            res.header("Content-Type", "text/csv")
            res.header("Content-Disposition", "attachment; filename=\"inventory_report.csv\"")
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
     exportDeletedInventoryAsCsv(req: FastifyRequest, res: FastifyReply) {
        logger.info(`${req.hostname} requested csv report of the deleted inventory`)

        return this.invModel.getAllDeletedItems()
        .then(items => {
            return stringify(items, {
                header: true,
                columns: ["id", "name", "count", "comment"]
            })
        })
        .then((file) => {
            res.header("Content-Type", "text/csv")
            res.header("Content-Disposition", "attachment; filename=\"deleted_inventory_report.csv\"")
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
   getItemLike(req: FastifyRequest<{Params: ILikeItem}>, res: FastifyReply) {
       logger.info(`${req.hostname} requested inventory items like `
           + `${req.params.name}`)
       
       return this.invModel.getItemLike(req.params)
       .then((items) => {
           res.send(items)
       }, error => {
           handleDbError(error, req, res)
       })
    }
}
