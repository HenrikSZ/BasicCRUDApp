/**
 * Contains the DeletionModel to represent deletions in the database
 */


import { OkPacket, RowDataPacket } from "mysql2"
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


export default class DeletionModel {
    /**
     * Inserts a deletion notice into the deletions.
     * 
     * @param comment the comment of the deletion.
     * @returns the id of the inserted deletion.
     */
    insert(comment: string): Promise<number> {
        logger.debug(`Inserting deletion table with comment "${comment}"`)

        const stmt = "INSERT INTO deletions (comment) VALUES (?)"
        return dbPromise.query(stmt, comment)
        .then(([results, fields]) => {
            results = results as OkPacket
            return results.insertId
        })
    }
    
    /**
     * Deletes a deletion notice from the deletions.
     * 
     * @param id the id of deletion.
     * @returns true if a deletion was deleted, false otherwise.
     */
    delete(id: number): Promise<Boolean> {
        logger.debug(`Deleting from deletion table with id "${id}"`)

        const stmt = "DELETE FROM deletions WHERE id = ?"
        return dbPromise.query(stmt, id)
        .then(([results, fields]) => {
            results = results as OkPacket
            return results.affectedRows > 0
        })
    }
}
