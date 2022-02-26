import chai from "chai"
import sinon from "sinon"
import sinon_chai from "sinon-chai"
import { mockReq, mockRes } from "sinon-express-mock"
import ShipmentController from "../../dist/controllers/ShipmentController.js"
import mockShipmentModel from "../mocks/models/ShipmentModel.js"
chai.use(sinon_chai)

const expect = chai.expect

describe("ShipmentController", () => {
    function getShipmentsFromDatabase() {
        return [
            {
                name: "ABC",
                destination: "Kiel",
                items: [
                    {
                        name: "Test",
                        count: 50,
                        id: 5
                    }
                ]
            },
            {
                name: "DEF",
                destination: "München",
                items: [
                    {
                        name: "Test2",
                        count: 51,
                        id: 5
                    }
                ]
            }
        ]
    }
    function getShipmentFromClient() {
        return {
            name: "ABC",
            destination: "Kiel",
            items: [
                {
                    count: 50,
                    id: 5
                }
            ]
        }
    }

    describe("#createShipment", () => {
        it("should create a shipment with the ShipmentModel", () => {
            const shipment = getShipmentFromClient()
            const model = mockShipmentModel()
            const req = mockReq()
            req.shipment = shipment
            const res = mockRes()
            const contr = new ShipmentController(model)

            return contr.createShipment(req, res)
            .then(() => {
                expect(model.createShipment).to.have.been.calledWith(shipment)
                expect(res.send).to.be.calledOnce
            })
        })
        /* TODO: find a good way to test behaviour on database error
        it("should return an error response if the database reports an error", () => {
            const shipment = getShipmentFromClient()
            const model = mockShipmentModel(rejects = { allShipments: }) 
            const req = mockReq()
            req.shipment = shipment
            const res = mockRes()
            const contr = new ShipmentController(model)

            return contr.createShipment(req, res)
            .then(() => {
                expect(model.createShipment).to.have.been.calledWith(shipment)
                expect(res.send).to.be.calledOnce
            })
        })*/
    })
    describe("#createShipmentMiddleware", () => {
        it("should allow a valid shipment", () => {
            const shipment = {
                name: "ABC",
                source: "München",
                destination: "Kiel",
                items: [
                    {
                        count: 50,
                        id: 5
                    }
                ]
            }
            const req = mockReq({ body: shipment })
            const res = mockRes()
            const next = sinon.spy()
            const model = mockShipmentModel()
            const contr = new ShipmentController(model)

            contr.createShipmentMiddleware(req, res, next)

            expect(next).to.have.been.calledOnce
            expect(req.shipment).to.deep.equal(shipment)
        })
        it("should allow a valid shipment with stringified numbers", () => {
            const shipment = {
                name: "ABC",
                source: "München",
                destination: "Kiel",
                items: [
                    {
                        count: "50",
                        id: "5"
                    }
                ]
            }
            const req = mockReq({ body: shipment })
            const res = mockRes()
            const next = sinon.spy()
            const model = mockShipmentModel()
            const contr = new ShipmentController(model)

            contr.createShipmentMiddleware(req, res, next)

            expect(next).to.have.been.calledOnce
            expect(req.shipment).to.deep.equal(shipment)
        })
        it("should cut off additional fields", () => {
            const target = {
                name: "ABC",
                source: "München",
                destination: "Kiel",
                items: [
                    {
                        count: "50",
                        id: "5"
                    }
                ]
            }
            const shipment = {...target}
            shipment.hocuspocus = "None"

            const req = mockReq({ body: shipment })
            const res = mockRes()
            const next = sinon.spy()
            const model = mockShipmentModel()
            const contr = new ShipmentController(model)

            contr.createShipmentMiddleware(req, res, next)

            expect(next).to.have.been.calledOnce
            expect(req.shipment).to.deep.equal(target)
        })

        function negativeTestOneShipment(shipment) {
            const req = mockReq({ body: shipment })
            const res = mockRes()
            const next = sinon.spy()
            const model = mockShipmentModel()
            const contr = new ShipmentController(model)

            contr.createShipmentMiddleware(req, res, next)

            expect(next).to.not.have.been.called
            expect(res.status).to.have.been.calledWith(400)
            expect(res.send).to.have.been.calledOnce
        }
        it("should not allow a shipment without a name", () => {
            const shipment = {
                source: "München",
                destination: "Kiel",
                items: [
                    {
                        count: "50",
                        id: "5"
                    }
                ]
            }
            negativeTestOneShipment(shipment)
        })
        it("should not allow a shipment without a source", () => {
            const shipment = {
                destination: "Kiel",
                name: "ABC",
                items: [
                    {
                        count: "50",
                        id: "5"
                    }
                ]
            }
            negativeTestOneShipment(shipment)
        })
        it("should not allow a shipment without a destination", () => {
            const shipment = {
                name: "ABC",
                items: [
                    {
                        count: "50",
                        id: "5"
                    }
                ]
            }
            negativeTestOneShipment(shipment)
        })
        it("should not allow a shipment with no items", () => {
            const shipment = {
                name: "ABC",
                destination: "Kiel"
            }
            negativeTestOneShipment(shipment)
        })
        it("should not allow a shipment when items is not an array", () => {
            const shipment = {
                name: "ABC",
                destination: "Kiel",
                items: "You are wrong"
            }
            negativeTestOneShipment(shipment)
        })
        it("should not allow a shipment with invalid items", () => {
            const shipment = {
                name: "ABC",
                destination: "Kiel",
                items: [
                    {
                        id: "50",
                        count: "String"
                    }
                ]
            }
            negativeTestOneShipment(shipment)
        })
    })
    describe("#getAllShipments", () => {
        it("should send provided shipments from ShipmentModel", () => {
            const shipments = getShipmentsFromDatabase()
            const model = mockShipmentModel({ allShipments: shipments })
            const req = mockReq()
            const res = mockRes()
            const contr = new ShipmentController(model)

            return contr.getAllShipments(req, res)
            .then(() => {
                expect(res.send).to.have.been.calledWith(shipments)
            })
        })
    })
    describe("#getShipment", () => {
        it("should send one provided shipment from ShipmentModel", () => {
            let shipmentId = 10
            const shipment = getShipmentsFromDatabase()[0]
            const model = mockShipmentModel({ shipment: shipment })
            const req = mockReq({ params: {
                id: shipmentId
            }})
            req.shipmentId = shipmentId
            const res = mockRes()
            const contr = new ShipmentController(model)

            return contr.getShipment(req, res)
            .then(() => {
                expect(model.getShipment).to.have.been.calledWith(shipmentId)
                expect(res.send).to.have.been.calledWith(shipment)
            })
        })
    })
    describe("#updateShipment", () => {
        it("should update the shipment", () => {
            let shipmentId = 10
            let shipmentUpdate = {
                name: "Test",
                source: "A",
                destination: "B"
            }

            const model = mockShipmentModel()
            const req = mockReq({ params: {
                id: shipmentId
            }})
            req.shipmentId = shipmentId
            req.shipmentUpdate = shipmentUpdate
            const res = mockRes()
            const contr = new ShipmentController(model)

            return contr.updateShipment(req, res)
            .then(() => {
                expect(model.updateShipment).to.have.been.calledWith(shipmentId, shipmentUpdate)
                expect(res.send).to.have.been.calledOnce
            })
        })
    })
    describe("#exportShipmentsAsCsv", () => {
        it("should send the csv file of exported shipments", () => {
            let resolves = {
                shipmentsCsv: "shipment,destination,item_name,count\n"
                    + "Test,Heidelberg,Chairs,50\n"
                    + "Test2,Heidelberg2,Chairs,5\n"
                    + "Test2,Heidelberg2,Beds,10\n"
                    + "Test3,Heidelberg3,Chairs,10\n"
                    + "Test3,Heidelberg3,Beds,2\n"
                    + "Test3,Heidelberg3,Tables,1\n"
            }

            let model = mockShipmentModel(resolves)
            let req = mockReq()
            let res = mockRes()

            let contr = new ShipmentController(model)

            return contr.exportShipmentsAsCsv(req, res)
            .then(() => {
                expect(res.send).to.have.been.calledWith(resolves.shipmentsCsv)
            })
        })  
    })
    describe("#shipmentIdMiddleware", () => {
        it("should not allow missing id", () => {
            const model = mockShipmentModel()
            const req = mockReq()
            const res = mockRes()
            const next = sinon.spy()
            const contr = new ShipmentController(model)

            contr.shipmentIdMiddleware(req, res, next)

            expect(next).to.not.have.been.called
            expect(res.status).to.have.been.calledWith(400)
            expect(res.send).to.have.been.calledOnce
        })
        it("should not allow string as id", () => {
            const model = mockShipmentModel()
            const req = mockReq({
                params: {
                    shipmentId: "test"
                }
            })
            const res = mockRes()
            const next = sinon.spy()
            const contr = new ShipmentController(model)

            contr.shipmentIdMiddleware(req, res, next)
            
            expect(next).to.not.have.been.called
            expect(res.status).to.have.been.calledWith(400)
            expect(res.send).to.have.been.calledOnce
        })
        it("should not allow negative number as id", () => {
            const model = mockShipmentModel()
            const req = mockReq({
                params: {
                    shipmentId: -10
                }
            })
            const res = mockRes()
            const next = sinon.spy()
            const contr = new ShipmentController(model)

            contr.shipmentIdMiddleware(req, res, next)
            
            expect(next).to.not.have.been.called
            expect(res.status).to.have.been.calledWith(400)
            expect(res.send).to.have.been.calledOnce
        })
        it("should allow a valid id as string", () => {
            let shipmentId = 15
            const model = mockShipmentModel()
            const req = mockReq({
                params: {
                    shipmentId: shipmentId.toString()
                }
            })
            const res = mockRes()
            const next = sinon.spy()
            const contr = new ShipmentController(model)

            contr.shipmentIdMiddleware(req, res, next)
            
            expect(next).to.have.been.called
            expect(req.shipmentId).to.equal(shipmentId)
            expect(res.send).to.not.have.been.called
        })
        it("should allow a valid id", () => {
            let shipmentId = 15
            const model = mockShipmentModel()
            const req = mockReq({
                params: {
                    shipmentId: shipmentId
                }
            })
            const res = mockRes()
            const next = sinon.spy()
            const contr = new ShipmentController(model)

            contr.shipmentIdMiddleware(req, res, next)
            
            expect(next).to.have.been.called
            expect(req.shipmentId).to.equal(shipmentId)
            expect(res.send).to.not.have.been.called
        })
    })
    describe("#assignedCountMiddleware", () => {
        it("should allow positive numbers in strings", () => {
            let assignedCount = 10
            const model = mockShipmentModel()
            const req = mockReq({
                body: {
                    assigned_count: assignedCount.toString()
                }
            })
            const res = mockRes()
            const next = sinon.spy()
            const contr = new ShipmentController(model)

            contr.assignedCountMiddleware(req, res, next)

            expect(next).to.have.been.calledOnce
            expect(req.assignedCount).to.equal(assignedCount)
            expect(res.send).to.not.have.been.called
        })
        it("should allow negative numbers in strings", () => {
            let assignedCount = -10
            const model = mockShipmentModel()
            const req = mockReq({
                body: {
                    assigned_count: assignedCount.toString()
                }
            })
            const res = mockRes()
            const next = sinon.spy()
            const contr = new ShipmentController(model)

            contr.assignedCountMiddleware(req, res, next)

            expect(next).to.have.been.calledOnce
            expect(req.assignedCount).to.equal(assignedCount)
            expect(res.send).to.not.have.been.called
        })
        it("should allow numbers", () => {
            let assignedCount = 10
            const model = mockShipmentModel()
            const req = mockReq({
                body: {
                    assigned_count: assignedCount
                }
            })
            const res = mockRes()
            const next = sinon.spy()
            const contr = new ShipmentController(model)

            contr.assignedCountMiddleware(req, res, next)

            expect(next).to.have.been.calledOnce
            expect(req.assignedCount).to.equal(assignedCount)
            expect(res.send).to.not.have.been.called
        })
    })
})
