/**
 * Contains the AssignemntModel to represent item assignments in the database
 */


import { OkPacket, RowDataPacket } from "mysql2"
import { Pool, PoolConnection } from "mysql2/promise"
import dbPromise from "../db.js"
import { handleDbError } from "../errors.js"
 
 
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
    async create(itemId: number, assignedCount: number,
            shipmentId?: number,
            externalItemAssignmentId?: number,
            dbPromise: Pool | PoolConnection = this.dbPromise): Promise<number> {
        try {
            const stmt = "INSERT INTO item_assignments "
            + "(item_id, assigned_count, shipment_id, external_assignment_id) "
            + "VALUES (?, ?, ?, ?)"
            let [results, fields] = await dbPromise.query(stmt,
                [itemId, assignedCount, shipmentId, externalItemAssignmentId])

                results = results as OkPacket
                return results.insertId
        } catch (error) {
            handleDbError(error)
        }
    }
    
    /**
     * Deletes an assignment from the database.
     * 
     * @param id the id of the assignment.
     * @returns true if an assignment was deleted, false otherwise.
     */
    async delete(id: number): Promise<Boolean> {
        try {
            const stmt = "DELETE FROM item_assignments WHERE id = ?"
            let [results, fields] = await this.dbPromise.query(stmt, id)

            results = results as OkPacket
            return results.affectedRows > 0
        } catch (error) {
            handleDbError(error)
        }
    }


    /**
     * Updates the assigned count of an assignment of a shipment item
     * 
     * @param shipmentId the id of the shipment this item is contained in
     * @param itemId the id of the item to be updated
     * @param assignedCount the new count this item should have
     * @returns true if an assignment could be updated, false otherwise
     */
    async updateShipmentAssignment(shipmentId: number, itemId: number,
            assignedCount: number) {
        try {
            const stmt = "UPDATE item_assignments SET assigned_count = ? "
                + "WHERE shipment_id = ? AND item_id = ?"
            let [results, fields] = await this.dbPromise.query(stmt,
                [assignedCount, shipmentId, itemId])
                
            results = results as OkPacket
            return results.affectedRows > 0
        } catch (error) {
            handleDbError(error)
        }
    }


    /**
     * Deletes an item assignment of a shipment.
     * 
     * @param shipmentId the id of the shipment this item is contained in
     * @param itemId the id of the item to be deleted
     * @returns true if an assignment could be deleted, false otherwise
     */
    async deleteShipmentAssignment(shipmentId: number, itemId: number) {
        try {
            const stmt = "DELETE FROM item_assignments "
                + "WHERE shipment_id = ? AND item_id = ?"
            let [results, fields] = await this.dbPromise.query(stmt, [shipmentId, itemId])

            results = results as OkPacket
            return results.affectedRows > 0
        } catch (error) {
            handleDbError(error)
        }
    }
}
 