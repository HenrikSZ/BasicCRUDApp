import { RowDataPacket } from "mysql2"


export interface ICreateItem {
    name: string,
    count: number
}


export interface IUpdateItem {
    name?: string,
    count_change?: number
    deletion_id?: number
}


export interface ILikeItem {
    name: string
}

export interface InventoryItem extends RowDataPacket {
    name: string,
    count: number
    id: number,
    deletion_id: number,
    created_at: Date,
    updated_at: Date
}


export interface MappedInventoryItem extends InventoryItem {
    shipmentId?: number,
    assigned_count: number
}


export interface AssignedInventoryItem {
    id: number;
    count: number;
}

export interface DeletedInventoryItem extends InventoryItem {
    comment: string
}

