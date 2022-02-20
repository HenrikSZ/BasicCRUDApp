import chai from "chai"
import chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised)

const expect = chai.expect

import db from "../db.js"
import { clearTables } from "../test_util.js"

import AssignmentModel from "../../dist/models/AssignmentModel.js"

describe("AssignmentModel", () => {
    let dbPromise = null

    before(() => {
        dbPromise = db()
    })
    after(() => {
        dbPromise.end()
    })
    beforeEach(() => clearTables(dbPromise))

    function insertItemDataSet() {
        return Promise.all([
            dbPromise.query("INSERT INTO items SET name = 'Chairs'"),
            dbPromise.query("INSERT INTO items SET name = 'Beds'"),
            dbPromise.query("INSERT INTO items SET name = 'Tables'"),
        ])
        .then((results) => {
            return results.map(r => r[0].insertId)
        })
    }

    function insertAssignments() {
        let itemIds = [], assignmentIds = []
        return insertItemDataSet()
        .then(ids => {
            itemIds = ids
            return dbPromise.query("INSERT INTO item_assignments "
                + "SET assigned_count = 10, item_id = ?", [itemIds[0]])
        })
        .then(([results, fields]) => {
            assignmentIds.push(results.insertId)
            return dbPromise.query("INSERT INTO item_assignments "
                + "SET assigned_count = -10, item_id = ?", [itemIds[0]])
        })
        .then(([results, fields]) => {
            assignmentIds.push(results.insertId)
            return assignmentIds
        })
    }

    describe("#insert", () => {
        it("should correctly insert one assignment", () => {
            let count = 10, id = -1

            return insertItemDataSet()
            .then(ids => {
                const model = new AssignmentModel(dbPromise)
                id = ids[0]
                return model.insert(id, count, dbPromise)
            })
            .then(id => {
                expect(id).to.be.greaterThan(0)
                return dbPromise.query("SELECT item_id, assigned_count FROM item_assignments")
            })
            .then(([results, fields]) => {
                expect(results).to.have.length(1)
                let assignment = results[0]
                expect(assignment.assigned_count).to.equal(count)
                expect(assignment.item_id).to.equal(id)
            })
        })
        it("should throw an error if assignment is too high", () => {
            let count = -10, id = -1

            return insertItemDataSet()
            .then(ids => {
                const model = new AssignmentModel(dbPromise)
                id = ids[0]
                return expect(model.insert(id, count)).to.be.eventually
                    .rejectedWith("Assigned item count larger than available item count")
            })
        })
        it("should not insert if assignment is too high", () => {
            let count = -10, id = -1

            return insertItemDataSet()
            .then(ids => {
                const model = new AssignmentModel(dbPromise)
                id = ids[0]
                return model.insert(id, count)
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
            return insertAssignments()
            .then((ids) => {
                const model = new AssignmentModel(dbPromise)
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
            return insertAssignments()
            .then(ids => {
                const model = new AssignmentModel(dbPromise)
                return expect(model.delete(ids[0])).to.eventually.be
                    .rejectedWith("Assigned item count larger than available item count")
            })
        })
        it("should not delete anything when trying to delete too much", () => {
            return insertAssignments()
            .then(ids => {
                const model = new AssignmentModel(dbPromise)
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
