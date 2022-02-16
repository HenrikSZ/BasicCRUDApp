/**
 * Contains the ShipmentModel to represent shipments in the database
 */


import { RowDataPacket, OkPacket } from "mysql2"
import { Pool, PoolConnection } from "mysql2/promise"
import { handleDbError } from "../error_handling.js"
import { InventoryItem } from "./ItemModel.js"
 
 
interface MinimalShipment {
    name: string,
    destination: string
}

export interface ClientSideShipment extends MinimalShipment {
    items: { id: number, count: number }[]
}
 
interface Shipment extends MinimalShipment {
    name: string,
    destination: string,
    id: number,
    items?: InventoryItem[]
}

interface MappedInventoryItem extends InventoryItem {
    shipment_id: number
}


export default class ShipmentModel {
    dbPromise: Pool

    constructor(dbPromise: Pool) {
        this.dbPromise = dbPromise
    }


    /**
     * Reads all shipments from the database that are not deleted.
     * 
     * @returns all shipments in the database.
     */
    getAllShipments(): Promise<Shipment[]> {
        let stmt = "SELECT id, name, destination FROM shipments "
            + "ORDER BY id"
        let shipments: Shipment[] | null = null

        return this.dbPromise.query(stmt)
        .then(([results, fields]) => {
            shipments = (results as Shipment[]).map(s => {
                let shipment = {...s}
                shipment.items = []
                return shipment
            })
            stmt = "SELECT shipments_to_assignments.shipment_id, "
                + "items.name, (-1) * item_assignments.assigned_count AS assigned_count, "
                + "items.id "
                + "FROM shipments_to_assignments "
                + "INNER JOIN item_assignments ON "
                + "shipments_to_assignments.assignment_id = item_assignments.id "
                + "INNER JOIN items ON "
                + "item_assignments.item_id = items.id "
                + "ORDER BY shipment_id"
            return this.dbPromise.query(stmt)
        }).then(([results, fields]) => {
            let shipment_index = 0
            for (let item of results as MappedInventoryItem[]) {
                while (shipments[shipment_index].id !== item.shipment_id) {
                    shipment_index++
                }

                shipments[shipment_index].items.push(item as InventoryItem)
            }

            return shipments
        })
    }


    /**
     * Reads one shipment from the database.
     * 
     * @param id the id of the shipment that should be read.
     * @returns the shipment identified by the id, if it exists. Otherwise null.
     */
    getShipment(id: number): Promise<Shipment> {
        let stmt = "SELECT id, name, destination FROM shipments WHERE id = ?"
        let shipment: Shipment | null = null

        return this.dbPromise.query(stmt, id)
        .then(([results, fields]) => {
            shipment = (results as RowDataPacket)[0] as Shipment
            stmt = "SELECT shipments_to_assignments.shipment_id, items.name, "
                + "(-1) * item_assignments.assigned_count AS assigned_count, "
                + "items.id "
                + "FROM shipments_to_assignments "
                + "INNER JOIN item_assignments ON "
                + "shipments_to_assignments.assignment_id = item_assignments.id "
                + "INNER JOIN items ON "
                + "item_assignments.item_id = items.id "
                + "WHERE shipments_to_assignments.shipment_id = ?";
            return this.dbPromise.query(stmt, id)
        }).then(([results, fields]) => {
            shipment.items = []

            for (let item of results as InventoryItem[]) {
                shipment.items.push(item)
            }
            
            return shipment
        })
    }


    /**
     * Inserts a shipments into the database.
     * 
     * @param shipment the basic info of the shipment.
     * @returns the id of this shipment.
     */
    createShipment(shipment: ClientSideShipment): Promise<number> {
        let insertShipment = {
            name: shipment.name,
            destination: shipment.destination
        }

        let shipmentId = 0
        let conn: PoolConnection | null = null

        return this.dbPromise.getConnection()
        .then((connection) => {
            conn = connection
            return conn.beginTransaction()
        })
        .then(() => {
            let stmt = "INSERT INTO shipments SET ?"
            return conn.query(stmt, insertShipment)
        })
        .then(([results, fields]) => {
            results = results as OkPacket
            shipmentId = results.insertId
        })
        .then(() => {
            let promises = []
            let stmt = "INSERT INTO item_assignments SET ?"

            for (let item of shipment.items) {
                let insertItem = {
                    item_id: item.id,
                    assigned_count: -item.count
                }
                let promise = conn.query(stmt, insertItem)

                promises.push(promise)
            }

            return Promise.all(promises)
        })
        .then((ids: any[]) => {
            let assignmentIds = ids.map((item) => item[0].insertId)

            let promises = []
            let stmt = "INSERT INTO shipments_to_assignments SET ?"

            for (let assignmentId of assignmentIds) {
                let insertItem = {
                    shipment_id: shipmentId,
                    assignment_id: assignmentId
                }
                let promise = conn.query(stmt, insertItem)

                promises.push(promise)
            }

            return Promise.all(promises)
        }).then(() => {
            conn.commit()
            conn.release()
            return shipmentId
        })
        .catch((error) => {
            conn.rollback()
            conn.release()
            return Promise.reject(error)
        })
    }
}
