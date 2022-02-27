/**
 * Contains the ShipmentModel to represent shipments in the database
 */


import { RowDataPacket, OkPacket } from "mysql2"
import { Pool } from "mysql2/promise"
import { InventoryItem } from "./ItemModel.js"

import { stringify } from "csv-stringify/sync"
import ItemAssignmentModel from "./ItemAssignmentModel.js"
import dbPromise from "../db.js"
 

export interface ICreateShipment extends RowDataPacket {
    name: string,
    source: string,
    destination: string,
    items: { id: number, count: number }[]
}
 
interface Shipment {
    name: string,
    source: string,
    destination: string,
    id: number,
    items?: InventoryItem[]
}

export interface IUpdateShipment {
    name?: string,
    source?: string,
    destination?: string,
}

export interface IUpdateShipmentItem {
    assigned_count?: number
}

interface MappedInventoryItem extends InventoryItem {
    shipment_id: number
}


export default class ShipmentModel {
    dbPromise: Pool
    assignmentModel: ItemAssignmentModel

    constructor(_dbPromise: Pool = dbPromise,
            assignmentModel: ItemAssignmentModel = new ItemAssignmentModel(_dbPromise)) {
        this.dbPromise = _dbPromise
        this.assignmentModel = assignmentModel
    }


    /**
     * Reads all shipments from the database that are not deleted.
     * 
     * @returns all shipments in the database.
     */
    async getAllShipments(): Promise<Shipment[]> {
        let stmt = "SELECT id, name, source, destination FROM shipments "
            + "ORDER BY id"
        let shipments: Shipment[] | null = null

        let [results, fields] = await this.dbPromise.query(stmt)
        shipments = (results as Shipment[]).map(s => {
            let shipment = { ...s }
            shipment.items = []
            return shipment
        })

        stmt = "SELECT item_assignments.shipment_id, "
            + "items.name, item_assignments.assigned_count AS assigned_count, "
            + "items.id "
            + "FROM item_assignments "
            + "INNER JOIN items ON "
            + "item_assignments.item_id = items.id "
            + "WHERE shipment_id IS NOT NULL "
            + "ORDER BY shipment_id";

        [results, fields] = await this.dbPromise.query(stmt)
        let shipment_index = 0
        for (let item of results as MappedInventoryItem[]) {
            while (shipments[shipment_index].id !== item.shipment_id) {
                shipment_index++
            }

            shipments[shipment_index].items.push(item as InventoryItem)
        }

        return shipments
    }


    /**
     * Reads one shipment from the database.
     * 
     * @param id the id of the shipment that should be read.
     * @returns the shipment identified by the id, if it exists. Otherwise null.
     */
    async getShipment(id: number): Promise<Shipment> {
        let stmt = "SELECT id, name, source, destination FROM shipments WHERE id = ?"
        let shipment: Shipment | null = null

        let [results, fields] = await this.dbPromise.query(stmt, id)
        shipment = (results as RowDataPacket)[0] as Shipment
        stmt = "SELECT item_assignments.shipment_id, items.name, "
            + "item_assignments.assigned_count AS assigned_count, "
            + "items.id "
            + "FROM item_assignments "
            + "INNER JOIN items ON "
            + "item_assignments.item_id = items.id "
            + "WHERE item_assignments.shipment_id = ?";

        [results, fields] = await this.dbPromise.query(stmt, id)
        shipment.items = []
        for (let item of results as InventoryItem[]) {
            shipment.items.push(item)
        }

        return shipment
    }


    /**
     * Inserts a shipments into the database.
     * 
     * @param shipment the basic info of the shipment.
     * @returns the id of this shipment.
     */
    async createShipment(values: ICreateShipment): Promise<number> {
        let connection = null

        try {
            connection = await this.dbPromise.getConnection()
            await connection.beginTransaction()

            let stmt = "INSERT INTO shipments SET ?"
            let shipmentValues = {...values}
            delete shipmentValues.items
            let [results, fields] = await connection.query(stmt, shipmentValues)
            results = results as OkPacket

            let shipmentId = results.insertId

            for (let item of values.items) {
                await this.assignmentModel.create(
                    item.id, item.count, shipmentId, undefined, connection)
            }

            await connection.commit()
            return shipmentId
        } catch (error) {
            if (connection) {
                await connection.rollback()
            }   
            throw error
        } finally {
            connection.release()
        }
    }


    /**
     * Updates a shipment to the values specified.
     * 
     * @param id the id of the shipment that should be updated.
     * @param values the values the shipment should be updated to.
     *  Can be an empty object (nothing happens).
     * @returns true if a shipment was updated, false otherwise.
     */
    async updateShipment(id: number, values: IUpdateShipment): Promise<Boolean> {
        if (Object.keys(values).length == 0) {
            return Promise.resolve(false)
        }

        const stmt = "UPDATE shipments SET ? WHERE id = ?"

        let [results, fields] = await this.dbPromise.query(stmt, [values, id])
        results = results as OkPacket

        return results.affectedRows > 0
    }


    /**
     * Deletes a shipment and all dependent objects from the database.
     * 
     * @param id the id of the shipment that should be deleted.
     * @returns true if a shipment was deleted, false otherwise.
     */    
    async deleteShipment(id: number): Promise<Boolean> {
        const stmt = "DELETE FROM shipments WHERE id = ?"

        let [results, fields] = await this.dbPromise.query(stmt, id)
        results = results as OkPacket

        return results.affectedRows > 0
    }


    /**
     * Deletes an item assignment of a shipment.
     * 
     * @param shipmentId the id of the shipment this item is contained in
     * @param itemId the id of the item to be deleted
     * @returns true if an assignment could be deleted, false otherwise
     */
    async deleteShipmentItem(shipmentId: number, itemId: number) {
        await this.assignmentModel.deleteShipmentAssignment(shipmentId, itemId)
    }


    /**
     * Updates an assignment of a shipment to have a new item count.
     * 
     * @param shipmentId the id of the shipment to update
     * @param itemId the id of the item to update
     * @param values the properties of the item that should be updated
     * @returns true if an item could be updated, false otherwise
     */
    async updateShipmentItem(shipmentId: number, itemId: number,
            values: IUpdateShipmentItem) {
        await this.assignmentModel.updateShipmentAssignment(
            shipmentId, itemId, values.assigned_count)
    }


    /**
     * Exports shipment, source, destination, item_name, count for all items
     * in CSV format.
     * 
     * @returns a string in CSV format containing the fields.
     */
    async exportAllShipmentsAsCsv() {
        const stmt = "SELECT shipments.name AS shipment, "
            + "shipments.source, shipments.destination, "
            + "items.name AS item_name, item_assignments.assigned_count AS count "
            + "FROM item_assignments "
            + "INNER JOIN shipments ON "
            + "shipments.id = item_assignments.shipment_id "
            + "INNER JOIN items ON "
            + "items.id = item_assignments.item_id "
            + "ORDER BY shipments.id, items.id"

        const [items, fields] = await this.dbPromise.query(stmt)
        return stringify(items as RowDataPacket[], {
            header: true,
            columns: ["shipment", "source", "destination", "item_name", "count"]
        })
    }
}
