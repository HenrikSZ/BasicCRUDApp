/**
 * Contains the InventoryController for anything related to the inventory
 */

import { FastifyReply, FastifyRequest } from "fastify"
import { stringify } from "csv-stringify/sync"

import DeletionModel, { ICreateDeletion } from "../models/DeletionModel.js"
import ItemModel, { ICreateItem, ILikeItem, IUpdateItem } from "../models/ItemModel.js"
import { FieldError } from "../errors.js"


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
     * json array.
     *
     * @param req the request from Fastify
     * @param rep the reply from Fastify
     */
    async getInventory(req: FastifyRequest, rep: FastifyReply) {
        req.log.info(`${req.hostname} requested all inventory entries`)

        const results = await this.invModel.getAllItems()
        rep.send(results)
    }


    /**
     * Reads one item specified from the id in the request parameters (url)
     * from the inventory and sends it as a json object
     *
     * @param req the request from Fastify
     * @param rep the reply from Fastify
     */
    async getInventoryItem(req: FastifyRequest<{
        Params: IAccessItemParameters
      }>, rep: FastifyReply) {
        req.log.info(`${req.hostname} requested inventory entry with `
            + `id ${req.params.item_id}`)

        const item = await this.invModel.getItem(req.params.item_id)
        if (item) {
            rep.send(item)
        } else {
            req.log.info(`${req.hostname} requested unavailable inventory `
                + `entry id ${req.params.item_id}`)

            throw new FieldError("item_id")
        }
    }


    /**
     * Reads all delete entries from the inventory and sends all their fields as a
     * json array
     *
     * @param req the request from Fastify
     * @param rep the reply from Fastify
     */
    async getDeletedInventory(req: FastifyRequest, rep: FastifyReply) {
        req.log.info(`${req.hostname} requested all deleted inventory entries`)

        const results = await this.invModel.getAllDeletedItems()
        rep.send(results)
    }


    /**
     * Creates a new inventory item from the fields specified in the
     * request body.
     *
     * @param req the request from Fastify
     * @param res the reply from Fastify
     */
    async postNewInventoryItem(req: FastifyRequest<{Body: ICreateItem}>, res: FastifyReply) {
        const insertId = await this.invModel.createItem(req.body)
        req.log.info(`${req.hostname} created entry with `
            + `id ${insertId} in inventory`)

        res.status(201).send({
            name: req.body.name,
            count: req.body.count,
            id: insertId
        })
    }

    
    /**
     * Updates an inventory item according to the fields in the request body
     *
     * @param req the request from Fastify
     * @param rep the reply from Fastify
     */
    async updateInventoryItem(req: FastifyRequest<{Params: IAccessItemParameters,
            Body: IUpdateItem}>,
            rep: FastifyReply) {
        req.log.info(`${req.hostname} requested to update entry `
                + `${req.params.item_id} in inventory`)

        const wasUpdated = await this.invModel.updateItem(req.body, req.params.item_id)
        if (wasUpdated) {
            rep.send()
        } else {
            req.log.info(`${req.hostname} tried to update non-existent `
                + `entry with id ${req.params.item_id} in inventory`)

            throw new FieldError("item_id")
        }
    }


    /**
     * Restores a delete inventory item that has the id specified in the request
     * parameters (url)
     *
     * @param req the request from Fastify
     * @param res the reply from Fastify
     */
    async restoreInventoryItem(req: FastifyRequest<{Params: IAccessItemParameters}>,
            rep: FastifyReply) {
        req.log.info(`${req.hostname} requested to restore inventory entry `
            + `id ${req.params.item_id}`)
        
        const deletionId = await this.invModel.getDeletionId(req.params.item_id)
        if (deletionId !== -1) {
            const wasDeleted = await this.deletionModel.delete(deletionId)

            if (wasDeleted) {
                rep.send()
            } else {
                throw new FieldError("item_id")
            }
        } else {
            req.log.info(`${req.hostname} tried to restore entry `
                + `id ${req.params.item_id} in inventory which is not deleted`)

           throw new FieldError("item_id")
        }
    }


    /**
     * Deletes an inventory item with a comment set as field in the
     * request body
     *
     * @param req the request from Fastify
     * @param res the reponse from Fastify
     */
    async deleteInventoryItem(
            req: FastifyRequest<{Params: IAccessItemParameters, Body: ICreateDeletion}>,
            rep: FastifyReply) {
        req.log.info(`${req.hostname} requested to delete inventory entry `
            + `id ${req.params.item_id}`)
        
        const deletionId = await this.invModel.getDeletionId(req.params.item_id)
    
        if (deletionId === -1 || deletionId > 0) {
           throw new FieldError("item_id")
        } else {
            const insertId = await this.deletionModel.create(req.body)
            await this.invModel.updateItem(
                { deletion_id: insertId }, req.params.item_id)
            rep.send()
        }
    }


    /**
     * Exports the inventory table as csv.
     * 
     * @param req the request from Fastify
     * @param rep the reply from Fastify
     */
    async exportInventoryAsCsv(req: FastifyRequest, rep: FastifyReply) {
        req.log.info(`${req.hostname} requested csv report of the inventory`)

        const items = await this.invModel.getAllItems()
        const file = stringify(items, {
            header: true,
            columns: ["id", "name", "count"]
        })

        rep.header("Content-Type", "text/csv")
        rep.header("Content-Disposition", "attachment; filename=\"inventory_report.csv\"")
        rep.send(file)
    }


    /**
     * Exports the inventory table as csv.
     * 
     * @param req the request from Fastify
     * @param rep the reply from Fastify
     */
    async exportDeletedInventoryAsCsv(req: FastifyRequest, rep: FastifyReply) {
        req.log.info(`${req.hostname} requested csv report of the deleted inventory`)

        const items = await this.invModel.getAllDeletedItems()
        const file = stringify(items, {
            header: true,
            columns: ["id", "name", "count", "comment"]
        })
        rep.header("Content-Type", "text/csv")
        rep.header("Content-Disposition", "attachment; filename=\"deleted_inventory_report.csv\"")
        rep.send(file)
    }


    /** Returns items that have a part of that in their name
    * 
    * @param req the request from Fastify.
    * @param res the reply from Fastify.
    */
    async getItemLike(req: FastifyRequest<{Params: ILikeItem}>, res: FastifyReply) {
        req.log.info(`${req.hostname} requested inventory items like `
            + `${req.params.name}`)

        const items = await this.invModel.getItemLike(req.params)
        res.send(items)
    }
}
