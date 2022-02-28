import chai from "chai"
import sinon from "sinon"
import sinon_chai from "sinon-chai"
import mockReq from "../mocks/fastify/request.js"
import mockRes from "../mocks/fastify/reply.js"
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
        it("should create a shipment with the ShipmentModel", async () => {
            const shipment = getShipmentFromClient()
            const model = mockShipmentModel()
            const req = mockReq({
                body: shipment
            })
            const res = mockRes()
            const contr = new ShipmentController(model)

            await contr.createShipment(req, res)
            expect(model.createShipment).to.have.been.calledWith(shipment)
            expect(res.send).to.be.calledOnce
        })
    })
    describe("#getAllShipments", () => {
        it("should send provided shipments from ShipmentModel", async () => {
            const shipments = getShipmentsFromDatabase()
            const model = mockShipmentModel({ allShipments: shipments })
            const req = mockReq()
            const res = mockRes()
            const contr = new ShipmentController(model)

            await contr.getAllShipments(req, res)
            expect(res.send).to.have.been.calledWith(shipments)
        })
    })
    describe("#getShipment", () => {
        it("should send one provided shipment from ShipmentModel", async () => {
            let shipmentId = 10
            const shipment = getShipmentsFromDatabase()[0]
            const model = mockShipmentModel({ shipment: shipment })
            const req = mockReq({ 
                params: {
                    shipment_id: shipmentId
                },
                body: shipment
            })
            const res = mockRes()
            const contr = new ShipmentController(model)

            await contr.getShipment(req, res)
            expect(model.getShipment).to.have.been.calledWith(shipmentId)
            expect(res.send).to.have.been.calledWith(shipment)
        })
        it("should reject with FieldError if shipment does not exist", async () => {
            let shipmentId = 10
            const shipment = getShipmentsFromDatabase()[0]
            const model = mockShipmentModel({ shipment: null })
            const req = mockReq({ 
                params: {
                    shipment_id: shipmentId + 1
                },
                body: shipment
            })
            const res = mockRes()
            const contr = new ShipmentController(model)

            await expect(contr.getShipment(req, res)).to.be
                .rejectedWith("An invalid parameter was passed in for field shipment_id")
            expect(model.getShipment).to.have.been.calledWith(shipmentId + 1)
        })
    })
    describe("#updateShipment", () => {
        it("should update the shipment", async () => {
            let shipmentId = 10
            let shipmentUpdate = {
                name: "Test",
                source: "A",
                destination: "B"
            }

            const model = mockShipmentModel({
                shipment: true
            })
            const req = mockReq({
                params: {
                    shipment_id: shipmentId
                }, 
                body: shipmentUpdate
            })
            const res = mockRes()
            const contr = new ShipmentController(model)

            await contr.updateShipment(req, res)
            expect(model.updateShipment).to.have.been.calledWith(shipmentId, shipmentUpdate)
            expect(res.send).to.have.been.calledOnce
        })
        it("should reject with FieldError if shipment does not exist", async () => {
            let shipmentId = 10
            let shipmentUpdate = {
                name: "Test",
                source: "A",
                destination: "B"
            }

            const model = mockShipmentModel({
                shipment: false
            })
            const req = mockReq({
                params: {
                    shipment_id: shipmentId + 1
                }, 
                body: shipmentUpdate
            })
            const res = mockRes()
            const contr = new ShipmentController(model)

            await expect(contr.updateShipment(req, res)).to.be
                .rejectedWith("An invalid parameter was passed in for field shipment_id")
            expect(model.updateShipment).to.have.been.calledWith(shipmentId + 1, shipmentUpdate)
            expect(res.send).to.not.have.been.called
        })
    })
    describe("#exportShipmentsAsCsv", () => {
        it("should send the csv file of exported shipments", async () => {
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

            await contr.exportShipmentsAsCsv(req, res)
            expect(res.send).to.have.been.calledWith(resolves.shipmentsCsv)
        })  
    })
})
