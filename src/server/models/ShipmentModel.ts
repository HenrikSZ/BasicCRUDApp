/**
 * Contains the ShipmentModel to represent deletions in the database
 */


import { RowDataPacket, OkPacket } from "mysql2"
import { Pool } from "mysql2/promise"
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
     * Reads all shipments from the inventory that are not deleted.
     * 
     * @returns all items in the inventory.
     */
    getAllShipments(): Promise<Shipment[]> {
        let stmt = "SELECT * FROM shipments WHERE deletion_id IS NULL"
        let shipments: Shipment[] | null = null

        return this.dbPromise.query(stmt)
        .then(([results, fields]) => {
            shipments = (results as Shipment[]).map(s => {
                let shipment = {...s}
                shipment.items = []
                return shipment
            })
            stmt = "SELECT shipments_to_items.shipment_id, "
                + "items.name, shipments_to_items.count, items.id "
                + "FROM shipments_to_items INNER JOIN items "
                + "ON shipments_to_items.item_id=items.id "
                + "WHERE deletion_id IS NULL"
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
     * Reads one item from the inventory. It can be deleted or not deleted.
     * 
     * @param id the id of the shipment that should be read.
     * @returns the shipment identified by the id, if it exists. Otherwise null.
     */
    getShipment(id: number): Promise<Shipment> {
        let stmt = "SELECT * FROM shipments WHERE id = ?"
        let shipment: Shipment | null = null

        return this.dbPromise.query(stmt, id)
        .then(([results, fields]) => {
            shipment = (results as RowDataPacket)[0] as Shipment
            stmt = "SELECT items.name, shipments_to_items.count "
                + "FROM shipments_to_items INNER JOIN items "
                + "ON shipments_to_items.item_id=items.id "
                + "WHERE shipments_to_items.shipment_id = ?";
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
     * Inserts a shipments into the shiptments.
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

        let stmt = "INSERT INTO shipments SET ?"
        return this.dbPromise.query(stmt, insertShipment)
        .then(([results, fields]) => {
            results = results as OkPacket
            shipmentId = results.insertId
        }).then(() => {
            let promises = []
            stmt = "INSERT INTO shipments_to_items SET ?"

            for (let item of shipment.items) {
                let insertItem = {
                    shipment_id: shipmentId,
                    count: item.count,
                    item_id: item.id
                }
                let promise = this.dbPromise.query(stmt, insertItem)

                promises.push(promise)
            }

            return Promise.all(promises)
        }).then(() => {
            return shipmentId
        })
    }
}
