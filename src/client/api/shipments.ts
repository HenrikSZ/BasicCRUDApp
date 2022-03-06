
export class ShipmentAPI {
    static createShipment(newValues: any) {
        return fetch("/shipments/shipment/new",
            {
                method: "PUT",
                body: JSON.stringify(newValues),
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }

    static getShipments() {
        return fetch("/shipments")
    }

    static updateShipment(shipmentId: Number, modifications: any) {
        return fetch(`/shipments/shipment/existing/${shipmentId}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(modifications),
            }
        )
    }

    static deleteShipment(shipmentId: number) {
        return fetch(`/shipments/shipment/existing/${shipmentId}`,
            {
                method: "DELETE",
            }
        )
    }

    static deleteShipmentItem(shipmentId: number, itemId: number) {
        return fetch(`/shipments/shipment/existing/${shipmentId}/${itemId}`,
            {
                method: "DELETE"
            }
        )
    }

    static updateShipmentItem(shipmentId: number, itemId: number,
            modifications: any) {
        return fetch(`/shipments/shipment/existing/${shipmentId}/${itemId}`,
            {
                method: "PUT",
                body: JSON.stringify(modifications),
                headers: { "Content-Type": "application/json" }
            }
        )
    }
}
