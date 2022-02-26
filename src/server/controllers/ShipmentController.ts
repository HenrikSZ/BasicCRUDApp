/**
 * Contains the ShipmentController for anything related to shipments
 */

import ShipmentModel, { ShipmentCreateData, ShipmentUpdateData } from "../models/ShipmentModel.js"
import { Request, Response, NextFunction } from "express"
import logger from "../logger.js"
import { ErrorResponse, ErrorType, handleDbError } from "../error_handling.js"
import validator from "validator"
import ItemAssignmentModel from "../models/ItemAssignmentModel.js"

declare global {
    namespace Express {
        interface Request {
            shipment: ShipmentCreateData,
            shipmentUpdate: ShipmentUpdateData,
            shipmentId: number,
            itemId: number,
            assignedCount: number
        }
    }
}

/**
 * Anything about shipments is controlled here
 */
export default class ShipmentController {
    shipmentModel: ShipmentModel
    itemAssignmentModel: ItemAssignmentModel

    constructor(shipmentModel: ShipmentModel = new ShipmentModel(),
            itemAssignmentModel: ItemAssignmentModel = new ItemAssignmentModel()) {
        this.shipmentModel = shipmentModel
        this.itemAssignmentModel = itemAssignmentModel
    }


    /**
     * Sends a 400 code response indicating that some field values were incorrect
     * 
     * @param req the request from express.js
     * @param res the response from express.js
     */
    sendInvalidFieldsResponse(req: Request, res: Response) {
        logger.info(`${req.hostname} tried to use shipment `
        + `without valid parameters`)

        const errorBody: ErrorResponse = {
            name: ErrorType.FIELD,
            message: "Some fields of the new shipment contain invalid values"
        }

        res.status(400).send(errorBody)
    }


    /**
     * Checks whether the body of the request contains a valid shipment
     * 
     * @param req the request from express.js.
     * @param res the response from express.js
     * @param next function to the next middleware
     */
    createShipmentMiddleware(req: Request, res: Response, next: NextFunction) {
        let body = req.body
        if (body.items
                && body.name
                && validator.isLength(body.name, { min: 1})
                && body.source
                && validator.isLength(body.source, { min: 1})
                && body.destination
                && validator.isLength(body.destination, { min: 1})
                && Array.isArray(body.items)
                && body.items.length > 0) {
            let allItemsValid = true
            for (let item of body.items) {
                if (typeof item !== "object"
                    || !item.count
                    || !validator.isInt(item.count + "", {min: 1})
                    || !item.id
                    || !validator.isInt(item.id + "", {min: 1})) {
                    allItemsValid = false
                    break
                }
            }

            if (allItemsValid) {
                let shipment: ShipmentCreateData = {
                    name: body.name,
                    source: body.source,
                    destination: body.destination,
                    items: body.items
                }

                req.shipment = shipment
                next()
                return
            }
        }

        this.sendInvalidFieldsResponse(req, res)
    }


    /**
     * Checks whether the body of the request contains a valid
     * assignedCount attribute.
     * 
     * @param req the request from express.js.
     * @param res the response from express.js
     * @param next function to the next middleware
     */
    assignedCountMiddleware(req: Request, res: Response, next: NextFunction) {
        if (req.body.assigned_count &&
                validator.isInt(req.body.assigned_count + "")) {
            req.assignedCount = Number.parseInt(req.body.assigned_count)
            next()
            return
        }

        logger.info(`${req.hostname} tried to add shipment `
            + `without valid parameters`)

        const errorBody: ErrorResponse = {
            name: ErrorType.FIELD,
            message: "Some fields of the new shipment contain invalid values"
        }

        res.status(400).send(errorBody)
    }


    /**
     * Checks whether the parameers of the request contain a valid shipmentId.
     * 
     * @param req the request from express.js.
     * @param res the response from express.js
     * @param next function to the next middleware
     */
    shipmentIdMiddleware(req: Request, res: Response, next: NextFunction) {
        if (req.params.shipmentId && validator.isInt(req.params.shipmentId + "", {min: 1})) {
            req.shipmentId = Number.parseInt(req.params.shipmentId)
            next()
            return
        }

        logger.info(`${req.hostname} tried to access shipment`
            + `without valid id (${req.params.id})`)

        const errorBody: ErrorResponse = {
            name: ErrorType.FIELD,
            message: "Some fields of the new shipment contain invalid values"
        }

        res.status(400).send(errorBody)
    }


    /**
     * Checks whether any given body parameters are valid and put them as shipmentUpdate
     * in the request.
     * 
     * @param req the request from express.js
     * @param res the respons from express.js
     * @param next function to the next middleware
     */
    updateShipmentMiddleware(req: Request, res: Response, next: NextFunction) {
        let shipmentUpdate: ShipmentUpdateData = {}

        if (req.body.name) {
            if (validator.isLength(req.body.name + "", {min: 1})) {
                shipmentUpdate.name = req.body.name + ""
            } else {
                this.sendInvalidFieldsResponse(req, res)
                return
            }
        }
        if (req.body.source) {
            if (validator.isLength(req.body.source + "", {min: 1})) {
                shipmentUpdate.source = req.body.source + ""
            } else {
                this.sendInvalidFieldsResponse(req, res)
                return
            }
        }
        if (req.body.destination) {
            if (validator.isLength(req.body.destination + "", {min: 1})) {
                shipmentUpdate.destination = req.body.destination + ""
            } else {
                this.sendInvalidFieldsResponse(req, res)
                return
            }
        }

        req.shipmentUpdate = shipmentUpdate

        next()
    }


    /**
     * Reads all shipments.
     * 
     * @param req the request from express.js
     * @param res the respons from express.js
     */
    getAllShipments(req: Request, res: Response) {
        logger.info(`${req.hostname} requested all shipments`)

        return this.shipmentModel.getAllShipments()
        .then(results => {
            res.send(results)
        }, (error) => {
            handleDbError(error, req, res)
        })
    }


    /**
     * Reads one shipment specified by its id.
     * 
     * @param req the request from express.js. Must contain a valid shipmentId as attribute
     * @param res the response from express.js
     */
    getShipment(req: Request, res: Response) {
        logger.info(`${req.hostname} requested shipment with id ${req.shipmentId}`)

        return this.shipmentModel.getShipment(req.shipmentId)
        .then(results => {
            res.send(results)
        }, (error) => {
            handleDbError(error, req, res)
        })
    }


    /**
     * Creates a shipment from parameters in the request body.
     * 
     * @param req the request from express.js. Must containt a valid shipment attribute.
     * @param res the responss from express.js
     */
    createShipment(req: Request, res: Response) {
        logger.info(`${req.hostname} requested to create a shipment`)

        return this.shipmentModel.createShipment(req.shipment)
        .then(() => {
            res.send()
        }, (error) => {
            handleDbError(error, req, res)
        })
    }


    /**
     * 
     * @param req the request from express.js.
     * Must contain valid shipmentId and shipmentUpdate attributes.
     * @param res the response from express.js
     */
    updateShipment(req: Request, res: Response) {
        logger.info(`${req.hostname} requested to update a shipment`)

        return this.shipmentModel.updateShipment(req.shipmentId, req.shipmentUpdate)
        .then(() => {
            res.send()
        }, (error) => {
            handleDbError(error, req, res)
        })
    }


    /**
     * Deletes a shipment with the id specified in the request.
     * 
     * @param req the request from express.js. Must contain a valid shipmentId attribute.
     * @param res the response from express.js
     */
    deleteShipment(req: Request, res: Response) {
        logger.info(`${req.hostname} requested to delete shipment `
         + `with id ${req.shipmentId}`)

        return this.shipmentModel.deleteShipment(req.shipmentId)
        .then(() => {
            res.send()
        }, (error) => {
            handleDbError(error, req, res)
        })
    }

    /**
     * 
     * @param req the request from express.js. Muston containt valid shipmentId
     * and itemId, and assignedCount attributes.
     * @param res the resonse from express.js
     */
    updateShipmentItem(req: Request, res: Response) {
        logger.info(`${req.hostname} requested to delete shipment `
            + `with id ${req.shipmentId}`)

        return this.shipmentModel
            .updateShipmentItem(req.shipmentId, req.itemId,
                { assigned_count: req.assignedCount })
        .then(() => {
            res.send()
        }, (error) => {
            handleDbError(error, req, res)
        })
    }

    /**
     * Deletes a shipment with the id specified in the request.
     * 
     * @param req the request from express.js. Must contain valid shipmentId
     * and itemId attributes.
     * @param res the response from express.js
     */
     deleteShipmentItem(req: Request, res: Response) {
        logger.info(`${req.hostname} requested to delete shipment `
            + `with id ${req.shipmentId}`)

        return this.itemAssignmentModel
            .deleteShipmentAssignment(req.shipmentId, req.itemId)
        .then(() => {
            res.send()
        }, (error) => {
            handleDbError(error, req, res)
        })
    }


    /**
     * Sends the shipments table as a CSV file.
     * 
     * @param req the request from express.js
     * @param res the response from express.js
     */
    exportShipmentsAsCsv(req: Request, res: Response) {
        logger.info(`${req.hostname} requested shipments table as CSV export`)

        return this.shipmentModel.exportAllShipmentsAsCsv()
        .then(file => {
            res.set("Content-Type", "text/csv")
            res.set("Content-Disposition", "attachment; filename=\"shipments_report.csv\"")
            res.send(file)
        }, error => {
            handleDbError(error, req, res)
        })
    }
}
