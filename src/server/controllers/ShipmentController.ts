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
     * @param req the request from Fastify
     * @param res the response from Fastify
     */
    getAllShipments(req: FastifyRequest, rep: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested all shipments`)

        return this.shipmentModel.getAllShipments()
        .then(results => {
            rep.send(results)
        }, (error) => {
            handleDbError(error, req, rep)
        })
    }


    /**
     * Reads one shipment specified by its id.
     * 
     * @param req the request from Fastify
     * @param res the reply from Fastify
     */
    getShipment(req: FastifyRequest<{Params: IAccessShipmentParameters}>,
            rep: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested shipment with id ${req.params.shipment_id}`)

        return this.shipmentModel.getShipment(req.params.shipment_id)
        .then(results => {
            rep.send(results)
        }, (error) => {
            handleDbError(error, req, rep)
        })
    }


    /**
     * Creates a shipment from parameters in the request body.
     * 
     * @param req the request from Fastify
     * @param res the reply from Fastify
     */
    createShipment(req: FastifyRequest<{Body: ICreateShipment}>, rep: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested to create a shipment`)

        return this.shipmentModel.createShipment(req.body)
        .then(() => {
            rep.send()
        }, (error) => {
            handleDbError(error, req, rep)
        })
    }


    /**
     * Updates one shipment from the parameters in the request body.
     * 
     * @param req the request from Fastify
     * @param res the reply from Fastify
     */
    updateShipment(req: FastifyRequest<{Params: IAccessShipmentParameters}>,
            rep: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested to update a shipment`)

        return this.shipmentModel.updateShipment(req.params.shipment_id, req.body)
        .then(() => {
            rep.send()
        }, (error) => {
            handleDbError(error, req, rep)
        })
    }


    /**
     * Deletes a shipment with the id specified in the FastifyRequest.
     * 
     * @param req the request from Fastify
     * @param res the reply from Fastify
     */
    deleteShipment(req: FastifyRequest<{Params: IAccessShipmentParameters}>,
            rep: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested to delete shipment `
         + `with id ${req.params.shipment_id}`)

        return this.shipmentModel.deleteShipment(req.params.shipment_id)
        .then(() => {
            rep.send()
        }, (error) => {
            handleDbError(error, req, rep)
        })
    }


    /**
     * 
     * @param req the request from Fastify
     * @param rep the reply from Fastify
     */
    updateShipmentItem(req: FastifyRequest<{Params: IAccessShipmentItemParameters,
            Body: IUpdateShipmentItem}>,
            rep: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested to delete shipment `
            + `with id ${req.params.shipment_id}`)

        return this.shipmentModel
            .updateShipmentItem(req.params.shipment_id, req.params.item_id,
                req.body)
        .then(() => {
            rep.send()
        }, (error) => {
            handleDbError(error, req, rep)
        })
    }


    /**
     * Deletes a shipment with the id specified in the FastifyRequest.
     * 
     * @param req the request from Fastify
     * @param rep the reply from Fastify
     */
     deleteShipmentItem(req: FastifyRequest<{Params: IAccessShipmentItemParameters}>,
            rep: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested to delete shipment `
            + `with id ${req.params.shipment_id}`)

        return this.itemAssignmentModel
            .deleteShipmentAssignment(req.params.shipment_id,
                req.params.item_id)
        .then(() => {
            rep.send()
        }, (error) => {
            handleDbError(error, req, rep)
        })
    }


    /**
     * Sends the shipments table as a CSV file.
     * 
     * @param req the request from Fastify
     * @param rep the reply from Fastify
     */
    exportShipmentsAsCsv(req: FastifyRequest, rep: FastifyReply) {
        logger.info(`${req.hostname} FastifyRequested shipments table as CSV export`)

        return this.shipmentModel.exportAllShipmentsAsCsv()
        .then(file => {
            rep.header("Content-Type", "text/csv")
            rep.header("Content-Disposition", "attachment; filename=\"shipments_report.csv\"")
            rep.send(file)
        }, error => {
            handleDbError(error, req, rep)
        })
    }
}
