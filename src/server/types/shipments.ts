import { MappedInventoryItem } from "./items"


export interface ICreateShipment {
    name: string,
    source: string,
    destination: string,
    items: { id: number, count: number }[]
}
 
export interface Shipment {
    name: string,
    source: string,
    destination: string,
    id: number,
    items?: MappedInventoryItem[]
}

export interface IUpdateShipment {
    name?: string,
    source?: string,
    destination?: string,
}

export interface IUpdateShipmentItem {
    assigned_count?: number
}
