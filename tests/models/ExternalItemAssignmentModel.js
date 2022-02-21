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
        it("should insert a single external item assignment", () => {
            const model = new ExternalItemAssignmentModel(dbPromise)

            return model.create()
            .then(id => {
                expect(id).to.be.greaterThan(0)
                
                return dbPromise.query("SELECT * FROM external_item_assignments")
            })
            .then(([results, fields]) => {
                expect(results).to.have.length(1)
            })
        })
        it("should insert multiple external item assignments", () => {
            const model = new ExternalItemAssignmentModel(dbPromise)

            return Promise.all([model.create(), model.create(), model.create()])
            .then(results => {
                results.forEach(r => expect(r).to.be.greaterThan(0))
                
                return dbPromise.query("SELECT * FROM external_item_assignments")
            })
            .then(([results, fields]) => {
                expect(results).to.have.length(3)
            })
        })
    })
    describe("#delete", () => {
        it("should delete a external item assignment", () => {
            const model = new ExternalItemAssignmentModel(dbPromise)

            return Promise.all([
                dbPromise.query("INSERT INTO external_item_assignments VALUES()"),
                dbPromise.query("INSERT INTO external_item_assignments VALUES()"),
                dbPromise.query("INSERT INTO external_item_assignments VALUES()")
            ])
            .then(results => {
                let ids = results.map(r => r[0].insertId)
                return model.delete(ids[0])
            })
            .then(wasDeleted => {
                expect(wasDeleted).to.be.true
                return dbPromise.query("SELECT * FROM external_item_assignments")
            })
            .then(([results, fields]) => {
                expect(results).to.have.length(2)
            })
        })
    })
})
