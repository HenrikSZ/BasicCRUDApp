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
 
 
 export default class AssignmentModel {
    /**
     * Inserts an assignment into the database.
     * 
     * @param itemId the item id of the assignment.
     * @param assignedCount the amount of items that should be assigned.
     * @returns the id of the inserted assignment.
     */
    insert(itemId: number, assignedCount: number,
            conn: Pool | PoolConnection = dbPromise): Promise<number> {
        logger.debug(`Inserting assignment of ${assignedCount} `
            +`for item "${itemId}"`)

        const stmt = "INSERT INTO item_assignments (item_id, assigned_count) VALUES (?, ?)"
        return conn.query(stmt, [itemId, assignedCount])
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
    delete(id: number, conn: Pool | PoolConnection = dbPromise):
            Promise<Boolean> {
        logger.debug(`Deleting from assignments table with id "${id}"`)

        const stmt = "DELETE FROM item_assignments WHERE id = ?"
        return conn.query(stmt, id)
        .then(([results, fields]) => {
            results = results as OkPacket
            return results.affectedRows > 0
        })
    }
}
 