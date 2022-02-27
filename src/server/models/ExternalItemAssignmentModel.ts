/**
 * Contains the AssignemntModel to represent item assignments in the database
 */


import { Pool, OkPacket } from "mysql2/promise"
import dbPromise from "../db.js"


export default class ExternalItemAssignmentModel {
    dbPromise: Pool

    constructor(_dbPromise: Pool = dbPromise) {
        this.dbPromise = _dbPromise
    }


    /**
     * Inserts an ExternalItemAssignment
     * 
     * @returns the id of the inserted ExternalItemAssignment
     */
    async create(): Promise<number> {
        const stmt = "INSERT INTO external_item_assignments VALUES()"

        let [results, fields] = await this.dbPromise.query(stmt)
        results = results as OkPacket
        
        return results.insertId
    }


    /**
     * Deletes an ExternalItemAssignment
     * 
     * @param id the id of the ExternalItemAssignment which should be deleted
     * @returns true if an ExternalItemAssignment could be deleted
     */
    async delete(id: number): Promise<Boolean> {
        const stmt = "DELETE FROM external_item_assignments WHERE id = ?"

        let [results, fields] = await this.dbPromise.query(stmt, id)
        results = results as OkPacket

        return results.affectedRows > 0
    }
}
