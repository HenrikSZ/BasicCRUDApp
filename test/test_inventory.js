import chai from "chai"
import sinon from "sinon"
import sinon_chai from "sinon-chai"
import { mockReq, mockRes } from "sinon-express-mock"
import { InventoryController, InventoryModel, DeletionModel } from "../dist/inventory.js"
chai.use(sinon_chai)

const expect = chai.expect

describe("InventoryController", () => {
    describe("#entryIdMiddleware", () => {
        it ("should call next() if called with valid integer", () => {
            let invController = new InventoryController(
                new InventoryModel(), new DeletionModel())
            let req = mockReq({ 
                params: {
                    id: 10
                }
            })
            let res = mockRes()
            let next = sinon.spy()
    
            invController.entryIdMiddleware(req, res, next)
    
            expect(next).to.have.been.calledOnce
        })
        it ("should not call status() if called with valid integer", () => {
            let invController = new InventoryController(
                new InventoryModel(), new DeletionModel())
            let req = mockReq({ 
                params: {
                    id: 10
                }
            })
            let res = mockRes()
            let next = sinon.spy()
    
            invController.entryIdMiddleware(req, res, next)
    
            expect(res.status).to.have.callCount(0)
        })
        it ("should fail with error 400 when no id is provided", () => {
            let invController = new InventoryController(
                new InventoryModel(), new DeletionModel())
            let req = mockReq()
            let res = mockRes()
            let next = () => {}
    
            invController.entryIdMiddleware(req, res, next)
    
            expect(res.status).to.have.been.calledWith(400)
        })
    })

    describe("#isValidNewEntry", () => {
        it("should return true with a normal entry", () => {
            let invController = new InventoryController(
                new InventoryModel(), new DeletionModel())
            let validEntry = { name: "Walter", count: 1 }
            expect(invController.isValidNewEntry(validEntry)).to.equal(true)
        })
        it("should return true with a count of 0", () => {
            let invController = new InventoryController(
                new InventoryModel(), new DeletionModel())
            let validEntry = { name: "Alfred", count: 0 }
            expect(invController.isValidNewEntry(validEntry)).to.equal(true)
        })
        it("should return true with a name with one character", () => {
            let invController = new InventoryController(
                new InventoryModel(), new DeletionModel())
            let validEntry = { name: "A", count: 1 }
            expect(invController.isValidNewEntry(validEntry)).to.equal(true)
        })

        it("should return false with no fields", () => {
            let invController = new InventoryController(
                new InventoryModel(), new DeletionModel())
            let invalidEntry = {}
            expect(invController.isValidNewEntry(invalidEntry)).to.equal(false)
        })
        it("should return false with an invalid name", () => {
            let invController = new InventoryController(
                new InventoryModel(), new DeletionModel())
            let invalidEntry = { name: "", count: 1}
            expect(invController.isValidNewEntry(invalidEntry)).to.equal(false)
        })
        it("should return false with an invalid count", () => {
            let invController = new InventoryController(
                new InventoryModel(), new DeletionModel())
            let invalidEntry = { name: "A", count: -1 }
            expect(invController.isValidNewEntry(invalidEntry)).to.equal(false)
        })
        it("should return false with an invalid option", () => {
            let invController = new InventoryController(
                new InventoryModel(), new DeletionModel())
            let invalidEntry = { name: "B", count: 0, tester: "no" }
            expect(invController.isValidNewEntry(invalidEntry)).to.equal(false)
        })
    })
})
