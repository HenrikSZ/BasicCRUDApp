/**
 * Contains the AssignemntModel to represent item assignments in the database
 */


import { OkPacket, RowDataPacket } from "mysql2"
import { Pool, PoolConnection } from "mysql2/promise"
import dbPromise from "../db.js"
import logger from "../logger.js"
 
 
interface MinimalDeletion extends RowDataPacket {
    comment: string 
}


interface Deletion extends MinimalDeletion {
    id: number,
    created_at: Date,
    updated_at: Date
}
 

export default class ItemAssignmentModel {
    dbPromise: Pool

    constructor(_dbPromise: Pool = dbPromise) {
        this.dbPromise = _dbPromise
    }

    /**
     * Inserts an assignment into the database.
     * 
     * @param itemId the item id of the assignment.
     * @param assignedCount the amount of items that should be assigned.
     * @returns the id of the inserted assignment.
     */
    create(itemId: number, assignedCount: number,
            shipmentId?: number,
            externalItemAssignmentId?: number,
            dbPromise: Pool | PoolConnection = this.dbPromise): Promise<number> {
        logger.debug(`Inserting assignment of ${assignedCount} `
            +`for item "${itemId}"`)

        const stmt = "INSERT INTO item_assignments "
            + "(item_id, assigned_count, shipment_id, external_assignment_id) "
            + "VALUES (?, ?, ?, ?)"
        return dbPromise.query(stmt,
            [itemId, assignedCount, shipmentId, externalItemAssignmentId])
        .then(([results, fields]) => {
            results = results as OkPacket
            return results.insertId
        })
    }
    
    /**
     * Deletes an assignment from the database.
     * 
     * @param id the id of the assignment.
     * @returns true if an assignment was deleted, false otherwise.
     */
    delete(id: number): Promise<Boolean> {
        logger.debug(`Deleting from assignments table with id "${id}"`)

        const stmt = "DELETE FROM item_assignments WHERE id = ?"
        return this.dbPromise.query(stmt, id)
        .then(([results, fields]) => {
            results = results as OkPacket
            return results.affectedRows > 0
        })
    }


    /**
     * Updates the assigned count of an assignment of a shipment item
     * 
     * @param shipmentId the id of the shipment this item is contained in
     * @param itemId the id of the item to be updated
     * @param assignedCount the new count this item should have
     * @returns true if an assignment could be updated, false otherwise
     */
    updateShipmentAssignment(shipmentId: number, itemId: number, assignedCount: number) {
        logger.debug(`Updating in assignments table with `
            + `shipment_id ${shipmentId} and item_id ${itemId} to count ${assignedCount}`)

        const stmt = "UPDATE item_assignments SET assigned_count = ? "
            + "WHERE shipment_id = ? AND item_id = ?"
        return this.dbPromise.query(stmt, [assignedCount, shipmentId, itemId])
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
    deleteShipmentAssignment(shipmentId: number, itemId: number) {
        logger.debug(`Deleting from assignments table with `
            + `shipment_id ${shipmentId} and item_id ${itemId}`)

        const stmt = "DELETE FROM item_assignments "
            + "WHERE shipment_id = ? AND item_id = ?"
        return this.dbPromise.query(stmt, [shipmentId, itemId])
        .then(([results, fields]) => {
            results = results as OkPacket
            return results.affectedRows > 0
        })
    }
}
 