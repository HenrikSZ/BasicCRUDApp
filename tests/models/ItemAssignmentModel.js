import chai from "chai"
import chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised)

const expect = chai.expect

import db from "../db.js"
import { clearTables } from "../test_util.js"

import ItemAssignmentModel from "../../dist/models/ItemAssignmentModel.js"

describe("ItemAssignmentModel", () => {
    let dbPromise = null

    before(() => {
        dbPromise = db()
    })
    after(() => {
        dbPromise.end()
    })
    beforeEach(() => clearTables(dbPromise))

    async function createItemDataset() {
        let itemIds = [], externalItemAssignmentIds = []

        const results = await Promise.all([
            dbPromise.query("INSERT INTO items SET name = 'Chairs'"),
            dbPromise.query("INSERT INTO items SET name = 'Beds'"),
            dbPromise.query("INSERT INTO items SET name = 'Tables'"),
        ])
        itemIds = results.map(r => r[0].insertId)

        const results_1 = await Promise.all([
            dbPromise.query("INSERT INTO external_item_assignments VALUES()"),
            dbPromise.query("INSERT INTO external_item_assignments VALUES()")
        ])
        externalItemAssignmentIds = results_1.map(r_1 => r_1[0].insertId)
        return {
            itemIds: itemIds,
            externalItemAssignmentIds: externalItemAssignmentIds
        }
    }

    async function createAssignments() {
        let itemIds = [], assignmentIds = [], externalItemAssignmentIds = []
        const ids = await createItemDataset()
        itemIds = ids.itemIds
        externalItemAssignmentIds = ids.externalItemAssignmentIds

        const [results, fields] = await dbPromise.query("INSERT INTO item_assignments "
            + "SET assigned_count = 10, item_id = ?, external_assignment_id = ?",
            [itemIds[0], externalItemAssignmentIds[0]])
        assignmentIds.push(results.insertId)

        const [results_1, fields_1] = await dbPromise.query("INSERT INTO item_assignments "
            + "SET assigned_count = -10, item_id = ?, external_assignment_id = ?",
            [itemIds[0], externalItemAssignmentIds[1]])

        assignmentIds.push(results_1.insertId)
        return assignmentIds
    }

    async function createShipmentDataset() {
        const name = "Test", source = "Köln", destination = "Düsseldorf", assignedCount = 20
        let itemId = -1, shipmentId = -1
        
        let stmt = "INSERT INTO items SET name = 'House'"
        let [results, fields] = await dbPromise.query(stmt)
            itemId = results.insertId

        stmt = "INSERT INTO shipments SET name = ?, source = ?, destination = ?";
        [results, fields] = await dbPromise.query(stmt, [name, source, destination])
        shipmentId = results.insertId

        stmt = "INSERT INTO item_assignments "
            + "SET shipment_id = ?, item_id = ?, assigned_count = ?";
        [results, fields] = await dbPromise.query(stmt, [shipmentId, itemId, assignedCount])

        return {
            itemId: itemId,
            shipmentId: shipmentId
        }
    }

    async function createShipmentDatasetForError() {
        const name = "Test", source = "Köln", destination = "Düsseldorf", assignedCount = 20

        let stmt = "INSERT INTO items SET name = 'House'"
        let [results, fields] = await dbPromise.query(stmt)
        let itemId = results.insertId

        stmt = "INSERT INTO shipments SET name = ?, source = ?, destination = ?";
        [results, fields] = await dbPromise.query(stmt, [name, source, destination])
        let shipmentId = results.insertId

        stmt = "INSERT INTO item_assignments "
            + "SET shipment_id = ?, item_id = ?, assigned_count = ?";
        [results, fields] = await dbPromise.query(stmt, [shipmentId, itemId, assignedCount])
            
        stmt = "INSERT INTO external_item_assignments VALUES()";
        [results, fields] = await dbPromise.query(stmt)
        let externalId = results.insertId
            
        stmt = "INSERT INTO item_assignments "
            + "SET item_id = ?, external_assignment_id = ?, assigned_count = ?";
        [results, fields] = await dbPromise.query(stmt, [itemId, externalId, -assignedCount])
        
        return {
            itemId: itemId,
            shipmentId: shipmentId
        }
    }

    describe("#create", () => {
        it("should correctly create one assignment", async () => {
            let count = 10, itemId = -1

            const ids = await createItemDataset()
            itemId = ids.itemIds[0]
            const model = new ItemAssignmentModel(dbPromise)

            let assignmentId = await model.create(itemId, count,
                undefined, ids.externalItemAssignmentIds[0])

            expect(assignmentId).to.be.greaterThan(0)

            let stmt = "SELECT item_id, assigned_count FROM item_assignments"
            const [results, fields] = await dbPromise.query(stmt)
            expect(results).to.have.length(1)

            let assignment = results[0]
            expect(assignment.assigned_count).to.equal(count)
            expect(assignment.item_id).to.equal(itemId)
        })
        it("should throw an error if assignment is too high", async () => {
            let count = -10, id = -1

            const ids = await createItemDataset()
            const model = new ItemAssignmentModel(dbPromise)
            id = ids.itemIds[0]

            await expect(
                model.create(id, count, undefined, ids.externalItemAssignmentIds[0]))
                .to.be.eventually
                .rejectedWith("An invalid parameter was passed in for field Assigned count too high")
        })
        it("should not create if assignment is too high", () => {
            let count = -10, id = -1

            return createItemDataset()
            .then(ids => {
                const model = new ItemAssignmentModel(dbPromise)
                id = ids[0]
                return model.create(id, count)
            })
            .catch(() => {
                return dbPromise.query("SELECT * FROM item_assignments")
            })
            .then(([results, fields]) => {
                expect(results).to.have.length(0)
            })
        })
    })

    describe("#delete", () => {
        it("should delete one assignment", async () => {
            const ids = await createAssignments()
            const model = new ItemAssignmentModel(dbPromise)

            const wasDeleted = await model.delete(ids[1])
            expect(wasDeleted).to.be.true
            
            const [results, fields] = await dbPromise.query("SELECT assigned_count FROM item_assignments")
            expect(results).to.have.length(1)
            expect(results[0].assigned_count).to.equal(10)
        })
        it("should throw an error when trying to delete too much", async () => {
            const ids = await createAssignments()
            const model = new ItemAssignmentModel(dbPromise)

            await expect(model.delete(ids[0])).to.eventually.be
                .rejectedWith("An invalid parameter was passed in for field Assigned count too high")
        })
        it("should not delete anything when trying to delete too much", () => {
            return createAssignments()
            .then(ids => {
                const model = new ItemAssignmentModel(dbPromise)
                return model.delete(ids[0])
            })
            .catch(() => {
                return dbPromise.query("SELECT assigned_count FROM item_assignments")
            })
            .then(([results, fields]) => {
                expect(results).to.have.length(2)
                expect(results[0].assigned_count + results[1].assigned_count).to.equal(0)
            })
        })
    })
    describe("#updateShipmentAssignment", () => {
        it("should update one assigned shipment item", async () => {
            let assignedCount = 10
            const info = await createShipmentDataset()
            const model = new ItemAssignmentModel(dbPromise)

            const wasDeleted = await model.updateShipmentAssignment(
                info.shipmentId, info.itemId, assignedCount)
            expect(wasDeleted).to.be.true
            
            const [results, fields] = await dbPromise.query("SELECT * FROM item_assignments")
            expect(results).to.have.length(1)
            expect(results[0].assigned_count).to.equal(assignedCount)
        })
        it("should throw an error if the assignment would be too high", async () => {
            const info = await createShipmentDataset()
            const model = new ItemAssignmentModel(dbPromise)
            
            expect(model.updateShipmentAssignment(info.shipmentId, info.itemId, -10))
                .to.be.rejectedWith("Assigned item count larger than available item count")
        })
        it("should not update if the assignment would be too high", () => {
            return createShipmentDataset()
            .then(info => {
                const model = new ItemAssignmentModel(dbPromise)
                return model.updateShipmentAssignment(info.shipmentId, info.itemId, -10)
            })
            .catch(() => {
                return dbPromise.query("SELECT * FROM item_assignments")
            })
            .then(([results, fields]) => {
                expect(results).to.have.length(1)
                expect(results[0].assigned_count).to.equal(20)
            })
        })
    })
    describe("#deleteShipmentAssignment", () => {
        it("should delete one assigned shipment item", async () => {
            const info = await createShipmentDataset()
            const model = new ItemAssignmentModel(dbPromise)

            const wasDeleted = await model.deleteShipmentAssignment(info.shipmentId, info.itemId)
            expect(wasDeleted).to.be.true

            const [results, fields] = await dbPromise.query("SELECT * FROM item_assignments")
            expect(results).to.have.length(0)
        })
        it("should throw an error if the assignment would be too high", () => {
            return createShipmentDatasetForError()
            .then(info => {
                const model = new ItemAssignmentModel(dbPromise)
                expect(model.deleteShipmentAssignment(info.shipmentId, info.itemId))
                    .to.be.rejectedWith("Assigned item count larger than available item count")
            })
        })
        it("should not delete if the assignment would be too high", () => {
            return createShipmentDatasetForError()
            .then(info => {
                const model = new ItemAssignmentModel(dbPromise)
                return model.deleteShipmentAssignment(info.shipmentId, info.itemId)
            })
            .catch(() => {
                return dbPromise.query("SELECT * FROM item_assignments")
            })
            .then(([results, fields]) => {
                expect(results).to.have.length(2)
            })
        })
    })
})
