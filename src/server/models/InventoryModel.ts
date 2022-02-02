import { RowDataPacket, OkPacket } from "mysql2"
import dbPromise from "./../db.js"


export default class InventoryModel {
    getAllItems() {
        const stmt = "SELECT * FROM inventory WHERE deletion_id IS NULL"
        return dbPromise.query(stmt)
        .then(([results, fields]) => {
            return results
        })
    }

    getAllDeletedItems() {
        const stmt = "SELECT inventory.id, inventory.name, inventory.count, "
            + "deletions.comment FROM inventory INNER JOIN deletions "
            + "ON inventory.deletion_id=deletions.id "
            + "WHERE deletion_id IS NOT NULL"
        return dbPromise.query(stmt)
        .then(([results, fields]) => {
            return results
        })
    }

    getItem(id: string) {
        const stmt = "SELECT * FROM inventory WHERE id = ?"
        return dbPromise.query(stmt, id)
        .then(([results, fields]) => {
            results = results as RowDataPacket[]
            if (results.length !== 0)
                return results[0]
            else
                return null
        })
    }

    getDeletionId(id: string) {
        const stmt = "SELECT deletion_id FROM inventory "
            + "WHERE id = ? AND deletion_id IS NOT NULL"
        return dbPromise.query(stmt, id)
        .then(([results, fields]) => {
            results = results as RowDataPacket[]
            if (results.length === 0) {
                return -1
            } else {
                return results[0].deletion_id
            }
        })
    }

    insertItem(values: any) {
        const stmt = "INSERT INTO inventory SET ?"
        return dbPromise.query(stmt, values)
        .then(([results, fields]) => {
            results = results as OkPacket
            return results.insertId
        })
    }

    updateItem(values: any, id: string) {
        const stmt = "UPDATE inventory SET ? WHERE id = ?"
        return dbPromise.query(stmt, [values, id])
        .then(([results, fiels]) => {
            results = results as OkPacket
            return results
        })
    }
}
