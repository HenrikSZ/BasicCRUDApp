/**
 * Contains the ShipmentController for anything related to shipments
 */

import { FastifyRequest, FastifyReply } from "fastify"

import ShipmentModel, { ICreateShipment, IUpdateShipmentItem } from "../models/ShipmentModel.js"
import ItemAssignmentModel from "../models/ItemAssignmentModel.js"
import { FieldError } from "../errors.js"


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
    async getAllShipments(req: FastifyRequest, rep: FastifyReply) {
        req.log.info(`${req.hostname} requested all shipments`)
        
        const shipments = await this.shipmentModel.getAllShipments()
        rep.send(shipments)
    }


    /**
     * Reads one shipment specified by its id.
     * 
     * @param req the request from Fastify
     * @param res the reply from Fastify
     */
    async getShipment(req: FastifyRequest<{Params: IAccessShipmentParameters}>,
            rep: FastifyReply) {
        req.log.info(`${req.hostname} requested shipment with id ${req.params.shipment_id}`)

        const shipment = await this.shipmentModel.getShipment(req.params.shipment_id)
        if (shipment) {
            rep.send(shipment)
        } else {
            throw new FieldError("shipment_id")
        }
    }


    /**
     * Creates a shipment from parameters in the request body.
     * 
     * @param req the request from Fastify
     * @param res the reply from Fastify
     */
    async createShipment(req: FastifyRequest<{Body: ICreateShipment}>, rep: FastifyReply) {
        req.log.info(`${req.hostname} requested to create a shipment`)

        await this.shipmentModel.createShipment(req.body)
        rep.send()
    }


    /**
     * Updates one shipment from the parameters in the request body.
     * 
     * @param req the request from Fastify
     * @param res the reply from Fastify
     */
    async updateShipment(req: FastifyRequest<{Params: IAccessShipmentParameters}>,
            rep: FastifyReply) {
        req.log.info(`${req.hostname} requested to update a shipment`)

        let wasUpdated = await this.shipmentModel.updateShipment(
            req.params.shipment_id, req.body)
        if (wasUpdated) {
            rep.send()
        } else {
            throw new FieldError("shipment_id")
        }
    }


    /**
     * Deletes a shipment with the id specified in the FastifyRequest.
     * 
     * @param req the request from Fastify
     * @param res the reply from Fastify
     */
    async deleteShipment(req: FastifyRequest<{Params: IAccessShipmentParameters}>,
            rep: FastifyReply) {
        req.log.info(`${req.hostname} requested to delete shipment `
            + `with id ${req.params.shipment_id}`)

        await this.shipmentModel.deleteShipment(req.params.shipment_id)
        rep.send()
    }


    /**
     * 
     * @param req the request from Fastify
     * @param rep the reply from Fastify
     */
    async updateShipmentItem(req: FastifyRequest<{Params: IAccessShipmentItemParameters,
            Body: IUpdateShipmentItem}>,
            rep: FastifyReply) {
        req.log.info(`${req.hostname} requested to delete shipment `
            + `with id ${req.params.shipment_id}`)
        
        await this.shipmentModel.updateShipmentItem(req.params.shipment_id,
            req.params.item_id, req.body)
        rep.send()
    }


    /**
     * Deletes a shipment with the id specified in the FastifyRequest.
     * 
     * @param req the request from Fastify
     * @param rep the reply from Fastify
     */
    async deleteShipmentItem(req: FastifyRequest<{Params: IAccessShipmentItemParameters}>,
            rep: FastifyReply) {
        req.log.info(`${req.hostname} requested to delete shipment `
            + `with id ${req.params.shipment_id}`)

        await this.itemAssignmentModel.deleteShipmentAssignment(
            req.params.shipment_id, req.params.item_id)
        rep.send()
    }


    /**
     * Sends the shipments table as a CSV file.
     * 
     * @param req the request from Fastify
     * @param rep the reply from Fastify
     */
    async exportShipmentsAsCsv(req: FastifyRequest, rep: FastifyReply) {
        req.log.info(`${req.hostname} requested shipments table as CSV export`)
        
        const file = await this.shipmentModel.exportAllShipmentsAsCsv()
        rep.header("Content-Type", "text/csv")
        rep.header("Content-Disposition", "attachment; filename=\"shipments_report.csv\"")
        rep.send(file)
    }
}
