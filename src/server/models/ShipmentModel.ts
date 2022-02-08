/**
 * Contains the ShipmentModel to represent deletions in the database
 */


import { RowDataPacket, OkPacket } from "mysql2"
import { MinimalInventoryItem } from "./ItemModel.js"
import dbPromise from "./../db.js"
 
 
interface MinimalShipment {
    name: string,
    destination: string
}

interface ClientSideShipment extends MinimalShipment {
    items: { item_id: number, count: number }[]
}
 
interface Shipment extends MinimalShipment {
    name: string,
    destination: string,
    id: number,
    items: MappedInventoryItem[]
}

interface MappedInventoryItem extends MinimalInventoryItem {
    shipment_id: number
}


export default class ShipmentModel {


    /**
     * Reads all shipments from the inventory that are not deleted.
     * 
     * @returns all items in the inventory.
     */
    getAllShipments(): Promise<Shipment[]> {
        let stmt = "SELECT * FROM shipments WHERE deletion_id IS NULL"
        let shipments = null

        return dbPromise.query(stmt)
        .then(([results, fields]) => {
            shipments =  results
            stmt = "SELECT shipment_to_inventory.shipment_id, "
                + "inventory.name, shipment_to_inventory.count "
                + "FROM shipments_to_inventory INNER JOIN inventory "
                + "ON shipments_to_inventory.item_id=inventory.id "
                + "WHERE deletion_id IS NOT NULL"
            return dbPromise.query(stmt)
        }).then(([results, fields]) => {
           let shipment_index = 0
            for (let item of results as MappedInventoryItem[]) {
                while (shipments[shipment_index] != item.shipment_id) {
                    shipment_index++
                }

                shipments[shipment_index].items.push(item)
            }

            return shipments
        })
    }


    /**
     * Reads one item from the inventory. It can be deleted or not deleted.
     * 
     * @param id the id of the item that should be read.
     * @returns the item identified by the id, if it exists. Otherwise null.
     */
    getShipment(id: number): Promise<Shipment> {
        let stmt = "SELECT * FROM shipments WHERE id = ?"
        let shipment = null

        return dbPromise.query(stmt, id)
        .then(([results, fields]) => {
            shipment =  results
            stmt = "SELECT inventory.name, inventory.count "
                + "FROM shipments_to_inventory INNER JOIN inventory "
                + "ON shipments_to_inventory.item_id=inventory.id "
                + "WHERE shipments_to_inventory.shipment_id = ?"
            return dbPromise.query(stmt, id)
        }).then(([results, fields]) => {
            for (let item of results as MinimalInventoryItem[]) {
                shipment.push(item)
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
    insertShipment(shipment: ClientSideShipment): Promise<number> {
        let insertShipment: MinimalShipment = {
            name: shipment.name,
            destination: shipment.destination
        }

        let shipmentId = 0

        let stmt = "INSERT INTO shipments SET ?"
        return dbPromise.query(stmt, insertShipment)
        .then(([results, fields]) => {
            results = results as OkPacket
            shipmentId = results.insertId
        }).then(() => {
            let promises = []
            stmt = "INSERT INTO shipment_to_inventory SET = ?"

            for (let item of shipment.items) {
                let promise = dbPromise.query(stmt, item)

                promises.push(promise)
            }

            Promise.all(promises)
        }).then(() => {
            return shipmentId
        })
    }
}
 