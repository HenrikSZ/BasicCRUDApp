/**
 * Contains the AssignemntModel to represent item assignments in the database
 */


import { OkPacket, RowDataPacket } from "mysql2"
import { Pool } from "mysql2/promise"
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
    dbPromise: Pool

    constructor(dbPromise: Pool) {
        this.dbPromise = dbPromise
    }

    /**
     * Inserts an assignment into the database.
     * 
     * @param itemId the item id of the assignment.
     * @param assignedCount the amount of items that should be assigned.
     * @returns the id of the inserted assignment.
     */
    insert(itemId: number, assignedCount: number): Promise<number> {
        logger.debug(`Inserting assignment of ${assignedCount} `
            +`for item "${itemId}"`)

        const stmt = "INSERT INTO item_assignments (item_id, assigned_count) VALUES (?, ?)"
        return this.dbPromise.query(stmt, [itemId, assignedCount])
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
}
 