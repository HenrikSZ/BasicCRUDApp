/**
 * Contains the DeletionModel to represent deletions in the database
 */


import { OkPacket, Pool } from "mysql2/promise"
import dbPromise from "../db.js"
import logger from "../logger.js"


export interface ICreateDeletion {
    comment: string
}


export default class DeletionModel {
    dbPromise: Pool

    constructor(_dbPromise: Pool = dbPromise) {
        this.dbPromise = _dbPromise
    }


    /**
     * Inserts a deletion notice into the deletions.
     * 
     * @param comment the comment of the deletion.
     * @returns the id of the inserted deletion.
     */
    async create(values: ICreateDeletion): Promise<number> {
        logger.debug(`Inserting deletion table with comment "${values.comment}"`)

        const stmt = "INSERT INTO deletions SET ?"
        let[results, fields] = await this.dbPromise.query(stmt, values)

        results = results as OkPacket
        return results.insertId
    }
    
    /**
     * Deletes a deletion notice from the deletions.
     * 
     * @param id the id of deletion.
     * @returns true if a deletion was deleted, false otherwise.
     */
    async delete(id: number): Promise<Boolean> {
        logger.debug(`Deleting from deletion table with id "${id}"`)

        const stmt = "DELETE FROM deletions WHERE id = ?"
        let [results, fields] = await this.dbPromise.query(stmt, id)
        
        results = results as OkPacket
        return results.affectedRows > 0
    }
}
