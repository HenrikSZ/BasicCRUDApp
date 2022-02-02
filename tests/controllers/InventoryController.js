import chai from "chai"
import sinon from "sinon"
import sinon_chai from "sinon-chai"
import { mockReq, mockRes } from "sinon-express-mock"
import InventoryController from "../../dist/controllers/InventoryController.js"
import mockDeletionModel from "../mocks/models/DeletionModel.js"
import mockInventoryModel from "../mocks/models/InventoryModel.js"
chai.use(sinon_chai)

const expect = chai.expect

describe("InventoryController", () => {
    describe("#entryIdMiddleware", () => {
        it ("should call next() without sending anything when with valid id", () => {
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel())
            let req = mockReq({ 
                params: {
                    id: 10
                }
            })
            let res = mockRes()
            let next = sinon.spy()
    
            invController.entryIdMiddleware(req, res, next)
    
            expect(next).to.have.been.calledOnce
            expect(res.send).to.not.have.been.called
        })
        it ("should fail with error 400 when no id is provided", () => {
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel())
            let req = mockReq()
            let res = mockRes()
            let next = sinon.spy()
    
            invController.entryIdMiddleware(req, res, next)
    
            expect(next).to.not.have.been.called
            expect(res.status).to.have.been.calledWith(400)
            expect(res.status).to.have.been.calledBefore(res.send)
            expect(res.send).to.have.been.called
        })
    })

    describe("#newInventoryItemMiddleware", () => {
        it("should call next() without sending anything when entries are valid", () => {
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel()
            )
            invController.isValidNewEntry = sinon.stub().returns(true)
            let req = mockReq({
                body: {
                    name: "test",
                    count: 5
                }
            })
            let res = mockRes()
            let next = sinon.spy()

            invController.newInventoryItemMiddleware(req, res, next)

            expect(res.send).to.not.have.been.called
            expect(next).to.have.been.calledOnce
        })

        it("should fail with error 400 when entries are invalid", () => {
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel()
            )
            invController.isValidNewEntry = sinon.stub().returns(false)
            let req = mockReq({
                body: {
                    name: "test",
                    count: -1
                }
            })
            let res = mockRes()
            let next = sinon.spy()

            invController.newInventoryItemMiddleware(req, res, next)

            expect(next).to.have.not.been.called
            expect(res.status).to.have.been.calledWith(400)
            expect(res.status).to.have.been.calledBefore(res.send)
            expect(res.send).to.have.been.called
        })
    })

    describe("#deleteCommentMiddleware", () => {
        it("should call next() without sending anything when comment is valid", () => {
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel()
            )
            let req = mockReq({
                body: {
                    comment: "Uno dos tres"
                }
            })
            let res = mockRes()
            let next = sinon.spy()

            invController.deleteCommentMiddleware(req, res, next)

            expect(res.send).to.not.have.been.called
            expect(next).to.have.been.calledOnce
        })

        it("should fail with error 400 when entries are invalid", () => {
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel()
            )
            let req = mockReq()
            let res = mockRes()
            let next = sinon.spy()

            invController.deleteCommentMiddleware(req, res, next)

            expect(next).to.have.not.been.called
            expect(res.status).to.have.been.calledWith(400)
            expect(res.status).to.have.been.calledBefore(res.send)
            expect(res.send).to.have.been.called
        })
    })

    describe("#getInventory", () => {
        it("should send a result containing the whole inventory", (done) => {
            let allItems = [
                {
                    name: "Chair",
                    count: 5,
                    id: 1
                },
                {
                    name: "Desk",
                    count: 10,
                    id: 2
                }
            ]
            let mockModel = mockInventoryModel({
                allItems: allItems
            })
            let invController = new InventoryController(
                mockModel, mockDeletionModel()
            )

            let req = mockReq()
            let res = mockRes()
            
            invController.getInventory(req, res)
            .then(() => {
                try {
                    expect(res.send).to.be.calledWith(allItems)
                    done()
                } catch (err) {
                    done(err)
                }
            })
        })
    })

    describe("#getInventoryItem", () => {
        it("should send a result containing the exact item", (done) => {
            let chair = {
                name: "Chair",
                count: 5,
                id: 2
            }
            let mockModel = mockInventoryModel({
                item: chair
            })
            let invController = new InventoryController(
                mockModel, mockDeletionModel()
            )

            let req = mockReq({
                params: {
                    id: 2
                }
            })
            let res = mockRes()
            
            invController.getInventoryItem(req, res)
            .then(() => {
                try {
                    expect(res.send).to.have.been.calledWith(chair)
                    expect(mockModel.getItem).to.have.been.calledWith(2)
                    done()
                } catch (err) {
                    done(err)
                }
            })
        })
        it("should send an error if the item is not available", (done) => {
            let chair = {
                name: "Chair",
                count: 5,
                id: 1
            }
            let desk = {
                name: "Desk",
                count: 10,
                id: 2
            }
            let allItems = [chair, desk]
            let mockModel = mockInventoryModel({
                allItems: allItems
            })
            let invController = new InventoryController(
                mockModel, mockDeletionModel()
            )

            let req = mockReq({
                params: {
                    id: 3
                }
            })
            let res = mockRes()
            
            invController.getInventoryItem(req, res)
            .then(() => {
                try {
                    expect(res.status).to.have.been.calledWith(400)
                    expect(res.status).to.have.been.calledBefore(res.send)
                    expect(res.send).to.have.been.called
                    done()
                } catch (err) {
                    done(err)
                }
            })
        })
    })

    describe("#isValidNewEntry", () => {
        it("should return true with a normal entry", () => {
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel()
            )
            let validEntry = { name: "Walter", count: 1 }
            expect(invController.isValidNewEntry(validEntry)).to.equal(true)
        })
        it("should return true with a count of 0", () => {
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel()
            )
            let validEntry = { name: "Alfred", count: 0 }
            expect(invController.isValidNewEntry(validEntry)).to.equal(true)
        })
        it("should return true with a name with one character", () => {
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel()
            )
            let validEntry = { name: "A", count: 1 }
            expect(invController.isValidNewEntry(validEntry)).to.equal(true)
        })

        it("should return false with no fields", () => {
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel()
            )
            let invalidEntry = {}
            expect(invController.isValidNewEntry(invalidEntry)).to.equal(false)
        })
        it("should return false with an invalid name", () => {
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel()
            )
            let invalidEntry = { name: "", count: 1}
            expect(invController.isValidNewEntry(invalidEntry)).to.equal(false)
        })
        it("should return false with an invalid count", () => {
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel()
            )
            let invalidEntry = { name: "A", count: -1 }
            expect(invController.isValidNewEntry(invalidEntry)).to.equal(false)
        })
        it("should return false with an invalid option", () => {
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel()
            )
            let invalidEntry = { name: "B", count: 0, tester: "no" }
            expect(invController.isValidNewEntry(invalidEntry)).to.equal(false)
        })
    })
})
