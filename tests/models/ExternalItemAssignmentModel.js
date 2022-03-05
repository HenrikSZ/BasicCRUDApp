import chai from "chai"
import chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised)

const expect = chai.expect

import db from "../db.js"
import { clearTables } from "../test_util.js"

import ExternalItemAssignmentModel from "../../dist/models/ExternalItemAssignmentModel.js"

describe("ExternalItemAssignmentModel", () => {
    let dbPromise = null

    before(() => {
        dbPromise = db()
    })
    after(() => {
        dbPromise.end()
    })
    beforeEach(() => clearTables(dbPromise))

    describe("#create", () => {
        it("should insert a single external item assignment", async () => {
            const model = new ExternalItemAssignmentModel(dbPromise)

            const id = await model.create()
            expect(id).to.be.greaterThan(0)
            const [results, fields] = await dbPromise.query("SELECT * FROM external_item_assignments")
            expect(results).to.have.length(1)
        })
        it("should insert multiple external item assignments", async () => {
            const model = new ExternalItemAssignmentModel(dbPromise)

            const results = await Promise.all([model.create(), model.create(), model.create()])
            results.forEach(r => expect(r).to.be.greaterThan(0))
            const [results_1, fields] = await dbPromise.query("SELECT * FROM external_item_assignments")
            expect(results_1).to.have.length(3)
        })
    })
    describe("#delete", () => {
        it("should delete a external item assignment", async () => {
            const model = new ExternalItemAssignmentModel(dbPromise)

            const results = await Promise.all([
                dbPromise.query("INSERT INTO external_item_assignments VALUES()"),
                dbPromise.query("INSERT INTO external_item_assignments VALUES()"),
                dbPromise.query("INSERT INTO external_item_assignments VALUES()")
            ])
            let ids = results.map(r => r[0].insertId)
            const wasDeleted = await model.delete(ids[0])
            expect(wasDeleted).to.be.true

            const [results_1, fields] = await dbPromise.query("SELECT * FROM external_item_assignments")
            expect(results_1).to.have.length(2)
        })
    })
})
