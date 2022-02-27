import chai from "chai"
import deepEqualInAnyOrder from "deep-equal-in-any-order"
chai.use(deepEqualInAnyOrder)

const expect = chai.expect

import db from "../db.js"
import { clearTables } from "../test_util.js"

import ShipmentModel from "../../dist/models/ShipmentModel.js"
import ItemAssignmentModel from "../../dist/models/ItemAssignmentModel.js"


describe("ShipmentModel", () => {
    let dbPromise = null

    before(() => {
        dbPromise = db()
    })
    after(() => {
        dbPromise.end()
    })
    beforeEach(() => clearTables(dbPromise))


    /**
     * Chairs   | 100
     * Beds     | 55
     * Tables   | 1
     * 
     * @returns The ids of the inserted items
     */
    async function insertItemDataSet() {
        let itemIds = [], externalItemAssignments = []

        const results = await Promise.all([
            dbPromise.query("INSERT INTO items SET name = 'Chairs'"),
            dbPromise.query("INSERT INTO items SET name = 'Beds'"),
            dbPromise.query("INSERT INTO items SET name = 'Tables'"),
        ])
        itemIds = results.map(([queryResult, fields]) => queryResult.insertId)

        const results_1 = await Promise.all([
            dbPromise.query("INSERT INTO external_item_assignments VALUES()"),
            dbPromise.query("INSERT INTO external_item_assignments VALUES()"),
            dbPromise.query("INSERT INTO external_item_assignments VALUES()")
        ])
        externalItemAssignments =
            results_1.map(([queryResult_1, fields_1]) => queryResult_1.insertId)

        const stmt = "INSERT INTO item_assignments "
            + "(item_id, assigned_count, external_assignment_id) "
            + "VALUES (?, ?, ?)"
        await Promise.all([
            dbPromise.query(stmt, [itemIds[0], 100, externalItemAssignments[0]]),
            dbPromise.query(stmt, [itemIds[1], 55, externalItemAssignments[1]]),
            dbPromise.query(stmt, [itemIds[2], 1, externalItemAssignments[2]]),
        ])
        return itemIds
    }


    /**
     * Test: Heidelberg     | Chairs: 50
     * Test2: Heidelberg2   | Chairs: 5, Beds: 10
     * Test3: Heidelberg3   | Chairs: 10, Beds: 2, Tables: 1
     * 
     * @returns the expected output of all shipments.
     */
    async function insertShipmentDataset() {
        let itemIds = [], assignmentIds = [], shipmentIds = []

        const ids = await insertItemDataSet()
        itemIds = ids
        const [results, fields] = await dbPromise.query("INSERT INTO shipments (name, source, destination) "
            + "VALUES ('Test', 'Mannheim', 'Heidelberg')")
        shipmentIds.push(results.insertId)
        const [results_1, fields_1] = await dbPromise.query("INSERT INTO shipments (name, source, destination) "
            + "VALUES ('Test2', 'Mannheim2', 'Heidelberg2')")
        shipmentIds.push(results_1.insertId)
        const [results_2, fields_2] = await dbPromise.query("INSERT INTO shipments (name, source, destination) "
            + "VALUES ('Test3', 'Mannheim3', 'Heidelberg3')")
        shipmentIds.push(results_2.insertId)
        const stmt = "INSERT INTO item_assignments "
            + "(item_id, assigned_count, shipment_id) VALUES (?, ?, ?)"
        await Promise.all([
            Promise.all([
                dbPromise.query(stmt, [itemIds[0], -50, shipmentIds[0]]),
            ]),
            Promise.all([
                dbPromise.query(stmt, [itemIds[0], -5, shipmentIds[1]]),
                dbPromise.query(stmt, [itemIds[1], -10, shipmentIds[1]]),
            ]),
            Promise.all([
                dbPromise.query(stmt, [itemIds[0], -10, shipmentIds[2]]),
                dbPromise.query(stmt, [itemIds[1], -2, shipmentIds[2]]),
                dbPromise.query(stmt, [itemIds[2], -1, shipmentIds[2]]),
            ])
        ])
        return {
            assignmentIds: assignmentIds,
            expectedShipments: [
                {
                    id: shipmentIds[0],
                    name: "Test",
                    source: "Mannheim",
                    destination: "Heidelberg",
                    items: [
                        {
                            shipment_id: shipmentIds[0],
                            id: itemIds[0],
                            name: "Chairs",
                            assigned_count: -50,
                        },
                    ]
                },
                {
                    id: shipmentIds[1],
                    name: "Test2",
                    source: "Mannheim2",
                    destination: "Heidelberg2",
                    items: [
                        {
                            shipment_id: shipmentIds[1],
                            id: itemIds[0],
                            name: "Chairs",
                            assigned_count: -5,
                        },
                        {
                            shipment_id: shipmentIds[1],
                            id: itemIds[1],
                            name: "Beds",
                            assigned_count: -10,
                        },
                    ]
                },
                {
                    id: shipmentIds[2],
                    name: "Test3",
                    source: "Mannheim3",
                    destination: "Heidelberg3",
                    items: [
                        {
                            shipment_id: shipmentIds[2],
                            id: itemIds[0],
                            name: "Chairs",
                            assigned_count: -10,
                        },
                        {
                            shipment_id: shipmentIds[2],
                            id: itemIds[1],
                            name: "Beds",
                            assigned_count: -2,
                        },
                        {
                            shipment_id: shipmentIds[2],
                            id: itemIds[2],
                            name: "Tables",
                            assigned_count: -1,
                        },
                    ]
                },
            ]
        }
    }

    describe("#getAllShipments", () => {
        it("should return all shipments", async () => {
            let expectedData = []

            const expected = await insertShipmentDataset()
            expectedData = expected.expectedShipments
            let model = new ShipmentModel(dbPromise)
            const shipments = await model.getAllShipments()
            expect(shipments).to.deep.equalInAnyOrder(expectedData)
        })
    })

    describe("#getShipment", () => {
        it("should return a shipment with a single item", async () => {
            let expectedData = []

            const expected = await insertShipmentDataset()
            expectedData = expected.expectedShipments[0]
            let model = new ShipmentModel(dbPromise)
            const shipment = await model.getShipment(expectedData.id)
            expect(shipment).to.deep.equalInAnyOrder(expectedData)
        })

        it("should return a shipment with multiple items", async () => {
            let expectedData = []

            const expected = await insertShipmentDataset()
            expectedData = expected.expectedShipments[2]
            let model = new ShipmentModel(dbPromise)
            const shipment = await model.getShipment(expectedData.id)
            expect(shipment).to.deep.equalInAnyOrder(expectedData)
        })
    })

    
    describe("#createShipment", () => {
        async function runWithSingleItem(name, source, destination) {
            let itemIds = []

            const ids = await insertItemDataSet()
            itemIds = ids
            let insertShipment = {
                name: name,
                source: source,
                destination: destination,
                items: [
                    {
                        id: itemIds[0],
                        count: -50
                    }
                ]
            }
            let model = new ShipmentModel(dbPromise)
            const id = await model.createShipment(insertShipment)
            const results = await Promise.all([
                dbPromise.query("SELECT name, destination FROM shipments"),
                dbPromise.query("SELECT shipment_id, item_id, assigned_count "
                    + "FROM item_assignments"),
                id,
                itemIds
            ])
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
                        }
                    ]
                }
            }
        }
        async function runWithMultipleItems(name, source, destination) {
            let itemIds = []

            const ids = await insertItemDataSet()
            itemIds = ids
            let insertShipment = {
                name: name,
                source: source,
                destination: destination,
                items: [
                    {
                        id: itemIds[0],
                        count: -50
                    },
                    {
                        id: itemIds[1],
                        count: -5
                    }
                ]
            }
            let model = new ShipmentModel(dbPromise)
            const id = await model.createShipment(insertShipment)
            const results = await Promise.all([
                dbPromise.query("SELECT name, destination FROM shipments"),
                dbPromise.query("SELECT shipment_id, item_id, assigned_count "
                    + "FROM item_assignments WHERE shipment_id IS NOT NULL"),
                id,
                itemIds
            ])
            return {
                actual: {
                    shipment: results[0][0][0],
                    items: results[1][0]
                },
                expected: {
                    shipment: {
                        name: name,
                        destination: destination,
                        source: source
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
        }
        it("should insert a shipment, so that the field values are correct", async () => {
            let name = "Test", source = "Mannheim", destination = "Heidelberg"
            
            const results = await runWithSingleItem(name, source, destination)
            expect(results.actual.shipment).to.deep.equal(results.expected.shipment)
        })
        it("should insert a shipment, so that the item is correct", async () => {
            let name = "Test", source = "Mannheim", destination = "Heidelberg"
            
            const results = await runWithSingleItem(name, source, destination)
            expect(results.actual.item).to.deep.equal(results.expected.item)
        })

        it("should insert multiple items of a shipment", async () => {
            let name = "Test", source = "Mannheim", destination = "Ludwigshafen"

            const results = await runWithMultipleItems(name, source, destination)
            expect(results.actual.items).to.deep.equal(results.expected.items)
        })
    })

    describe("#deleteShipment", () => {
        it("should indicate deletion with true return value", async () => {
            const expected = await insertShipmentDataset()
            let shipmentToDelete = expected.expectedShipments[0]
            let model = new ShipmentModel(dbPromise)
            const deleted = await model.deleteShipment(shipmentToDelete.id)
            expect(deleted).to.equal(true)
        })

        it("should delete shipment with one item", async () => {
            let expectedShipmentIds = [], expectedItemIds = []
            const expected = await insertShipmentDataset()
            let shipmentToDelete = expected.expectedShipments[0]
            let expectedShipments = expected.expectedShipments.slice(1)
            let model = new ShipmentModel(dbPromise)

            expectedShipmentIds = expectedShipments.map(shipment => shipment.id)
            expectedItemIds = expectedShipments.map(shipment_1 => shipment_1.items.map((item) => item.id))
                .reduce((prev, value) => prev.concat(value), [])
            expectedItemIds = Array.from(new Set(expectedItemIds))

            await model.deleteShipment(shipmentToDelete.id)
            let results = await Promise.all([
                dbPromise.query("SELECT id FROM shipments"),
                dbPromise.query("SELECT DISTINCT item_id FROM item_assignments"),
            ])
            results = results.map(r => r[0])
            expect(results[0].map(r_1 => r_1.id)).to.equalInAnyOrder(expectedShipmentIds)
            expect(results[1].map(r_2 => r_2.item_id)).to.equalInAnyOrder(expectedItemIds)
        })
        it("should delete shipment with multiple items", async () => {
            let expectedShipmentIds = [], expectedItemIds = []
            const expected = await insertShipmentDataset()
            let shipmentToDelete = expected.expectedShipments[1]
            let expectedShipments = [expected.expectedShipments[0]]
                .concat(expected.expectedShipments.slice(2))
            let model = new ShipmentModel(dbPromise)

            expectedShipmentIds = expectedShipments.map(shipment => shipment.id)
            expectedItemIds = expectedShipments.map(shipment_1 => shipment_1.items.map((item) => item.id))
                .reduce((prev, value) => prev.concat(value), [])
            expectedItemIds = Array.from(new Set(expectedItemIds))
            
            await model.deleteShipment(shipmentToDelete.id)
            let results = await Promise.all([
                dbPromise.query("SELECT id FROM shipments"),
                dbPromise.query("SELECT DISTINCT item_id FROM item_assignments"),
            ])
            results = results.map(r => r[0])
            expect(results[0].map(r_1 => r_1.id)).to.equalInAnyOrder(expectedShipmentIds)
            expect(results[1].map(r_2 => r_2.item_id)).to.equalInAnyOrder(expectedItemIds)
        })
    })
    describe("#updateShipment", () => {
        it("should do nothing when no name and destination are specified", () => {
            const shipmentData = {
                name: "Test",
                source: "A",
                destination: "B"
            }
            const stmt = "INSERT INTO shipments "
                + "SET ?"

            return dbPromise.query(stmt, shipmentData)
            .then(([results, fields]) => {
                let id = results.insertId
                const model = new ShipmentModel(dbPromise)

                return model.updateShipment(id, {})
            })
            .then(wasUpdated => {
                expect(wasUpdated).to.be.false
                return dbPromise.query("SELECT name, source, destination FROM shipments")
            })
            .then(([results, fields]) => {
                expect(results.length).to.equal(1)
                expect(results[0]).to.deep.equal(shipmentData)
            })
        })

        it("should correctly update when fields are present", () => {
            const shipmentData = {
                name: "Test",
                source: "A",
                destination: "B"
            }
            let modifiedData = {...shipmentData}
            modifiedData.name = "Production"

            const stmt = "INSERT INTO shipments "
                + "SET ?"

            return dbPromise.query(stmt, shipmentData)
            .then(([results, fields]) => {
                let id = results.insertId
                const model = new ShipmentModel(dbPromise)

                return model.updateShipment(id, { name: modifiedData.name })
            })
            .then(wasUpdated => {
                expect(wasUpdated).to.be.true
                return dbPromise.query("SELECT name, source, destination FROM shipments")
            })
            .then(([results, fields]) => {
                expect(results.length).to.equal(1)
                expect(results[0]).to.deep.equal(modifiedData)
            })
        })

        it("should not update when the shipment id is not assigned", () => {
            const shipmentData = {
                name: "Test",
                source: "A",
                destination: "B"
            }
            let modifiedData = {...shipmentData}
            modifiedData.name = "Production"

            const stmt = "INSERT INTO shipments "
                + "SET ?"

            return dbPromise.query(stmt, shipmentData)
            .then(([results, fields]) => {
                let id = results.insertId
                const model = new ShipmentModel(dbPromise)

                return model.updateShipment(id + 1, { name: modifiedData.name })
            })
            .then(wasUpdated => {
                expect(wasUpdated).to.be.false
                return dbPromise.query("SELECT name, source, destination FROM shipments")
            })
            .then(([results, fields]) => {
                expect(results.length).to.equal(1)
                expect(results[0]).to.deep.equal(shipmentData)
            })
        })
    })
    describe("#exportAllShipmentsAsCsv", () => {
        it("should export all shipments data correctly", async () => {
            await insertShipmentDataset()
            const model = new ShipmentModel(dbPromise)
            const file = await model.exportAllShipmentsAsCsv()
            const expected = "shipment,source,destination,item_name,count\n"
                + "Test,Mannheim,Heidelberg,Chairs,-50\n"
                + "Test2,Mannheim2,Heidelberg2,Chairs,-5\n"
                + "Test2,Mannheim2,Heidelberg2,Beds,-10\n"
                + "Test3,Mannheim3,Heidelberg3,Chairs,-10\n"
                + "Test3,Mannheim3,Heidelberg3,Beds,-2\n"
                + "Test3,Mannheim3,Heidelberg3,Tables,-1\n"
            expect(file).to.equal(expected)
        })
    })
})
