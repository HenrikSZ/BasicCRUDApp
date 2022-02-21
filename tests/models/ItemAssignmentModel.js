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

    function createItemDataSet() {
        let itemIds = [], externalItemAssignmentIds = []

        return Promise.all([
            dbPromise.query("INSERT INTO items SET name = 'Chairs'"),
            dbPromise.query("INSERT INTO items SET name = 'Beds'"),
            dbPromise.query("INSERT INTO items SET name = 'Tables'"),
        ])
        .then(results => {
            itemIds = results.map(r => r[0].insertId)
            return Promise.all([
                dbPromise.query("INSERT INTO external_item_assignments VALUES()"),
                dbPromise.query("INSERT INTO external_item_assignments VALUES()")
            ])
        })
        .then(results => {
            externalItemAssignmentIds = results.map(r => r[0].insertId)

            return {
                itemIds: itemIds,
                externalItemAssignmentIds: externalItemAssignmentIds
            }
        })
    }

    function createAssignments() {
        let itemIds = [], assignmentIds = [], externalItemAssignmentIds = []
        return createItemDataSet()
        .then(ids => {
            itemIds = ids.itemIds
            externalItemAssignmentIds = ids.externalItemAssignmentIds
            return dbPromise.query("INSERT INTO item_assignments "
                + "SET assigned_count = 10, item_id = ?, external_assignment_id = ?",
                    [itemIds[0], externalItemAssignmentIds[0]])
        })
        .then(([results, fields]) => {
            assignmentIds.push(results.insertId)
            return dbPromise.query("INSERT INTO item_assignments "
                + "SET assigned_count = -10, item_id = ?, external_assignment_id = ?",
                    [itemIds[0], externalItemAssignmentIds[1]])
        })
        .then(([results, fields]) => {
            assignmentIds.push(results.insertId)
            return assignmentIds
        })
    }

    describe("#create", () => {
        it("should correctly create one assignment", () => {
            let count = 10, itemId = -1

            return createItemDataSet()
            .then(ids => {
                itemId = ids.itemIds[0]
                const model = new ItemAssignmentModel(dbPromise)
                return model.create(itemId, count,
                    undefined, ids.externalItemAssignmentIds[0])
            })
            .then(result => {
                expect(result).to.be.greaterThan(0)
                return dbPromise.query("SELECT item_id, assigned_count FROM item_assignments")
            })
            .then(([results, fields]) => {
                expect(results).to.have.length(1)
                let assignment = results[0]
                expect(assignment.assigned_count).to.equal(count)
                expect(assignment.item_id).to.equal(itemId)
            })
        })
        it("should throw an error if assignment is too high", () => {
            let count = -10, id = -1

            return createItemDataSet()
            .then(ids => {
                const model = new ItemAssignmentModel(dbPromise)
                id = ids.itemIds[0]
                return expect(
                    model.create(id, count, undefined, ids.externalItemAssignmentIds[0]))
                    .to.be.eventually
                    .rejectedWith("Assigned item count larger than available item count")
            })
        })
        it("should not create if assignment is too high", () => {
            let count = -10, id = -1

            return createItemDataSet()
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
        it("should delete one assignment", () => {
            return createAssignments()
            .then((ids) => {
                const model = new ItemAssignmentModel(dbPromise)
                return model.delete(ids[1])
            })
            .then(wasDeleted => {
                expect(wasDeleted).to.be.true
                return dbPromise.query("SELECT assigned_count FROM item_assignments")
            })
            .then(([results, fields]) => {
                expect(results).to.have.length(1)
                expect(results[0].assigned_count).to.equal(10)
            })
        })
        it("should throw an error when trying to delete too much", () => {
            return createAssignments()
            .then(ids => {
                const model = new ItemAssignmentModel(dbPromise)
                return expect(model.delete(ids[0])).to.eventually.be
                    .rejectedWith("Assigned item count larger than available item count")
            })
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
})
