import chai from "chai"
import sinon from "sinon"
import sinon_chai from "sinon-chai"
import mockReq from "../mocks/fastify/request.js"
import mockRes from "../mocks/fastify/reply.js"
import InventoryController from "../../dist/controllers/InventoryController.js"
import mockDeletionModel from "../mocks/models/DeletionModel.js"
import mockInventoryModel from "../mocks/models/InventoryModel.js"
chai.use(sinon_chai)

const expect = chai.expect

describe("InventoryController", () => {
    describe("#getInventory", () => {
        it("should send a result containing the whole inventory", async () => {
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
            
            await invController.getInventory(req, res)
            expect(res.send).to.be.calledWith(allItems)
        })
    })

    describe("#getInventoryItem", () => {
        it("should send a result containing the exact item", async () => {
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
                    item_id: 2
                }
            })
            let res = mockRes()
            
            await invController.getInventoryItem(req, res)
            expect(res.send).to.have.been.calledWith(chair)
            expect(mockModel.getItem).to.have.been.calledWith(2)
        })
        it("should send an error if the item is not available", async () => {
            let mockModel = mockInventoryModel()
            let invController = new InventoryController(
                mockModel, mockDeletionModel()
            )

            let req = mockReq({
                params: {
                    item_id: 3
                }
            })
            let res = mockRes()
            
            await expect(invController.getInventoryItem(req, res)).to.be
                .rejectedWith("An invalid parameter was passed in for field item_id")
        })
    })

    describe("#getDeletedInventory", () => {
        it("should send a result containing the deleted inventory", async () => {
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
            
            await invController.getDeletedInventory(req, res)
            expect(res.send).to.be.calledWith(deletedItems)
        })
    })

    describe("#postNewInventoryItem", () => {
        it("should insert the new item into the database", async () => {
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
            
            await invController.postNewInventoryItem(req, res)
            expect(mockModel.createItem).to.have.been.calledWith(item)
        })
        it("should return new inventory item with a status code 0f 201", async () => {
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
            
            await invController.postNewInventoryItem(req, res)
            expect(res.status).to.have.been.calledWith(201)
            expect(res.status).to.have.been.calledBefore(res.send)
            expect(res.send).to.have.been.calledWith(insertedItem)
        })
    })

    describe("#updateInventoryItem", () => {
        it("should update the item", async () => {
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
                    item_id: id
                }
            })
            let res = mockRes()
            
            await invController.updateInventoryItem(req, res)
            expect(mockModel.updateItem).to.have.been.calledWith(item, id)
        })
        it("should fail with error 400 when id invalid", async () => {
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
                    item_id: id
                }
            })
            let res = mockRes()
            
            await expect(invController.updateInventoryItem(req, res)).to.be
            .rejectedWith("An invalid parameter was passed in for field item_id")
        })
    })

    describe("#restoreInventoryItem", () => {
        it("should restore an deleted entry with a valid id", async () => {
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
                    item_id: itemId
                }
            })
            let res = mockRes()
            
            await invController.restoreInventoryItem(req, res)
            expect(mockModel.getDeletionId).to.have.been.calledWith(itemId)
            expect(mockDelModel.delete).to.have.been.calledWith(deletionId)
            expect(res.send).to.have.been.calledOnce
        })
        it("should fail with error 400 when trying to restore not deleted item", async () => {
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
                    item_id: itemId
                }
            })
            let res = mockRes()
            
            await expect(invController.restoreInventoryItem(req, res)).to.be
                .rejectedWith("An invalid parameter was passed in for field item_id")
            expect(mockModel.getDeletionId).to.have.been.calledWith(itemId)
            expect(mockDelModel.delete).to.not.have.been.calledWith(deletionId)
        })
        it("should fail with error 400 when trying to restore not existing item", async () => {
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
                    item_id: itemId
                }
            })
            let res = mockRes()
            
            await expect(invController.restoreInventoryItem(req, res)).to.be
                .rejectedWith("An invalid parameter was passed in for field item_id")
            expect(mockModel.getDeletionId).to.have.been.calledWith(itemId)
            expect(mockDelModel.delete).to.not.have.been.called
        })
    })

    describe("#deleteInventoryItem", () => {
        it("should delete an item if it is existing", async () => {
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
                    item_id: id
                },
                body: {
                    comment: deletionComment
                }
            })
            let res = mockRes()

            await invController.deleteInventoryItem(req, res)
            expect(mockModel.getDeletionId).to.have.been.calledWith(id)
            expect(mockDelModel.create).to.have.been.calledWith({ comment: deletionComment})
            expect(res.send).to.have.been.calledOnce
        })
        it("should fail with error 400 when trying to delete already deleted item", async () => {
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
                    item_id: id
                },
                body: {
                    comment: deletionComment
                }
            })
            let res = mockRes()

            await expect(invController.deleteInventoryItem(req, res)).to.be
                .rejectedWith("An invalid parameter was passed in for field item_id")
            expect(mockModel.getDeletionId).to.have.been.calledWith(id)
            expect(mockDelModel.create).to.not.have.been.called
        })
        it("should fail with error 400 when trying non-existing item", async () => {
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
                    item_id: id
                },
                body: {
                    comment: deletionComment
                }
            })
            let res = mockRes()

            await expect(invController.deleteInventoryItem(req, res)).to.be
                .rejectedWith("An invalid parameter was passed in for field item_id")
            expect(mockModel.getDeletionId).to.have.been.calledWith(id)
            expect(mockDelModel.create).to.not.have.been.called
        })
    })

    describe("#exportInventoryAsCsv", () => {
        it("should return the full csv string when given full", async () => {
            let data = {
                name: "Chair",
                count: 5,
                id: 10
            }
            let expected = "id,name,count\n10,Chair,5\n"
            let mockModel = mockInventoryModel({
                allItems: [data]
            })
            let invContr = new InventoryController(
                mockModel, mockDeletionModel()
            )

            let req = mockReq()
            let res = mockRes()

            await invContr.exportInventoryAsCsv(req, res)
            expect(res.send).to.have.been.calledWith(expected)
        })
        it("should return selected columns", async () => {
            let data = {
                name: "Chair",
                count: 5,
                id: 10,
                created_at: new Date()
            }
            let expected = "id,name,count\n10,Chair,5\n"
            let mockModel = mockInventoryModel({
                allItems: [data]
            })
            let invContr = new InventoryController(
                mockModel, mockDeletionModel()
            )

            let req = mockReq()
            let res = mockRes()

            await invContr.exportInventoryAsCsv(req, res)
            expect(res.send).to.have.been.calledWith(expected)
        })
    })

    describe("#exportDeletedInventoryAsCsv", () => {
        it("should return the full csv string when given full", async () => {
            let data = {
                name: "Chair",
                count: 5,
                id: 10,
                comment: "Einszweidreivier"
            }
            let expected = "id,name,count,comment\n10,Chair,5,Einszweidreivier\n"
            let mockModel = mockInventoryModel({
                deletedItems: [data]
            })
            let invContr = new InventoryController(
                mockModel, mockDeletionModel()
            )

            let req = mockReq()
            let res = mockRes()

            await invContr.exportDeletedInventoryAsCsv(req, res)
            expect(res.send).to.have.been.calledWith(expected)
        })
        it("should return selected columns", async () => {
            let data = {
                name: "Chair",
                count: 5,
                id: 10,
                comment: "Einszweidreivier",
                created_at: new Date()
            }
            let expected = "id,name,count,comment\n10,Chair,5,Einszweidreivier\n"
            let mockModel = mockInventoryModel({
                deletedItems: [data]
            })
            let invContr = new InventoryController(
                mockModel, mockDeletionModel()
            )

            let req = mockReq()
            let res = mockRes()

            await invContr.exportDeletedInventoryAsCsv(req, res)
            expect(res.send).to.have.been.calledWith(expected)
        })
    })
})
