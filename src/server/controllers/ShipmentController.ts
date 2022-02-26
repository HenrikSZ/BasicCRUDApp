/**
 * Contains the ShipmentController for anything related to shipments
 */

import ShipmentModel, { ICreateShipment, IUpdateShipmentItem } from "../models/ShipmentModel.js"
import { FastifyRequest, FastifyReply } from "fastify"
import logger from "../logger.js"
import { handleDbError } from "../error_handling.js"
import ItemAssignmentModel from "../models/ItemAssignmentModel.js"

export interface IAccessShipmentParameters {
    shipment_id: number
}

export interface IAccessShipmentItemParameters {
    shipment_id: number,
    item_id: number
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
     * Reads all shipments.
     * 
     * @param req the FastifyRequest from express.js
     * @param res the respons from express.js
     */
    getAllShipments(req: FastifyRequest, res: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested all shipments`)

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
     * @param req the FastifyRequest from express.js. Must contain a valid shipmentId as attribute
     * @param res the FastifyReply from express.js
     */
    getShipment(req: FastifyRequest<{Params: IAccessShipmentParameters}>,
            res: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested shipment with id ${req.params.shipment_id}`)

        return this.shipmentModel.getShipment(req.params.shipment_id)
        .then(results => {
            res.send(results)
        }, (error) => {
            handleDbError(error, req, res)
        })
    }


    /**
     * Creates a shipment from parameters in the FastifyRequest body.
     * 
     * @param req the FastifyRequest from express.js. Must containt a valid shipment attribute.
     * @param res the responss from express.js
     */
    createShipment(req: FastifyRequest<{Body: ICreateShipment}>, res: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested to create a shipment`)

        return this.shipmentModel.createShipment(req.body)
        .then(() => {
            res.send()
        }, (error) => {
            handleDbError(error, req, res)
        })
    }


    /**
     * 
     * @param req the FastifyRequest from express.js.
     * Must contain valid shipmentId and shipmentUpdate attributes.
     * @param res the FastifyReply from express.js
     */
    updateShipment(req: FastifyRequest<{Params: IAccessShipmentParameters}>,
            res: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested to update a shipment`)

        return this.shipmentModel.updateShipment(req.params.shipment_id, req.body)
        .then(() => {
            res.send()
        }, (error) => {
            handleDbError(error, req, res)
        })
    }


    /**
     * Deletes a shipment with the id specified in the FastifyRequest.
     * 
     * @param req the FastifyRequest from express.js. Must contain a valid shipmentId attribute.
     * @param res the FastifyReply from express.js
     */
    deleteShipment(req: FastifyRequest<{Params: IAccessShipmentParameters}>,
            res: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested to delete shipment `
         + `with id ${req.params.shipment_id}`)

        return this.shipmentModel.deleteShipment(req.params.shipment_id)
        .then(() => {
            res.send()
        }, (error) => {
            handleDbError(error, req, res)
        })
    }

    /**
     * 
     * @param req the FastifyRequest from express.js. Muston containt valid shipmentId
     * and itemId, and assignedCount attributes.
     * @param res the resonse from express.js
     */
    updateShipmentItem(req: FastifyRequest<{Params: IAccessShipmentItemParameters,
            Body: IUpdateShipmentItem}>,
            res: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested to delete shipment `
            + `with id ${req.params.shipment_id}`)

        return this.shipmentModel
            .updateShipmentItem(req.params.shipment_id, req.params.item_id,
                req.body)
        .then(() => {
            res.send()
        }, (error) => {
            handleDbError(error, req, res)
        })
    }

    /**
     * Deletes a shipment with the id specified in the FastifyRequest.
     * 
     * @param req the FastifyRequest from express.js. Must contain valid shipmentId
     * and itemId attributes.
     * @param res the FastifyReply from express.js
     */
     deleteShipmentItem(req: FastifyRequest<{Params: IAccessShipmentItemParameters}>,
            res: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested to delete shipment `
            + `with id ${req.params.shipment_id}`)

        return this.itemAssignmentModel
            .deleteShipmentAssignment(req.params.shipment_id,
                req.params.item_id)
        .then(() => {
            res.send()
        }, (error) => {
            handleDbError(error, req, res)
        })
    }


    /**
     * Sends the shipments table as a CSV file.
     * 
     * @param req the FastifyRequest from express.js
     * @param res the FastifyReply from express.js
     */
    exportShipmentsAsCsv(req: FastifyRequest, res: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested shipments table as CSV export`)

        return this.shipmentModel.exportAllShipmentsAsCsv()
        .then(file => {
            res.header("Content-Type", "text/csv")
            res.header("Content-Disposition", "attachment; filename=\"shipments_report.csv\"")
            res.send(file)
        }, error => {
            handleDbError(error, req, res)
        })
    }
}
