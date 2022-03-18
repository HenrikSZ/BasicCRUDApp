import { FullTagDescription } from '@reduxjs/toolkit/dist/query/endpointDefinitions'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { DeletedInventoryItem, ICreateItem, InventoryItem, IUpdateItem } from "../types/items"

export const api = createApi({
    baseQuery: fetchBaseQuery({ baseUrl: "/" }),
    endpoints: builder => ({
        createItem: builder.mutation<InventoryItem, ICreateItem>({
            query: () => ({
                url: `items/item/new`,
                method: "POST"
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
        })
    })
})


export const { useCreateItemMutation, useGetAllItemsQuery,
    useGetDeletedItemsQuery, useUpdateItemMutation,
    useDeleteItemMutation,
    useRestoreItemMutation } = api
