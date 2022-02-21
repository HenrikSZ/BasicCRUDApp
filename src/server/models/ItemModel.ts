/**
 * Contains the InventoryModel to represent deletions in the database
 */


import { RowDataPacket, OkPacket, Pool, PoolConnection } from "mysql2/promise"
import ExternalItemAssignmentModel from "./ExternalItemAssignmentModel.js"
import ItemAssignmentModel from "./ItemAssignmentModel.js"


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
    itemAssignmentModel: ItemAssignmentModel
    externalItemAssignmentModel: ExternalItemAssignmentModel
    dbPromise: Pool

    constructor(dbPromise: Pool) {
        this.itemAssignmentModel = new ItemAssignmentModel(dbPromise)
        this.externalItemAssignmentModel = new ExternalItemAssignmentModel(dbPromise)
        this.dbPromise = dbPromise
    }


    /**
     * Reads all items in the inventory that are not deleted.
     * 
     * @returns all items in the items.
     */
    getAllItems(): Promise<InventoryItem[]> {
        const stmt = "SELECT items.id, items.name, AVAIL_ITEMS_COUNT(items.id) AS count "
            + "FROM items WHERE deletion_id IS NULL"
        return this.dbPromise.query(stmt)
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
        return this.dbPromise.query(stmt)
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
        return this.dbPromise.query(stmt, id)
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
        return this.dbPromise.query(stmt, "%" + name + "%")
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
        return this.dbPromise.query(stmt, id)
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
    createItem(item: MinimalInventoryItem): Promise<number> {
        let itemToInsert = {
            name: item.name
        }

        let insertId = 0

        let stmt = "INSERT INTO items SET ?"
        return this.dbPromise.query(stmt, itemToInsert)
        .then(([results, fields]) => {
            results = results as OkPacket
            insertId = results.insertId
            
            return this.externalItemAssignmentModel.create()
        })
        .then(id => {
            return this.itemAssignmentModel
                .create(insertId, item.count, undefined, id)
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
        let conn: PoolConnection | null = null
        let modified = false

        return this.dbPromise.getConnection()
        .then(connection => {
            conn = connection
            conn.beginTransaction()
        })
        .then(() => {
            if (values.count_change) {
                return this.externalItemAssignmentModel.create()
                .then(externalAssignmentId => {
                    return this.itemAssignmentModel
                        .create(id, values.count_change, undefined, externalAssignmentId, conn)
                })
                .then(mod => {
                    if (mod) modified = true
                })
            }
        })
       .then(() => {
            if (typeof values.name === "string") {
                const stmt = "UPDATE items SET ? WHERE id = ?"

                return conn.query(stmt, [{name: values.name}, id])
                .then(([results, fiels]) => {
                    results = results as OkPacket
                    if (results.affectedRows > 0)
                        modified = true
                })
            }
            else if (typeof values.deletion_id === "number") {
                const stmt = "UPDATE items SET ? WHERE id = ?"

                return conn.query(stmt, [{deletion_id: values.deletion_id}, id])
                .then(([results, fiels]) => {
                    results = results as OkPacket
                    if (results.affectedRows > 0)
                        modified = true
                })
            }
        })
        .then(() => {
            conn.commit()
            conn.release()
            return modified
        })
        .catch((error) => {
            conn.rollback()
            conn.release()
            return Promise.reject(error)
        })
    }
}
