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
})
