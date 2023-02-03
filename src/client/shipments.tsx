import React, { ChangeEvent, useState } from "react"

import "./index.css"

import { BackButton, ConfirmationButton, DeleteButton, DropdownButton,
    EditButton, ExportButton, MinusButton, PlusButton, RibbonButton,
    SaveButton } from "./buttons"
import { Section } from "./wrappers"
import { AssignedInventoryItem, InventoryItem, MappedInventoryItem }
    from "../server/types/items"
import { IUpdateShipment, IUpdateShipmentItem, Shipment }
    from "../server/types/shipments"
import { useCreateShipmentMutation, useDeleteShipmentItemMutation,
    useDeleteShipmentMutation, useGetAllShipmentsQuery, useGetItemLikeQuery,
    useUpdateShipmentItemMutation, useUpdateShipmentMutation }
    from "./items-slice"


enum ShipmentViewMode {
    NORMAL
}


export function ShipmentView() {
    const [mode, setMode] = useState(ShipmentViewMode.NORMAL)

    return (
        <div>
            <div className="m-4 mb-6">
                <RibbonButton 
                        onClick={() => setMode(ShipmentViewMode.NORMAL)}
                        isActive={mode == ShipmentViewMode.NORMAL}>
                    All
                </RibbonButton>
            </div>
            {
                (mode == ShipmentViewMode.NORMAL) ? (
                    <div>
                        <ShipmentCreator/>
                        <ShipmentTable/>
                    </div>
                ) : null
            }
        </div>
    )
}


function ShipmentTable() {
    const { data } = useGetAllShipmentsQuery()

    return (
        <React.StrictMode>
            <Section>
                <div>
                    <div className="flex flex-row">
                        <div className="text-xl font-bold">Shipments</div>
                        <div className="ml-auto pl-1 pr-1">
                            <ExportButton link="/shipments"/>
                        </div>
                        <div className="pr-1 pl-1">
                           {// <ReloadButton onClick={() => props.onReloadRequest()}/>
                           }
                        </div>
                    </div>
                    <div className="mt-4">
                        {
                            data?.map(shipment =>
                                <SingleShipmentView data={shipment} key={shipment.id}/>
                            )
                        }
                        {
                            (data?.length === 0) ? (
                                <div className="mt-4 border-t-2 
                                    border-gray-500 w-full text-center italic">
                                    no entries
                                </div>
                            ) : null
                        }
                    </div>
                </div>
            </Section>
        </React.StrictMode>
    )
}

enum ShipmentHeaderMode {
    NORMAL,
    EDIT
}

function ShipmentHeader(props: {data: Shipment, onExpand: Function, onRetract: Function}) {
    const [mode, setMode] = useState(ShipmentHeaderMode.NORMAL)
    const [deleteShipment, deleteShipmentResult]
        = useDeleteShipmentMutation()
    const [updateShipment, updateShipmentItem]
        = useUpdateShipmentMutation()

    const modifications: IUpdateShipment = {
        name: props.data.name,
        source: props.data.source,
        destination: props.data.destination
    }

    switch (mode) {
        case ShipmentHeaderMode.EDIT:
            return (
                <div className="flex flex-row">
                    <DropdownButton onExpand={() => props.onExpand()}
                        onRetract={() => props.onRetract()}/>
                    <div className="font-bold text-lg pr-1 pl-1">
                        <input className="border-2 rounded-lg border-gray-700 w-16"
                                defaultValue={props.data.name} 
                                onChange={evt => modifications.name =
                                    evt.target.value}/>
                    </div>
                    <div className="italic flex flex-row space-x-2">
                        <div className="italic mt-1">
                            from
                        </div>
                        <input className="border-2 rounded-lg border-gray-700 w-16"
                                defaultValue={props.data.source} 
                                onChange={evt => modifications.source =
                                    evt.target.value}/>
                        <div className="italic mt-1">
                            to
                        </div>
                        <input className="border-2 rounded-lg border-gray-700 w-16"
                            defaultValue={props.data.destination} 
                            onChange={evt => modifications.destination =
                                evt.target.value}/>
                    </div>
                    <div className="ml-auto">
                        <BackButton onClick={() => setMode(ShipmentHeaderMode.NORMAL)}/>
                    </div>
                    <div>
                        <SaveButton onClick={() => updateShipment({
                            shipmentId: props.data.id,
                            modifications: modifications })}/>
                    </div>
                </div>
            )
        default:
            return (
                <div className="flex flex-row">
                    <DropdownButton onExpand={() => props.onExpand()}
                        onRetract={() => props.onRetract()}/>
                    <div className="font-bold text-lg p-1">{props.data.name}</div>
                    <div className="p-1">
                        <i>from</i> {props.data.source}
                    </div>
                    <div className="p-1">
                        <i>to</i> {props.data.destination}
                    </div>
                    <div className="ml-auto">
                        <EditButton onClick={() => setMode(ShipmentHeaderMode.EDIT)}/>
                    </div>
                    <div>
                        <DeleteButton onClick={() => deleteShipment({ shipmentId: props.data.id })}/>
                    </div>
                </div>
            )
    }
}

function SingleShipmentView(props: {data: Shipment}) {
    const [dropdownCss, setDropDownCss] = useState("hidden")

    return (
        <div className="w-96 pb-2 border-t-2 border-gray-700">
            <ShipmentHeader data={props.data} onExpand={() => setDropDownCss("block")}
                onRetract={() => setDropDownCss("hidden")}/>
            <div className={dropdownCss}>
                <table>
                    <thead>
                        <tr>
                            <th className="text-left pr-2">
                                Item Name
                            </th>
                            <th className="text-left pr-2">
                                Count
                            </th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            (props.data.items?.map(item =>
                                <ShipmentItemView shipmentId={props.data.id}
                                    data={item} key={item.id}/>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    )
}


enum ShipmentItemMode {
    NORMAL = 0,
    EDIT = 1
}

function ShipmentItemView(props: {data: MappedInventoryItem, shipmentId: number}) {
    const [mode, setMode] = useState(ShipmentItemMode.NORMAL)
    const [updateShipmentItem, updateShipmentItemResult]
        = useUpdateShipmentItemMutation()
    const [deleteShipmentItem, deleteShipmentItemResult]
        = useDeleteShipmentItemMutation()
    
    let modifications: IUpdateShipmentItem = {
        assigned_count: props.data.assigned_count
    }

    switch (mode) {
        case ShipmentItemMode.EDIT:
            return (
                <tr>
                    <td className="border-2 border-gray-700 p-2">
                        {props.data.name}
                    </td>
                    <td className="border-2 border-gray-700 p-2">
                        <input className="border-2 rounded-lg border-gray-700 w-32"
                                type="number" defaultValue={props.data.assigned_count} 
                                onChange={evt => modifications.assigned_count =
                                    Number.parseInt(evt.target.value)}/>
                    </td>
                    <td>
                        <BackButton onClick={() => setMode(ShipmentItemMode.NORMAL)}/>
                    </td>
                    <td>
                        <SaveButton onClick={() => {
                            updateShipmentItem({
                                modifications: modifications,
                                shipmentId: props.shipmentId,
                                itemId: props.data.id
                            })
                            setMode(ShipmentItemMode.NORMAL)
                        }}/>
                    </td>
                </tr>
            )
        default:
            return (
                <tr>
                    <td className="border-2 border-gray-700 p-2">
                        {props.data.name}
                    </td>
                    <td className="border-2 border-gray-700 p-2">
                        {props.data.assigned_count}
                    </td>
                    <td className="border-2 border-gray-700 p-2">
                        <EditButton onClick={() => setMode(ShipmentItemMode.EDIT)}/>
                    </td>
                    <td className="border-2 border-gray-700 p-2">
                        <DeleteButton onClick={() => deleteShipmentItem({
                            shipmentId: props.shipmentId,
                            itemId: props.data.id
                        })}/>
                    </td>
                </tr>
            )
    }
}


function ShipmentCreator() {
    const [createShipment, result] = useCreateShipmentMutation()
    const [currentUiKey, setCurrentUiKey] = useState(-1)
    const [uiKeys, setUiKeys] = useState<number[]>([])
    const [newName, setNewName] = useState("")
    const [newSource, setNewSource] = useState("")
    const [newDestination, setNewDestination] = useState("")
    const [newItems, setNewItems] = useState<{ id: number, count: number }[]>([])

    return (
        <Section>
            <span className="text-xl font-bold">Create a Shipment</span>
            <table>
                <thead>
                    <tr>
                        <th className="text-left">
                            New Name
                        </th>
                        <th className="text-left">
                            New Source
                        </th>
                        <th className="text-left">
                            New Destination
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <input className="border-2 rounded-lg border-gray-700"
                                placeholder="Monday delivery"
                                onChange={evt => setNewName(evt.target.value)}/>
                        </td>
                        <td>
                            <input className="border-2 rounded-lg border-gray-700"
                                placeholder="Paul's Pizza"
                                onChange={evt => setNewSource(evt.target.value)}/>
                        </td>
                        <td>
                            <input className="border-2 rounded-lg border-gray-700"
                                placeholder="Paul's Pizza"
                                onChange={evt => setNewDestination(evt.target.value)}/>
                        </td>
                        <td>
                            <ConfirmationButton onClick={() => createShipment({
                                    name: newName,
                                    source: newSource,
                                    destination: newDestination,
                                    items: newItems,
                                })}>
                                Create
                            </ConfirmationButton>
                        </td>
                    </tr>
                </tbody>
            </table>
            <table>
                <thead>
                    {
                        (newItems.length > 0) ? (
                            <tr>
                            <th></th>
                            <th className="pr-2 pl-2 text-left">
                                Item Name
                            </th>
                            <th className="pr-2 pl-2 text-left">
                                Item Count
                            </th>
                        </tr>
                        ) : null
                    }
                </thead>
                <tbody>
                    {
                        newItems.map((item: AssignedInventoryItem, index: number) => {
                            return <ShipmentItemPicker key={uiKeys[index]}
                                        item={item} onRemove={() => {
                                let modifiedNewitems = newItems.slice()
                                modifiedNewitems.splice(index)

                                setNewItems(modifiedNewitems)
                            }}
                            onItemSet={(selectedItem: AssignedInventoryItem) => {
                                let modifiedNewItems = newItems.slice()

                                let item = {...modifiedNewItems[index]}
                                item.id = selectedItem.id
                                modifiedNewItems[index] = item

                                setNewItems(modifiedNewItems)
                            }}
                            onCountSet={(count: number) => {
                                let modifiedNewitems = newItems.slice()

                                let item = {...modifiedNewitems[index]}
                                item.count = count
                                modifiedNewitems[index] = item

                                setNewItems(modifiedNewitems)
                            }}/>
                        })
                    }
                    <tr>
                        <td>
                        <PlusButton onClick={() => {
                            let modifiedNewItems = newItems.slice()
                            modifiedNewItems.push({
                                id: 0,
                                count: 0
                            })

                            let newUiKeys = uiKeys.slice()
                            newUiKeys.push(currentUiKey)

                            setNewItems(modifiedNewItems)
                            setUiKeys(newUiKeys)
                            setCurrentUiKey(currentUiKey - 1)
                        }}/>
                        </td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </Section>
    )
}


const ShipmentItemPicker = (props:
    { item: AssignedInventoryItem, onRemove: Function, onItemSet: Function, onCountSet: Function }) => {
    return (
        <tr>
            <td>
                <MinusButton onClick={() => props.onRemove()}/>
            </td>
            <td className="pt-1 pb-1">
                <ItemPicker
                    onSelect={(item: AssignedInventoryItem) => props.onItemSet(item)}/>
                </td>
            <td className="inline-block pt-1 pb-1">
                <input className="border-2 rounded-lg border-gray-700 w-32"
                    type="number" placeholder="count" value={props.item.count}
                    onChange={(evt: ChangeEvent<HTMLInputElement>) =>
                        props.onCountSet(evt.target.value)}/>
            </td>
        </tr>
    )
}


const ItemPicker = (props: { onSelect: Function }) => {
    const [itemName, setItemName] = useState("")
    const selectableItems = useGetItemLikeQuery(itemName)
    const [visible, setVisible] = useState(true)

    return (
        <div className="inline-block" onFocus={() => setVisible(true)}>
            <input className="border-2 rounded-lg border-gray-700 w-48"
                placeholder="Item name..."
                value={itemName}
                type="text" onChange={(evt: ChangeEvent<HTMLInputElement>) => {
                    setItemName(evt.target.value)
                }}/>
            {
                (visible && (selectableItems?.data?.length ?? 0) > 0) ? (
                    <div className="absolute z-10 bg-white border-2 border-gray-700 w-48">
                        {
                            selectableItems?.data?.map(item => {
                                return (
                                    <SelectableItem item={item} key={item.id}
                                        onSelect={(item: InventoryItem) => {
                                            props.onSelect(item)
                                            setItemName(item.name)
                                            setVisible(false)
                                    }}/>
                                )
                            })
                        }
                    </div>
                ) : null
            }
        </div>
    )
}


const SelectableItem = (props: {item: InventoryItem, onSelect: Function }) => {
    return  (
        <div className="hover:bg-gray-300 cursor-pointer"
            onClick={() => props.onSelect(props.item)}>
            {props.item.name}
        </div>
    )
}
