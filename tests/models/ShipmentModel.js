import chai from "chai"
import sinon from "sinon"
import sinon_chai from "sinon-chai"
chai.use(sinon_chai)

const expect = chai.expect

import dbPromise from "../db.js"

import ShipmentModel from "../../dist/models/ShipmentModel.js"


function insertItemDataSet() {
    return Promise.all([
        dbPromise.query("INSERT INTO items (name, count) VALUES ('Chair', 100)"),
        dbPromise.query("INSERT INTO items (name, count) VALUES ('Bed', 55)"),
        dbPromise.query("INSERT INTO items (name, count) VALUES ('Table', 1)"),
    ])
    .then(results => {
        return results.map(([queryResult, fields]) => {
            return queryResult.insertId
        })
    })
}

function clearTables() {
    return Promise.all([
        dbPromise.query("DELETE FROM shipments_to_items"),
        dbPromise.query("DELETE FROM shipments"),
        dbPromise.query("DELETE FROM items"),
        dbPromise.query("DELETE FROM deletions")
    ])
}


describe("ShipmentModel", () => {
    beforeEach(clearTables)

    describe("#getShipment", () => {
        it("should return a shipment with a single item", (done) => {
            let shipmentId = 0, itemId = 0

            dbPromise.query("INSERT INTO items (name, count) VALUES ('Chair', 100)")
            .then(([results, fields]) => {
                itemId = results.insertId

                return dbPromise.query("INSERT INTO shipments (name, destination) "
                    + "VALUES ('Test', 'Heidelberg')")
            })
            .then(([results, field]) => {
                shipmentId = results.insertId

                return dbPromise.query("INSERT INTO shipments_to_items "
                    + "(shipment_id, item_id, count) VALUES (?, ?, ?)",
                    [shipmentId, itemId, 100])
            })
            .then(() => {
                let model = new ShipmentModel(dbPromise)

                return model.getShipment(shipmentId)
            })
            .then((shipment) => {
                try {
                    expect(shipment.name).to.equal("Test")
                    expect(shipment.destination).to.equal("Heidelberg")
                    expect(shipment.items.length).to.equal(1)
                    expect(shipment.items[0].name).to.equal("Chair")
                    expect(shipment.items[0].count).to.equal(100)
                    done()
                } catch (err) {
                    done(err)
                }
            })
            .catch(error => done(error))
        })

        it("should return a shipment with multiple items", (done) => {
            let shipmentId = 0, itemIds = []

            insertItemDataSet()            
            .then((ids) => {
                itemIds = ids
                return dbPromise.query("INSERT INTO shipments (name, destination) "
                    + "VALUES ('Test', 'Heidelberg')")
            })
            .then(([results, field]) => {
                shipmentId = results.insertId
                let stmt = "INSERT INTO shipments_to_items (shipment_id, item_id) "
                    + "VALUES (?, ?)"
                let promises = itemIds.map(itemId =>
                    dbPromise.query(stmt, [shipmentId, itemId]))

                return Promise.all(promises)
            })
            .then(() => {
                let model = new ShipmentModel(dbPromise)

                return model.getShipment(shipmentId)
            })
            .then((shipment) => {
                try {
                    expect(shipment.items.length).to.equal(3)
                    done()
                } catch (err) {
                    done(err)
                }
            })
            .catch(error => done(error))
        })

        it("should return a shipment containing only relevant items", (done) => {
            let shipmentId = 0, itemIds = []

            insertItemDataSet()            
            .then((ids) => {
                itemIds = ids
                
                return dbPromise.query("INSERT INTO shipments (name, destination) "
                    + "VALUES ('Test', 'Heidelberg')")
            })
            .then(([results, field]) => {
                shipmentId = results.insertId
                let stmt = "INSERT INTO shipments_to_items (shipment_id, item_id) "
                    + "VALUES (?, ?)"
                let modItemIds = itemIds.slice(1)
                let promises = modItemIds.map(itemId =>
                    dbPromise.query(stmt, [shipmentId, itemId]))

                return Promise.all(promises)
            })
            .then(() => {
                let model = new ShipmentModel(dbPromise)

                return model.getShipment(shipmentId)
            })
            .then((shipment) => {
                try {
                    expect(shipment.items.length).to.equal(2)
                    done()
                } catch (err) {
                    done(err)
                }
            })
            .catch(error => done(error))
        })
    })

    describe("#createShipment", () => {
        function runWithSingleItem(name, destination) {
            let itemIds = []

            return insertItemDataSet()
            .then((ids) => {
                itemIds = ids

                let insertShipment = {
                    name: name,
                    destination: destination,
                    items: [
                        {
                            id: itemIds[0],
                            count: 50
                        }
                    ]
                }
    
                let model = new ShipmentModel(dbPromise)
    
                return model.createShipment(insertShipment)
            })
            .then((id) => {
                return Promise.all([
                    dbPromise.query("SELECT name, destination FROM shipments"),
                    dbPromise.query("SELECT shipment_id, item_id, count FROM shipments_to_items"),
                    id,
                    itemIds
                ])
            })
        }
        function runWithMultipleItems(name, destination) {
            let itemIds = []

            return insertItemDataSet()
            .then((ids) => {
                itemIds = ids

                let insertShipment = {
                    name: name,
                    destination: destination,
                    items: [
                        {
                            id: itemIds[0],
                            count: 50
                        },
                        {
                            id: itemIds[1],
                            count: 5
                        }
                    ]
                }
    
                let model = new ShipmentModel(dbPromise)
    
                return model.createShipment(insertShipment)
            })
            .then((id) => {
                return Promise.all([
                    dbPromise.query("SELECT name, destination FROM shipments"),
                    dbPromise.query("SELECT shipment_id, item_id, count FROM shipments_to_items"),
                    id,
                    itemIds
                ])
            })
        }
        it("should insert a shipment, so that the field values are correct", (done) => {
            let name = "Test", destination = "Mannheim"
            runWithSingleItem(name, destination)
            .then(results => {
                let shipments = results[0][0]
                expect(shipments.length).to.equal(1)
                let shipment = shipments[0]

                expect(shipment.name).to.equal(name)
                expect(shipment.destination).to.equal(destination)
                done()
            })
            .catch(error => done(error))
        })
        it("shold insert an item of a shipment", done => {
            let name = "Test", destination = "Mannheim"
            runWithSingleItem(name, destination)
            .then(results => {
                let mapped_items = results[1][0]
                expect(mapped_items.length).to.equal(1)
                let item = mapped_items[0]

                expect(item.shipment_id).equal(results[2])
                expect(item.item_id).to.equal(results[3][0])
                expect(item.count).to.equal(50)
                done()
            })
            .catch(error => done(error))
        })

        it("should insert multiple items of a shipment", (done) => {
            let name = "Test2", destination = "Ludwigshafen"

            runWithMultipleItems(name, destination)
            .then(results => {
                let mapped_items = results[1][0]
                expect(mapped_items.length).to.equal(2)   

                expect(mapped_items[0].item_id).to.equal(results[3][0])
                expect(mapped_items[1].item_id).to.equal(results[3][1])

                expect(mapped_items[0].shipment_id).to.equal(results[2])
                expect(mapped_items[1].shipment_id).to.equal(results[2])
                done()
            })
            .catch(error => done(error))
        })
    })
})
