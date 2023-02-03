import React, { useState } from "react"

import "./index.css"

import { ConfirmationButton,
    DeleteButton,
    EditButton,
    ExportButton,
    ReloadButton,
    RibbonButton,
    BackButton, 
    SaveButton} from "./buttons"
import { Section } from "./wrappers"
import { InventoryItem, DeletedInventoryItem, IUpdateItem, ICreateItem }
    from  "../types/items"
import { useCreateItemMutation, useDeleteItemMutation, useGetAllItemsQuery, useGetDeletedItemsQuery, useRestoreItemMutation, useUpdateItemMutation } from "./items-slice"


enum InventoryMode {
    NORMAL,
    DELETED
}


export enum InventoryItemMode  {
    NORMAL,
    EDIT,
    DELETE
}


export const ItemView = () => {
   const [mode, setMode] = useState(InventoryMode.NORMAL)

    return(
        <div>
            <div className="m-4 mb-6">
                <RibbonButton 
                        onClick={() =>
                            setMode(InventoryMode.NORMAL)}
                        isActive={mode == InventoryMode.NORMAL}>
                    All
                </RibbonButton>
                <RibbonButton 
                        onClick={() =>
                            setMode(InventoryMode.DELETED)}
                        isActive={mode == InventoryMode.DELETED}>
                    Deleted
                </RibbonButton>
            </div>
            {
                (mode == InventoryMode.NORMAL) ? (
                    <ItemCreator/>
                ) : null
            }
            {
                (mode == InventoryMode.NORMAL) ? (
                    <InventoryTable/>
                ) : (
                    <DeletedInventoryTable/>
                )
            }
        </div>
    )
}


const ItemCreator = () => {
    const [createItem, result] = useCreateItemMutation()

    const newValues: ICreateItem = {
        name: "",
        count: 0
    }

    return (
        <Section>
            <span className="text-xl font-bold">Add an Item</span>
            <table>
                <thead>
                    <tr>
                        <th className="text-left">
                            New Name
                        </th>
                        <th className="text-left">
                            New Count
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <input className="border-2 rounded-lg border-gray-700"
                                placeholder="Chairs"
                                onChange={evt => newValues.name = evt.target.value}/>
                        </td>
                        <td>
                            <input className="border-2 rounded-lg border-gray-700"
                                type="number" placeholder="1"
                                onChange={evt =>
                                    newValues.count =
                                    Number.parseInt(evt.target.value)}/>
                        </td>
                        <td>
                            <ConfirmationButton onClick={() =>
                                    createItem(newValues)}>
                                Create
                            </ConfirmationButton>
                        </td>
                    </tr>
                </tbody>
            </table>
        </Section>
    )
}


const InventoryTable = () => {
    const { data } = useGetAllItemsQuery()

    return (
        <React.StrictMode>
            <Section>
                <div className="flex flex-row">
                    <div className="text-xl font-bold">Items</div>
                    <div className="ml-auto pr-1 pl-1">
                        <ExportButton link="/items"/>
                    </div>
                    <div className="pr-1 pl-1">
                        {/*<ReloadButton onClick={dispatch(fetchItems())}/>*/}
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th className="pr-2 pl-2 text-left">Item Name</th>
                            <th className="pr-2 pl-2 text-left">Item Count</th>
                            <th></th>
                            <th>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            data?.map((item) => {
                                return <InventoryItemView data={item} key={item.id}/>
                            })
                        }
                    </tbody>
                </table>
                {
                    (data?.length === 0) ? (
                        <div className="border-t-2 border-gray-500 w-full text-center italic">
                            no entries
                        </div>
                    ) : <></>
                }
            </Section>
        </React.StrictMode>
    )
}


const InventoryItemView = (props: {data: InventoryItem}) => {
    const [mode, setMode] = useState(InventoryItemMode.NORMAL)
    const [updateItem, updateResult] = useUpdateItemMutation()
    const [deleteItem, deleteResult] = useDeleteItemMutation()
    
    const modifications: IUpdateItem = {
        name: props.data.name,
        count_change: 0
    }
    let deletionComment = ""
   

    switch (mode) {
        case InventoryItemMode.EDIT:
            return (
                <tr>
                    <td className="border-2 border-gray-700 p-2">
                        <input className="border-2 rounded-lg border-gray-700 w-48"
                            defaultValue={props.data.name} 
                            onChange={evt => modifications.name = evt.target.value}/>
                    </td>
                    <td className="border-2 border-gray-700 p-2">
                        <input className="border-2 rounded-lg border-gray-700 w-32"
                            type="number" defaultValue={props.data.count} 
                            onChange={evt => modifications.count_change =
                                Number.parseInt(evt.target.value) - props.data.count}/>
                    </td>
                    <td className="border-2 border-gray-700 p-2">
                        <BackButton onClick={() => setMode(InventoryItemMode.NORMAL)}/>
                    </td>
                    <td className="border-2 border-gray-700 p-2">
                        <SaveButton onClick={() => {
                            updateItem({
                                item: props.data,
                                modifications: modifications
                            })
                            setMode(InventoryItemMode.NORMAL)
                        }}/>
                    </td>
                </tr>
            )

        case InventoryItemMode.DELETE:
            return (
                <tr>
                    <td className="border-2 border-gray-700 p-2">
                        Deletion Comment:
                    </td>
                    <td className="border-2 border-gray-700 p-2">
                        <input className="border-2 rounded-lg border-gray-700"
                            onChange={evt => deletionComment = evt.target.value}/>
                    </td>
                    <td className="border-2 border-gray-700 p-2">
                        <BackButton onClick={() => setMode(InventoryItemMode.NORMAL)}/>
                    </td>
                    <td className="border-2 border-gray-700 p-2">
                        <DeleteButton onClick={() => deleteItem({
                            item: props.data,
                            deletionComment: deletionComment
                        })}/>
                    </td>
                </tr>
            )

        case InventoryItemMode.NORMAL:
        default:
            return (
                <tr>
                    <td className="border-2 border-gray-700 p-2">
                        <div className="w-48">
                            {props.data.name}
                        </div>
                    </td>
                    <td className="border-2 border-gray-700 p-2">
                        <div className="w-32">
                            {props.data.count}
                        </div>
                    </td>
                    <td className="border-2 border-gray-700 p-2">
                        <EditButton onClick={() => setMode(InventoryItemMode.EDIT)}/>
                    </td>
                    <td className="border-2 border-gray-700 p-2">
                        <DeleteButton onClick={() => setMode(InventoryItemMode.DELETE)}/>
                    </td>
                </tr>
            )
    }
}


const DeletedInventoryTable = (props: {}) => {
    const { data } = useGetDeletedItemsQuery()

    return (
        <React.StrictMode>
            <Section>
                <div>
                    <div className="flex flex-row">
                        <div className="text-xl font-bold">Deleted Items</div>
                        <div className="ml-auto pr-1 pl-1">
                            <ExportButton link="/items/deleted"/>
                        </div>
                        <div className="pr-1 pl-1">
                            {/*<ReloadButton onClick={() => dispatch(fetchDeletedItems())}/>*/}
                        </div>
                    </div>
                    <table className="table-data-any">
                        <thead>
                            <tr>
                                <th className="pr-2 pl-2 text-left w-48">
                                    Item Name
                                </th>
                                <th className="pr-2 pl-2 text-left w-32">
                                    Item Count
                                </th>
                                <th className="pr-2 pl-2 text-left w-72">
                                    Deletion comment
                                </th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                data?.map((item) => {
                                    return <DeletedInventoryItemView data={item} key={item.id}/>
                                })
                            }
                        </tbody>
                    </table>
                    {
                        (data?.length === 0) ? (
                            <div className="border-t-2 border-gray-500 w-full text-center italic">
                                no entries
                            </div>
                        ) : null
                    }
                </div>
            </Section>
        </React.StrictMode>
    )
}

const DeletedInventoryItemView = (props: { data: DeletedInventoryItem }) => {
    const [restoreItem, result] = useRestoreItemMutation()

    return (
        <tr>
            <td className="border-2 border-gray-700 p-2">
            <div className="w-48">
                    {props.data.name}
                </div>
            </td>
            <td className="border-2 border-gray-700 p-2">
            <div className="w-32">
                    {props.data.count}
                </div>
            </td>
            <td className="border-2 border-gray-700 p-2">
            <div className="w-72">
                    {props.data.comment}
                </div>
            </td>
            <td className="border-2 border-gray-700 p-2">
                <ConfirmationButton onClick={() => restoreItem(props.data)}>
                    Restore
                </ConfirmationButton>
            </td>
        </tr>
    )
/*
    restore() {
        ItemAPI.restoreItem(this.props.data.id)
        .then((response: any) => {
            if (response.ok)
                this.props.onDelete(this.props.data.id)
            else
                this.props.onErrorResponse(response)
        })
    }*/
}
