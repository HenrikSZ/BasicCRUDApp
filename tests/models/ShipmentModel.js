import chai from "chai"
import deepEqualInAnyOrder from "deep-equal-in-any-order"
chai.use(deepEqualInAnyOrder)

const expect = chai.expect

import db from "../db.js"

import ShipmentModel from "../../dist/models/ShipmentModel.js"


describe("ShipmentModel", () => {
    let dbPromise = null

    before(() => {
        dbPromise = db()
    })
    after(() => {
        dbPromise.end()
    })
    beforeEach(clearTables)


    /**
     * Chairs   | 100
     * Beds     | 55
     * Tables   | 1
     * 
     * @returns The ids of the inserted items
     */
    function insertItemDataSet() {
        let ids = []

        return Promise.all([
            dbPromise.query("INSERT INTO items SET name = 'Chairs'"),
            dbPromise.query("INSERT INTO items SET name = 'Beds'"),
            dbPromise.query("INSERT INTO items SET name = 'Tables'"),
        ])
        .then(results => {
            ids = results.map(([queryResult, fields]) => queryResult.insertId)

            const stmt = "INSERT INTO item_assignments (item_id, assigned_count) VALUES (?, ?)"

            return Promise.all([
                dbPromise.query(stmt, [ids[0], 100]),
                dbPromise.query(stmt, [ids[1], 55]),
                dbPromise.query(stmt, [ids[2], 1]),
            ])
        })
        .then(() => {
            return ids 
        })
    }


    /**
     * Test: Heidelberg     | Chairs: 50
     * Test2: Heidelberg2   | Chairs: 5, Beds: 10
     * Test3: Heidelberg3   | Chairs: 10, Beds: 2, Tables: 1
     * 
     * @returns the expected output of all shipments.
     */
    function insertShipmentDataset() {
        let itemIds = [], assignmentIds = [], shipmentIds = []

        return insertItemDataSet()
        .then((ids) => {
            itemIds = ids
            return Promise.all([
                dbPromise.query("INSERT INTO shipments (name, destination) "
                    + "VALUES ('Test', 'Heidelberg')"),
                dbPromise.query("INSERT INTO shipments (name, destination) "
                    + "VALUES ('Test2', 'Heidelberg2')"),
                dbPromise.query("INSERT INTO shipments (name, destination) "
                    + "VALUES ('Test3', 'Heidelberg3')")
            ])
        })
        .then((ids) => {
            shipmentIds = ids.map(r => r[0].insertId)

            const stmt = "INSERT INTO item_assignments "
                + "(item_id, assigned_count) VALUES (?, ?)"
            
            return Promise.all([
                Promise.all([
                    dbPromise.query(stmt, [itemIds[0], -50]),
                ]),
                Promise.all([
                    dbPromise.query(stmt, [itemIds[0], -5]),
                    dbPromise.query(stmt, [itemIds[1], -10]),
                ]),
                Promise.all([
                    dbPromise.query(stmt, [itemIds[0], -10]),
                    dbPromise.query(stmt, [itemIds[1], -2]),
                    dbPromise.query(stmt, [itemIds[2], -1]),
                ])
            ])
        })
        .then((ids) => {
            assignmentIds = ids.map(s => s.map(r => r[0].insertId))

            const stmt = "INSERT INTO shipments_to_assignments "
                + "(shipment_id, assignment_id) VAlUES (?, ?)"

            let promises = []
            for (let i = 0; i < shipmentIds.length; i++) {
                let shipmentPromises = []
                for (let j = 0; j < assignmentIds[i].length; j++) {
                    shipmentPromises.push(
                        dbPromise.query(stmt,
                            [shipmentIds[i], assignmentIds[i][j]])
                    )
                }

                promises.push(Promise.all(shipmentPromises))
            }

            return Promise.all(promises)
        })
        .then(() => {
            return [
                {
                    id: shipmentIds[0],
                    name: "Test",
                    destination: "Heidelberg",
                    items: [
                        {
                            shipment_id: shipmentIds[0],
                            id: itemIds[0],
                            name: "Chairs",
                            assigned_count: 50,
                        },
                    ]
                },
                {
                    id: shipmentIds[1],
                    name: "Test2",
                    destination: "Heidelberg2",
                    items: [
                        {
                            shipment_id: shipmentIds[1],
                            id: itemIds[0],
                            name: "Chairs",
                            assigned_count: 5,
                        },
                        {
                            shipment_id: shipmentIds[1],
                            id: itemIds[1],
                            name: "Beds",
                            assigned_count: 10,
                        },
                    ]
                },
                {
                    id: shipmentIds[2],
                    name: "Test3",
                    destination: "Heidelberg3",
                    items: [
                        {
                            shipment_id: shipmentIds[2],
                            id: itemIds[0],
                            name: "Chairs",
                            assigned_count: 10,
                        },
                        {
                            shipment_id: shipmentIds[2],
                            id: itemIds[1],
                            name: "Beds",
                            assigned_count: 2,
                        },
                        {
                            shipment_id: shipmentIds[2],
                            id: itemIds[2],
                            name: "Tables",
                            assigned_count: 1,
                        },
                    ]
                },
            ]
        })
    }
    
    function clearTables() {
        return dbPromise.query("DELETE FROM shipments_to_assignments")
            .then(() => {
                return dbPromise.query("DELETE FROM shipments")
            })
            .then(() => {
                return dbPromise.query("DELETE FROM item_assignments")
            })
            .then(() => {
                return dbPromise.query("DELETE FROM items")
            })
            .then(() => {
                return dbPromise.query("DELETE FROM deletions")
            })
    }

    describe("#getAllShipments", () => {
        it("should return all shipments", () => {
            let expectedData = []

            return insertShipmentDataset()
            .then(expected => {
                expectedData = expected
                let model = new ShipmentModel(dbPromise)

                return model.getAllShipments()
            })
            .then((shipments) => {
                expect(shipments).to.deep.equalInAnyOrder(expectedData)
            })
        })
    })

    describe("#getShipment", () => {
        it("should return a shipment with a single item", () => {
            let expectedData = []

            return insertShipmentDataset()
            .then(expected => {
                expectedData = expected[0]

                let model = new ShipmentModel(dbPromise)
                return model.getShipment(expectedData.id)
            })
            .then((shipment) => {
                expect(shipment).to.deep.equalInAnyOrder(expectedData)
            })
        })

        it("should return a shipment with multiple items", () => {
            let expectedData = []

            return insertShipmentDataset()
            .then((expected) => {
                expectedData = expected[2]

                let model = new ShipmentModel(dbPromise)
                return model.getShipment(expectedData.id)
            })
            .then((shipment) => {
                expect(shipment).to.deep.equalInAnyOrder(expectedData)
            })
        })
    })

    
    describe("#createShipment", () => {
        function runWithSingleItem(name, destination) {
            let itemIds = []

            return insertItemDataSet()
            .then(ids => {
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
                    dbPromise.query("SELECT shipment_id, item_id, assigned_count "
                        + "FROM shipments_to_assignments "
                        + "INNER JOIN item_assignments ON assignment_id = item_assignments.id "
                        + "ORDER BY assignment_id"),
                    id,
                    itemIds
                ])
            })
            .then((results) => {
                return {
                    actual: {
                        shipment: results[0][0][0],
                        items: results[1][0]
                    },
                    expected: {
                        shipment: {
                            name: name,
                            destination: destination
                        },
                        items:[
                            {
                                shipment_id: results[2],
                                item_id: itemIds[0],
                                assigned_count: -50
                        }]
                    }
                }
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
                    dbPromise.query("SELECT shipment_id, item_id, assigned_count "
                        + "FROM shipments_to_assignments "
                        + "INNER JOIN item_assignments ON assignment_id = item_assignments.id "
                        + "ORDER BY assignment_id"),
                    id,
                    itemIds
                ])
            })
            .then((results) => {
                return {
                    actual: {
                        shipment: results[0][0][0],
                        items: results[1][0]
                    },
                    expected: {
                        shipment: {
                            name: name,
                            destination: destination
                        },
                        items: [
                            {
                                shipment_id: results[2],
                                item_id: itemIds[0],
                                assigned_count: -50
                            },
                            {
                                shipment_id: results[2],
                                item_id: itemIds[1],
                                assigned_count: -5
                            }
                        ]
                    }
                }
            })
        }
        it("should insert a shipment, so that the field values are correct", () => {
            let name = "Test", destination = "Heidelberg"
            
            return runWithSingleItem(name, destination)
            .then(results => {
                expect(results.actual.shipment).to.deep.equal(results.expected.shipment)
            })
        })
        it("should insert a shipment, so that the item is correct", () => {
            let name = "Test", destination = "Heidelberg"
            
            return runWithSingleItem(name, destination)
            .then(results => {
                expect(results.actual.item).to.deep.equal(results.expected.item)
            })
        })

        it("should insert multiple items of a shipment", () => {
            let name = "Test2", destination = "Ludwigshafen"

            return runWithMultipleItems(name, destination)
            .then(results => {
                expect(results.actual.items).to.deep.equal(results.expected.items)                
            })
        })
    })
})
