import { FullTagDescription } from '@reduxjs/toolkit/dist/query/endpointDefinitions'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { DeletedInventoryItem, ICreateItem, InventoryItem, IUpdateItem } from "../types/items"
import { ICreateShipment, IUpdateShipment, IUpdateShipmentItem, Shipment } from '../types/shipments'

export const api = createApi({
    baseQuery: fetchBaseQuery({ baseUrl: "/" }),
    endpoints: builder => ({
        createItem: builder.mutation<InventoryItem, ICreateItem>({
            query: newItem => ({
                url: `items/item/new`,
                method: "POST",
                body: newItem,
            }),
            invalidatesTags: ["Items" as unknown as FullTagDescription<never>],
        }),
        getAllItems: builder.query<InventoryItem[], void>({
            query: () => `items`,
            providesTags: () => ["Items" as unknown as FullTagDescription<never>]
        }),
        getDeletedItems: builder.query<DeletedInventoryItem[], void>({
            query: () => `items/deleted`,
            providesTags: () => ["DeletedItems" as unknown as FullTagDescription<never>]
        }),
        getItemLike: builder.query<InventoryItem[], string>({
            query: name => `items/item/like/${name}`,
        }),
        updateItem: builder.mutation<InventoryItem,
                { item: InventoryItem, modifications: IUpdateItem}>({
            query: info => ({
                url :`items/item/existing/${info.item.id}`,
                method: "PUT",
                body: info.modifications
            }),
            invalidatesTags: ["Items" as unknown as FullTagDescription<never>],
        }),
        deleteItem: builder.mutation<void,
                { item: InventoryItem, deletionComment: string }>({
            query: info => ({
                url :`items/item/existing/${info.item.id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Items" as unknown as FullTagDescription<never>,
                "DeletedItems" as unknown as FullTagDescription<never>],
        }),
        restoreItem: builder.mutation<void, InventoryItem>({
            query: item => ({
                url: `items/item/deleted/${item.id}`,
                method: "PUT"
            }),
            invalidatesTags: ["Items" as unknown as FullTagDescription<never>,
                "DeletedItems" as unknown as FullTagDescription<never>],
        }),

        createShipment: builder.mutation<void, ICreateShipment>({
            query: shipment => ({
                url: 'shipments/shipment/new',
                method: "PUT",
                body: shipment
            }),
            invalidatesTags: ["Shipments" as unknown as FullTagDescription<never>]
        }),
        updateShipment: builder.mutation<void, { shipmentId: number,
                modifications: IUpdateShipment }>({
            query: info => ({
                url: `shipments/shipment/existing/${info.shipmentId}`,
                method: "PUT",
                body: info.modifications
            }),
            invalidatesTags: ["Shipments" as unknown as FullTagDescription<never>]
        }),
        deleteShipment: builder.mutation<void,
                { shipmentId: number }>({
            query: info => ({
                url :`shipments/shipment/existing/${info.shipmentId}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Shipments" as unknown as FullTagDescription<never>,
                "Items" as unknown as FullTagDescription<never>],
        }),

        getAllShipments: builder.query<Shipment[], void>({
            query: () => `shipments`,
            providesTags: () => ["Shipments" as unknown as FullTagDescription<never>]
        }),

        updateShipmentItem: builder.mutation<void, {shipmentId: number,
            itemId: number, modifications: IUpdateShipmentItem}>({
            query: info => ({
                url:`shipments/shipment/existing/${info.shipmentId}/${info.itemId}`,
                method: "PUT",
                body: info.modifications,
            }),
            invalidatesTags: [
                "Shipments" as unknown as FullTagDescription<never>
            ]
        }),

        deleteShipmentItem: builder.mutation<void,
                { shipmentId: number, itemId: number }>({
            query: info => ({
                url :`shipments/shipment/existing/${info.shipmentId}/${info.itemId}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Shipments" as unknown as FullTagDescription<never>,
                "Items" as unknown as FullTagDescription<never>],
        }),
    })
})


export const { useCreateItemMutation,
    useGetAllItemsQuery,
    useGetDeletedItemsQuery,
    useGetItemLikeQuery,
    useUpdateItemMutation,
    useDeleteItemMutation,
    useRestoreItemMutation,
    useGetAllShipmentsQuery,
    useCreateShipmentMutation,
    useUpdateShipmentMutation,
    useDeleteShipmentMutation,
    useUpdateShipmentItemMutation,
    useDeleteShipmentItemMutation } = api
