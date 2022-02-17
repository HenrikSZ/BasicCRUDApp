/**
 * Contains the ShipmentController for anything related to shipments
 */

import ShipmentModel, { ClientSideShipment } from "../models/ShipmentModel.js"
import { Request, Response, NextFunction } from "express"
import logger from "../logger.js"
import { ErrorResponse, ErrorType, handleDbError } from "../error_handling.js"
import validator from "validator"

declare global{
    namespace Express {
        interface Request {
            shipment: ClientSideShipment,
            shipmentId: number
        }
    }
}

/**
 * Anything about shipments is controlled here
 */
export default class ShipmentController {
    shipmentModel: ShipmentModel

    constructor(shipmentModel: ShipmentModel) {
        this.shipmentModel = shipmentModel
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
                let shipment: ClientSideShipment = {
                    name: body.name,
                    destination: body.destination,
                    items: body.items
                }

                req.shipment = shipment
                next()
                return
            }
        }

        logger.info(`${req.hostname} tried to add shipment`
            + `without valid parameters`)

        const errorBody: ErrorResponse = {
            name: ErrorType.FIELD,
            message: "Some fields of the new shipment contain invalid values"
        }

        res.status(400).send(errorBody)
    }


    /**
     * Checks whether the parameers of the request contain a valid id.
     * 
     * @param req the request from express.js.
     * @param res the response from express.js
     * @param next function to the next middleware
     */
    shipmentIdMiddleware(req: Request, res: Response, next: NextFunction) {
        if (req.params.id && validator.isInt(req.params.id + "", {min: 1})) {
            req.shipmentId = Number.parseInt(req.params.id)
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
     * Deletes a shipment with the id specified in the request.
     * 
     * @param req the request from express.js. Must contain a valid shipmentId attribute.
     * @param res the response from express.js
     */
    deleteShipment(req: Request, res: Response) {
        logger.info(`${req.hostname} requested to delete shipment with id ${req.shipmentId}`)

        return this.shipmentModel.deleteShipment(req.shipmentId)
        .then(() => {
            res.send()
        }, (error) => {
            handleDbError(error, req, res)
        })
    }
}
