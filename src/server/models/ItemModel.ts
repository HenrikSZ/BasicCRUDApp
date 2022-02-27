/**
 * Contains the InventoryModel to represent deletions in the database
 */


import { RowDataPacket, OkPacket, Pool, PoolConnection } from "mysql2/promise"
import dbPromise from "../db.js"
import ExternalItemAssignmentModel from "./ExternalItemAssignmentModel.js"
import ItemAssignmentModel from "./ItemAssignmentModel.js"


export interface ICreateItem {
    name: string,
    count: number
}

export interface IUpdateItem {
    name?: string,
    count_change?: number
    deletion_id?: number
}

export interface ILikeItem {
    name: string
}


export interface InventoryItem extends RowDataPacket {
    name: string,
    count: number
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

    constructor(_dbPromise: Pool = dbPromise,
            itemAssignmentModel = new ItemAssignmentModel(_dbPromise),
            externalItemAssignmentModel = new ExternalItemAssignmentModel(_dbPromise)) {
        this.itemAssignmentModel = itemAssignmentModel
        this.externalItemAssignmentModel = externalItemAssignmentModel
        this.dbPromise = _dbPromise
    }


    /**
     * Reads all items in the inventory that are not deleted.
     * 
     * @returns all items in the items.
     */
    async getAllItems(): Promise<InventoryItem[]> {
        const stmt = "SELECT items.id, items.name, AVAIL_ITEMS_COUNT(items.id) AS count "
            + "FROM items WHERE deletion_id IS NULL"

        const [results, fields] = await this.dbPromise.query(stmt)
        return results as InventoryItem[]
    }

    /**
     * Reads all items in the inventory that are deleted.
     * 
     * @returns all deleted items with their deletion comment.
     */
    async getAllDeletedItems(): Promise<DeletedInventoryItem[]> {
        const stmt = "SELECT items.id, items.name, AVAIL_ITEMS_COUNT(items.id), "
            + "deletions.comment FROM items INNER JOIN deletions "
            + "ON items.deletion_id = deletions.id "
            + "WHERE deletion_id IS NOT NULL"

        const [results, fields] = await this.dbPromise.query(stmt)
        return results as DeletedInventoryItem[]
    }


    /**
     * Reads one item from the items. It can be deleted or not deleted.
     * 
     * @param id the id of the item that should be read.
     * @returns the item identified by the id, if it exists. Otherwise null.
     */
    async getItem(id: number): Promise<InventoryItem> {
        const stmt = "SELECT items.id, items.name, AVAIL_ITEMS_COUNT(items.id)"

        let [results, fields] = await this.dbPromise.query(stmt, id)
        results = results as InventoryItem[]

        if (results.length !== 0)
            return results[0] as InventoryItem
        else
            return null
    }


    /**
     * Reads items whose names are LIKE %name%
     * 
     * @param name parts of the name that should be searched for.
     */
    async getItemLike(values: ILikeItem): Promise<InventoryItem[]> {
        const stmt = "SELECT items.id, items.name, AVAIL_ITEMS_COUNT(items.id) "
            + "FROM items WHERE name LIKE ? LIMIT 10"

        const [results, fiels] = await this.dbPromise.query(stmt, "%" + values.name + "%")
        return results as InventoryItem[]
    }


    /**
     * Reads the deletion id of an item.
     * 
     * @param id the id of the item.
     * @returns -1 if the item does not exist, 0 when it is not deleted,
     * the deletion_id if it exists and is deleted.
     */
    async getDeletionId(id: number): Promise<number> {
        const stmt = "SELECT deletion_id FROM items WHERE id = ?"

        let [results, fields] = await this.dbPromise.query(stmt, id)
        results = results as InventoryItem[]

        if (results.length !== 1)
            return -1
        else if (!results[0].deletion_id)
            return 0
        else
            return results[0].deletion_id
    }


    /**
     * Inserts an item into the items.
     * 
     * @param item the basic info of the item.
     * @returns the id of this item.
     */
    async createItem(item: ICreateItem): Promise<number> {
        let itemToInsert = {
            name: item.name
        }

        const stmt = "INSERT INTO items SET ?"
        let [results, fields] = await this.dbPromise.query(stmt, itemToInsert)
        results = results as OkPacket

        let insertId = results.insertId
        const id = await this.externalItemAssignmentModel.create()
        await this.itemAssignmentModel
            .create(insertId, item.count, undefined, id)
        return insertId
    }


    /**
     * Updates fields of an item in the items.
     * 
     * @param values an object mapping keys to values that should be updated.
     * @param id the id of the item.
     * @returns true if the item could be update, false otherwise.
     */
    async updateItem(values: IUpdateItem, id: number): Promise<Boolean> {
        let modified = false

        let connection = null
        try {
            connection = await this.dbPromise.getConnection()
            await connection.beginTransaction()

            if (values.count_change) {
                const externalAssignmentId = await this.externalItemAssignmentModel.create()

                if (await this.itemAssignmentModel.create(
                        id, values.count_change, undefined, externalAssignmentId, connection))
                    modified = true
            }
            if (typeof values.name === "string") {
                const stmt = "UPDATE items SET ? WHERE id = ?"

                let [results, fields] = await connection.query(stmt, [{name: values.name}, id])
                    results = results as OkPacket

                    if (results.affectedRows > 0)
                        modified = true
            }
            else if (typeof values.deletion_id === "number") {
                const stmt = "UPDATE items SET ? WHERE id = ?"

                let [results, fields] = await connection.query(stmt, [{deletion_id: values.deletion_id}, id])
                results = results as OkPacket

                if (results.affectedRows > 0)
                    modified = true
            }

            connection.commit()
            connection.release()
        
            return modified
        } catch (error) {
            if (connection) {
                connection.rollback()
                connection.release()
            }

            throw error
        }
    }
}
