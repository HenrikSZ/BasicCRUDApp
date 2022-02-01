/**
 * Contains the DeletionModel to represent deletions in the database
 */


import { OkPacket } from "mysql2"
import dbPromise from "../db.js"
import logger from "../logger.js"


export default class DeletionModel {
    insert(comment: string) {
        logger.debug(`Inserting deletion table with comment "${comment}"`)

        const stmt = "INSERT INTO deletions (comment) VALUES (?)"
        return dbPromise.query(stmt, comment)
        .then(([results, fields]) => {
            results = results as OkPacket
            return results.insertId
        })
    }
    
    delete(id: string) {
        logger.debug(`Deleting from deletion table with id "${id}"`)

        const stmt = "DELETE FROM deletions WHERE id = ?"
        return dbPromise.query(stmt, id)
        .then(([results, fields]) => {
            return results as OkPacket
        })
    }
}
