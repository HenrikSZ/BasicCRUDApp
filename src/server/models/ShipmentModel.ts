/**
 * Contains the ShipmentModel to represent shipments in the database
 */


import { RowDataPacket, OkPacket } from "mysql2"
import { Pool, PoolConnection } from "mysql2/promise"
import { InventoryItem } from "./ItemModel.js"

import { stringify } from "csv-stringify/sync"
import ItemAssignmentModel from "./ItemAssignmentModel.js"
import dbPromise from "../db.js"
 
 
interface MinimalShipment {
    name: string,
    source: string,
    destination: string
}

export interface ClientSideShipment extends MinimalShipment {
    items: { id: number, count: number }[]
}
 
interface Shipment {
    name: string,
    source: string,
    destination: string,
    id: number,
    items?: InventoryItem[]
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
    getAllShipments(): Promise<Shipment[]> {
        let stmt = "SELECT id, name, destination FROM shipments "
            + "ORDER BY id"
        let shipments: Shipment[] | null = null

        return this.dbPromise.query(stmt)
        .then(([results, fields]) => {
            shipments = (results as Shipment[]).map(s => {
                let shipment = {...s}
                shipment.items = []
                return shipment
            })
            stmt = "SELECT item_assignments.shipment_id, "
                + "items.name, (-1) * item_assignments.assigned_count AS assigned_count, "
                + "items.id "
                + "FROM item_assignments "
                + "INNER JOIN items ON "
                + "item_assignments.item_id = items.id "
                + "WHERE shipment_id IS NOT NULL "
                + "ORDER BY shipment_id"
            return this.dbPromise.query(stmt)
        }).then(([results, fields]) => {
            let shipment_index = 0
            for (let item of results as MappedInventoryItem[]) {
                while (shipments[shipment_index].id !== item.shipment_id) {
                    shipment_index++
                }

                shipments[shipment_index].items.push(item as InventoryItem)
            }

            return shipments
        })
    }


    /**
     * Reads one shipment from the database.
     * 
     * @param id the id of the shipment that should be read.
     * @returns the shipment identified by the id, if it exists. Otherwise null.
     */
    getShipment(id: number): Promise<Shipment> {
        let stmt = "SELECT id, name, source, destination FROM shipments WHERE id = ?"
        let shipment: Shipment | null = null

        return this.dbPromise.query(stmt, id)
        .then(([results, fields]) => {
            shipment = (results as RowDataPacket)[0] as Shipment
            stmt = "SELECT item_assignments.shipment_id, items.name, "
                + "-item_assignments.assigned_count AS assigned_count, "
                + "items.id "
                + "FROM item_assignments "
                + "INNER JOIN items ON "
                + "item_assignments.item_id = items.id "
                + "WHERE item_assignments.shipment_id = ?";
            return this.dbPromise.query(stmt, id)
        }).then(([results, fields]) => {
            shipment.items = []

            for (let item of results as InventoryItem[]) {
                shipment.items.push(item)
            }
            
            return shipment
        })
    }


    /**
     * Inserts a shipments into the database.
     * 
     * @param shipment the basic info of the shipment.
     * @returns the id of this shipment.
     */
    createShipment(shipment: ClientSideShipment): Promise<number> {
        let insertShipment = {
            name: shipment.name,
            source: shipment.source,
            destination: shipment.destination
        }

        let shipmentId = 0
        let conn: PoolConnection | null = null

        return this.dbPromise.getConnection()
        .then((connection) => {
            conn = connection
            return conn.beginTransaction()
        })
        .then(() => {
            let stmt = "INSERT INTO shipments SET ?"
            return conn.query(stmt, insertShipment)
        })
        .then(([results, fields]) => {
            results = results as OkPacket
            shipmentId = results.insertId

            let promises = []

            for (let item of shipment.items) {
                let promise = this.assignmentModel
                    .create(item.id, -item.count, shipmentId, undefined, conn)

                promises.push(promise)
            }

            return Promise.all(promises)
        })
        .then(() => {
            conn.commit()
            conn.release()
            return shipmentId
        })
        .catch((error) => {
            conn.rollback()
            conn.release()
            return Promise.reject(error)
        })
    }


    /**
     * Deletes a shipment and all dependent objects from the database.
     * 
     * @param id the id of the shipment that should be deleted.
     * @returns true if a shipment was deleted, false otherwise.
     */    
    deleteShipment(id: number): Promise<Boolean> {
        const stmt = "DELETE FROM shipments WHERE id = ?"
        return this.dbPromise.query(stmt, id)
        .then(([results, fields]) => {
            results = results as OkPacket
            return results.affectedRows > 0
        })
    }


    /**
     * Deletes an item assignment of a shipment.
     * 
     * @param shipmentId the id of the shipment this item is contained in
     * @param itemId the id of the item to be deleted
     * @returns true if an assignment could be deleted, false otherwise
     */
    deleteShipmentItem(shipmentId: number, itemId: number) {
        return this.assignmentModel.deleteShipmentAssignment(shipmentId, itemId)
    }


    /**
     * Updates an assignment of a shipment to have a new item count.
     * 
     * @param shipmentId the id of the shipment to update
     * @param itemId the id of the item to update
     * @param newCount the new count the shipment item should have
     * @returns true if an item could be updated, false otherwise
     */
    updateShipmentItem(shipmentId: number, itemId: number, newCount: number) {
        return this.assignmentModel.updateShipmentAssignment(shipmentId, itemId, newCount)
    }


    /**
     * Exports shipment, source, destination, item_name, count for all items
     * in CSV format.
     * 
     * @returns a string in CSV format containing the fields.
     */
    exportAllShipmentsAsCsv() {
        const stmt = "SELECT shipments.name AS shipment, "
            + "shipments.source, shipments.destination, "
            + "items.name AS item_name, -item_assignments.assigned_count AS count "
            + "FROM item_assignments "
            + "INNER JOIN shipments ON "
            + "shipments.id = item_assignments.shipment_id "
            + "INNER JOIN items ON "
            + "items.id = item_assignments.item_id "
            + "ORDER BY shipments.id, items.id"

        return this.dbPromise.query(stmt)
        .then(([items, fields]) => {
            return stringify(items as RowDataPacket[], {
                header: true,
                columns: ["shipment", "source", "destination", "item_name", "count"]
            })
        })
    }
}
