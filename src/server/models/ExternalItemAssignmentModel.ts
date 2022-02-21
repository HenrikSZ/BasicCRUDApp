/**
 * Contains the AssignemntModel to represent item assignments in the database
 */


import { OkPacket, RowDataPacket } from "mysql2"
import { Pool } from "mysql2/promise"


export default class ExternalItemAssignmentModel {
    dbPromise: Pool

    constructor(dbPromise: Pool) {
        this.dbPromise = dbPromise
    }


    /**
     * Inserts an ExternalItemAssignment
     * 
     * @returns the id of the inserted ExternalItemAssignment
     */
    create(): Promise<number> {
        const stmt = "INSERT INTO external_item_assignments VALUES()"

        return this.dbPromise.query(stmt)
        .then(([results, fields]) => {
            results = results as OkPacket
            return results.insertId
        })
    }


    /**
     * Deletes an ExternalItemAssignment
     * 
     * @param id the id of the ExternalItemAssignment which should be deleted
     * @returns true if an ExternalItemAssignment could be deleted
     */
    delete(id: number): Promise<Boolean> {
        const stmt = "DELETE FROM external_item_assignments WHERE id = ?"

        return this.dbPromise.query(stmt, id)
        .then(([results, fields]) => {
            results = results as OkPacket
            return results.affectedRows > 0
        })
    }
}
