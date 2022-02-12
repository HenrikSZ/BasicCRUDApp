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
            expect(res.send).to.not.have.been.calledOnce
        })
        it ("should fail with error 400 when no id is provided", () => {
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel())
            let req = mockReq()
            let res = mockRes()
            let next = sinon.spy()
    
            invController.entryIdMiddleware(req, res, next)
    
            expect(next).to.not.have.been.calledOnce
            expect(res.status).to.have.been.calledWith(400)
            expect(res.status).to.have.been.calledBefore(res.send)
            expect(res.send).to.have.been.calledOnce
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

            expect(next).to.have.not.been.calledOnce
            expect(res.status).to.have.been.calledWith(400)
            expect(res.status).to.have.been.calledBefore(res.send)
            expect(res.send).to.have.been.calledOnce
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

            expect(res.send).to.not.have.been.calledOnce
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

            expect(next).to.have.not.been.calledOnce
            expect(res.status).to.have.been.calledWith(400)
            expect(res.status).to.have.been.calledBefore(res.send)
            expect(res.send).to.have.been.calledOnce
        })
    })

    describe("#getInventory", () => {
        it("should send a result containing the whole inventory", () => {
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
            
            return invController.getInventory(req, res)
            .then(() => {
                expect(res.send).to.be.calledWith(allItems)
            })
        })
    })

    describe("#getInventoryItem", () => {
        it("should send a result containing the exact item", () => {
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
            
            return invController.getInventoryItem(req, res)
            .then(() => {
                expect(res.send).to.have.been.calledWith(chair)
                expect(mockModel.getItem).to.have.been.calledWith(2)
            })
        })
        it("should send an error if the item is not available", () => {
            let mockModel = mockInventoryModel()
            let invController = new InventoryController(
                mockModel, mockDeletionModel()
            )

            let req = mockReq({
                params: {
                    id: 3
                }
            })
            let res = mockRes()
            
            return invController.getInventoryItem(req, res)
            .then(() => {
                expect(res.status).to.have.been.calledWith(400)
                expect(res.status).to.have.been.calledBefore(res.send)
                expect(res.send).to.have.been.calledOnce
            })
        })
    })

    describe("#getDeletedInventory", () => {
        it("should send a result containing the deleted inventory", () => {
            let deletedItems = [
                {
                    name: "Chair",
                    count: 5,
                    id: 1,
                    comment: "Too small"
                },
                {
                    name: "Desk",
                    count: 10,
                    id: 2,
                    comment: "Wrong colo(u)r"
                }
            ]
            let mockModel = mockInventoryModel({
                deletedItems: deletedItems
            })
            let invController = new InventoryController(
                mockModel, mockDeletionModel()
            )

            let req = mockReq()
            let res = mockRes()
            
            return invController.getDeletedInventory(req, res)
            .then(() => {
                expect(res.send).to.be.calledWith(deletedItems)
            })
        })
    })

    describe("#postNewInventoryItem", () => {
        it("should insert the new item into the database", () => {
            let insertId = 5
            let item = {
                name: "Chair",
                count: 500
            }

            let mockModel = mockInventoryModel({
                insertId: insertId
            })
            let invController = new InventoryController(
                mockModel, mockDeletionModel()
            )

            let req = mockReq({
                body: item
            })
            let res = mockRes()
            
            return invController.postNewInventoryItem(req, res)
            .then(() => {
                expect(mockModel.insertItem).to.have.been.calledWith(item)
            })
        })
        it("should return new inventory item with a status code 0f 201", () => {
            let insertId = 5
            let item = {
                name: "Chair",
                count: 500
            }

            let insertedItem = {...item}
            insertedItem.id = insertId

            let mockModel = mockInventoryModel({
                insertId: insertId
            })
            let invController = new InventoryController(
                mockModel, mockDeletionModel()
            )

            let req = mockReq({
                body: item
            })
            let res = mockRes()
            
            return invController.postNewInventoryItem(req, res)
            .then(() => {
                expect(res.status).to.have.been.calledWith(201)
                expect(res.status).to.have.been.calledBefore(res.send)
                expect(res.send).to.have.been.calledWith(insertedItem)
            })
        })
    })

    describe("#updateInventoryItem", () => {
        it("should update the item", () => {
            let id = 5
            let item = {
                name: "Chair",
                count: 500
            }

            let mockModel = mockInventoryModel({
                wasUpdated: true
            })
            let invController = new InventoryController(
                mockModel, mockDeletionModel()
            )

            let req = mockReq({
                body: item,
                params: {
                    id: id
                }
            })
            let res = mockRes()
            
            return invController.updateInventoryItem(req, res)
            .then(() => {
                expect(mockModel.updateItem).to.have.been.calledWith(item, id)
            })
        })
        it("should fail with error 400 when id invalid", () => {
            let id = 5
            let item = {
                name: "Chair",
                count: 500
            }

            let mockModel = mockInventoryModel({
                wasUpdated: false
            })
            let invController = new InventoryController(
                mockModel, mockDeletionModel()
            )

            let req = mockReq({
                body: item,
                params: {
                    id: id
                }
            })
            let res = mockRes()
            
            return invController.updateInventoryItem(req, res)
            .then(() => {
                expect(res.status).to.have.been.calledWith(400)
                expect(res.status).to.have.been.calledBefore(res.send)
                expect(res.send).to.have.been.calledOnce
            })
        })
    })

    describe("#restoreInventoryItem", () => {
        it("should restore an deleted entry with a valid id", () => {
            let itemId = 5
            let deletionId = 8

            let mockModel = mockInventoryModel({
                deletionId: deletionId
            })
            let mockDelModel = mockDeletionModel({
                wasDeleted: true
            })
            let invController = new InventoryController(
                mockModel, mockDelModel
            )

            let req = mockReq({
                params: {
                    id: itemId
                }
            })
            let res = mockRes()
            
            return invController.restoreInventoryItem(req, res)
            .then(() => {
                expect(mockModel.getDeletionId).to.have.been.calledWith(itemId)
                expect(mockDelModel.delete).to.have.been.calledWith(deletionId)
                expect(res.send).to.have.been.calledOnce
            })
        })
        it("should fail with error 400 when trying to restore not deleted item", () => {
            let itemId = 5
            let deletionId = -1

            let mockModel = mockInventoryModel({
                deletionId: deletionId
            })
            let mockDelModel = mockDeletionModel({
                wasDeleted: false
            })
            let invController = new InventoryController(
                mockModel, mockDelModel
            )

            let req = mockReq({
                params: {
                    id: itemId
                }
            })
            let res = mockRes()
            
            return invController.restoreInventoryItem(req, res)
            .then(() => {
                expect(mockModel.getDeletionId).to.have.been.calledWith(itemId)
                expect(mockDelModel.delete).to.not.have.been.calledWith(deletionId)
                expect(res.status).to.have.been.calledWith(400)
                expect(res.status).to.have.been.calledBefore(res.send)
                expect(res.send).to.have.been.calledOnce
            })
        })
        it("should fail with error 400 when trying to restore not existing item", () => {
            let itemId = -1
            let deletionId = -1

            let mockModel = mockInventoryModel({
                deletionId: deletionId
            })
            let mockDelModel = mockDeletionModel({
                wasDeleted: false
            })
            let invController = new InventoryController(
                mockModel, mockDelModel
            )

            let req = mockReq({
                params: {
                    id: itemId
                }
            })
            let res = mockRes()
            
            return invController.restoreInventoryItem(req, res)
            .then(() => {
                expect(mockModel.getDeletionId).to.have.been.calledWith(itemId)
                expect(mockDelModel.delete).to.not.have.been.called
                expect(res.status).to.have.been.calledWith(400)
                expect(res.status).to.have.been.calledBefore(res.send)
                expect(res.send).to.have.been.calledOnce
            })
        })
    })

    describe("#putExistingInventoryItem", () => {
        it("should restore an item when no properties are provided", () => {
            let id = 10
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel()
            )
            invController.updateInventoryItem = sinon.spy()
            invController.restoreInventoryItem = sinon.spy()
    
            let req = mockReq({
                body: {},
                params: {
                    id: id
                }
            })
            let res = mockRes()
    
            invController.putExistingInventoryItem(req, res)
    
            expect(invController.updateInventoryItem).to.not.have.been.called
            expect(invController.restoreInventoryItem).have.been.calledWith(req, res)
        })
        it("should update and item when some properties are provided", () => {
            let id = 10
            let invController = new InventoryController(
                mockInventoryModel(), mockDeletionModel()
            )
            invController.updateInventoryItem = sinon.spy()
            invController.restoreInventoryItem = sinon.spy()
    
            let req = mockReq({
                body: {
                    name: "Desk"
                },
                params: {
                    id: id
                }
            })
            let res = mockRes()
    
            invController.putExistingInventoryItem(req, res)
    
            expect(invController.updateInventoryItem).to.have.been.calledWith(req, res)
            expect(invController.restoreInventoryItem).not.to.have.been.called
        })
    })

    describe("#deleteInventoryItem", () => {
        it("should delete an item if it is existing", () => {
            let id = 10
            let pastDeletionId = 0
            let deletionId = 11
            let deletionComment = "Delete"

            let mockModel = mockInventoryModel({
                wasUpdated: true,
                deletionId: pastDeletionId
            })
            let mockDelModel = mockDeletionModel({
                insertId: deletionId
            })

            let invController = new InventoryController(
                mockModel, mockDelModel
            )

            let req = mockReq({
                params: {
                    id: id
                },
                body: {
                    comment: deletionComment
                }
            })
            let res = mockRes()

            return invController.deleteInventoryItem(req, res)
            .then(() => {
                expect(mockModel.getDeletionId).to.have.been.calledWith(id)
                expect(mockDelModel.insert).to.have.been.calledWith(deletionComment)
                expect(res.send).to.have.been.calledOnce
            })
        })
        it("should fail with error 400 when trying to delete already deleted item", () => {
            let id = 10
            let pastDeletionId = 9
            let deletionId = 11
            let deletionComment = "Delete"
            
            let mockModel = mockInventoryModel({
                wasUpdated: true,
                deletionId: pastDeletionId
            })
            let mockDelModel = mockDeletionModel({
                insertId: deletionId
            })

            let invController = new InventoryController(
                mockModel, mockDelModel
            )

            let req = mockReq({
                params: {
                    id: id
                },
                body: {
                    comment: deletionComment
                }
            })
            let res = mockRes()

            return invController.deleteInventoryItem(req, res)
            .then(() => {
                expect(mockModel.getDeletionId).to.have.been.calledWith(id)
                expect(mockDelModel.insert).to.not.have.been.called
                expect(res.status).to.have.been.calledWith(400)
                expect(res.status).to.have.been.calledBefore(res.send)
                expect(res.send).to.have.been.calledOnce
            })
        })
        it("should fail with error 400 when trying non-existing item", () => {
            let id = 10
            let pastDeletionId = -1
            let deletionId = 11
            let deletionComment = "Delete"
            
            let mockModel = mockInventoryModel({
                wasUpdated: true,
                deletionId: pastDeletionId
            })
            let mockDelModel = mockDeletionModel({
                insertId: deletionId
            })

            let invController = new InventoryController(
                mockModel, mockDelModel
            )

            let req = mockReq({
                params: {
                    id: id
                },
                body: {
                    comment: deletionComment
                }
            })
            let res = mockRes()

            return invController.deleteInventoryItem(req, res)
            .then(() => {
                expect(mockModel.getDeletionId).to.have.been.calledWith(id)
                expect(mockDelModel.insert).to.not.have.been.called
                expect(res.status).to.have.been.calledWith(400)
                expect(res.status).to.have.been.calledBefore(res.send)
                expect(res.send).to.have.been.calledOnce
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
