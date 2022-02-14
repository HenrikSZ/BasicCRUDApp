/**
 * Contains the InventoryModel to represent deletions in the database
 */


import { RowDataPacket, OkPacket } from "mysql2"
import dbPromise from "../db.js"
import AssignmentModel from "./AssignmentModel.js"


export interface MinimalInventoryItem extends RowDataPacket {
    name: string,
    count: number
}

export interface InventoryItem extends MinimalInventoryItem {
    id: number,
    deletion_id: number,
    created_at: Date,
    updated_at: Date
}


interface DeletedInventoryItem extends InventoryItem {
    comment: string
}


export default class ItemModel {
    /**
     * Reads all items in the inventory that are not deleted.
     * 
     * @returns all items in the items.
     */
    getAllItems(): Promise<InventoryItem[]> {
        const stmt = "SELECT items.id, items.name, AVAIL_ITEMS_COUNT(items.id) AS count "
            + "FROM items WHERE deletion_id IS NULL"
        return dbPromise.query(stmt)
        .then(([results, fields]) => {
            return results as any
        })
    }

    /**
     * Reads all items in the inventory that are deleted.
     * 
     * @returns all deleted items with their deletion comment.
     */
    getAllDeletedItems(): Promise<DeletedInventoryItem[]> {
        const stmt = "SELECT items.id, items.name, AVAIL_ITEMS_COUNT(items.id), "
            + "deletions.comment FROM items INNER JOIN deletions "
            + "ON items.deletion_id = deletions.id "
            + "WHERE deletion_id IS NOT NULL"
        return dbPromise.query(stmt)
        .then(([results, fields]) => {
            return results as any
        })
    }


    /**
     * Reads one item from the items. It can be deleted or not deleted.
     * 
     * @param id the id of the item that should be read.
     * @returns the item identified by the id, if it exists. Otherwise null.
     */
    getItem(id: number): Promise<InventoryItem> {
        const stmt = "SELECT items.id, items.name, AVAIL_ITEMS_COUNT(items.id)"
        return dbPromise.query(stmt, id)
        .then(([results, fields]) => {
            results = results as InventoryItem[]

            if (results.length !== 0)
                return results[0] as InventoryItem
            else
                return null
        })
    }


    /**
     * Reads items whose names are LIKE %name%
     * 
     * @param name parts of the name that should be searched for.
     */
    getItemLike(name: string): Promise<InventoryItem[]> {
        const stmt = "SELECT items.id, items.name, AVAIL_ITEMS_COUNT(items.id) "
            + "FROM items WHERE name LIKE ? LIMIT 10"
        return dbPromise.query(stmt, "%" + name + "%")
        .then(([results, fiels]) => {
            return results as InventoryItem[]
        })
    }


    /**
     * Reads the deletion id of an item.
     * 
     * @param id the id of the item.
     * @returns -1 if the item does not exist, 0 when it is not deleted,
     * the deletion_id if it exists and is deleted.
     */
    getDeletionId(id: number): Promise<number> {
        const stmt = "SELECT deletion_id FROM items WHERE id = ?"
        return dbPromise.query(stmt, id)
        .then(([results, fields]) => {
            results = results as InventoryItem[]

            if (results.length !== 1)
                return -1
            else if (!results[0].deletion_id)
                return 0
            else
                return results[0].deletion_id
        })
    }

    /**
     * Inserts an item into the items.
     * 
     * @param item the basic info of the item.
     * @returns the id of this item.
     */
    insertItem(item: MinimalInventoryItem): Promise<number> {
        let itemToInsert = {
            name: item.name
        }

        let insertId = 0

        let stmt = "INSERT INTO items SET ?"
        return dbPromise.query(stmt, itemToInsert)
        .then(([results, fields]) => {
            results = results as OkPacket
            insertId = results.insertId
            
            return new AssignmentModel().insert(insertId, item.count)
        })
        .then(() => {
            return insertId
        })
    }


    /**
     * Updates fields of an item in the items.
     * 
     * @param values an object mapping keys to values that should be updated.
     * @param id the id of the item.
     * @returns true if the item could be update, false otherwise.
     */
    updateItem(values: any, id: number): Promise<Boolean> {
        const stmt = "UPDATE items SET ? WHERE id = ?"
        return dbPromise.query(stmt, [values, id])
        .then(([results, fiels]) => {
            results = results as OkPacket
            return results.affectedRows > 0
        })
    }
}
