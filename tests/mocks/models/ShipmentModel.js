import sinon from "sinon"


export default function mock(resolves = {}, rejects = {}) {
    return {
        getAllShipments: rejects.allShipments ?
            sinon.mock().rejects(rejects.allShipments)
            : sinon.mock().resolves(resolves.allShipments),
        createShipment: rejects.shipment ?
            sinon.mock().rejects(rejects.shipment)
            : sinon.mock().resolves(),
        getShipment: rejects.shipment ?
            sinon.mock().rejects(rejects.shipment)
            : sinon.mock().resolves(resolves.shipment)
    }
}
