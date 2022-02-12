/**
 * Contains the ShipmentController for anything related to shipments
 */

import ShipmentModel, { ClientSideShipment } from "../models/ShipmentModel"
import { Request, Response, NextFunction } from "express"
import logger from "../logger"
import { ErrorResponse, ErrorType, handleDbError } from "../error_handling"
import validator from "validator"

declare global{
    namespace Express {
        interface Request {
            shipment: ClientSideShipment
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
                && validator.isAlphanumeric(body.name)
                && validator.isAlphanumeric(body.destination)
                && Array.isArray(body.items)
                && body.items.length > 0) {
            let allItemsValid = true
            for (let item of body.items) {
                if (!validator.isNumeric(item)) {
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
     * Reads all shipments.
     * 
     * @param req the request from express.js
     * @param res the respons from express.js
     */
    getAllShipments(req: Request, res: Response) {
        logger.info(`${req.hostname} requested all inventory entries`)

        return this.shipmentModel.getAllShipments()
        .then(results => {
            logger.info(`${req.hostname} requested all shipments`)

            res.send(results)
        }, (error) => {
            handleDbError(error, req, res)
        })
    }


    /**
     * Creates a shipment from parameters in the request body.
     * 
     * @param req the request from express.js
     * @param res the respons from express.js
     */
    createShipment(req: Request, res: Response) {

    }
}
