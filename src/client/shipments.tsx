import React, { ChangeEvent } from "react"

import "./index.css"
// @ts-ignore
import plusIcon from "./icons/plus.svg"
// @ts-ignore
import minusIcon from "./icons/minus.png"

import { ConfirmationButton, DangerButton, RibbonButton } from "./buttons"
import { Section } from "./wrappers"
import { InventoryItemData, MutableInventoryItemData } from "./items"


enum ShipmentViewMode {
    NORMAL,
    CREATE
}

interface MutableShipment {
    name: string,
    destination: string,
    items: { id: number, count: number }[]
}

interface Shipment extends MutableShipment {
    id: number
}


export class ShipmentView extends React.Component {
    state: {
        mode: ShipmentViewMode,
        entries: Shipment[],
    }
    props: {
        onErrorResponse: Function
    }

    constructor(props: { onErrorResponse: Function }) {
        super(props)

        this.state = {
            mode: ShipmentViewMode.NORMAL,
            entries: []
        }
    }

    switchToMode(mode: ShipmentViewMode) {
        let state = {...this.state}
        state.mode = mode

        this.setState(state)
    }

    render() {
        return (
            <div>
                <div className="m-4 mb-6">
                    <RibbonButton 
                            onClick={() => this.switchToMode(ShipmentViewMode.NORMAL)}
                            isActive={this.state.mode == ShipmentViewMode.NORMAL}>
                        Normal
                    </RibbonButton>
                    <RibbonButton 
                            onClick={() => this.switchToMode(ShipmentViewMode.CREATE)}
                            isActive={this.state.mode == ShipmentViewMode.CREATE}>
                        Create
                    </RibbonButton>
                </div>
                {
                    (this.state.mode == ShipmentViewMode.CREATE) ? (
                        <ShipmentCreator
                            onErrorResponse={(response: any) => this.props.onErrorResponse(response)}/>
                    ) : null
                }
            </div>
        )
    }
}


class ShipmentCreator extends React.Component {
    props: { onErrorResponse: Function }
    state: { newValues: MutableShipment }
    currentUiKey: number
    uiKeys: number[]

    constructor(props: { onErrorResponse: Function }) {
        super(props)

        this.state = {
            newValues: {
                name: "",
                destination: "",
                items: []
            }
        }

        this.currentUiKey = -1
        this.uiKeys = []
    }

    render() {
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
                                New Description
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <input className="border-2 rounded-lg border-gray-700"
                                    placeholder="Monday delivery"
                                    onChange={evt => this.state.newValues.name = evt.target.value}/>
                            </td>
                            <td>
                                <input className="border-2 rounded-lg border-gray-700"
                                    placeholder="Paul's Pizza"
                                    onChange={evt =>
                                        this.state.newValues.destination = evt.target.value}/>
                            </td>
                            <td>
                                <ConfirmationButton onClick={() => this.saveNew()}>
                                    Create
                                </ConfirmationButton>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div>
                {
                    this.state.newValues.items.map((item, index) => {
                        return <ShipmentItemPicker
                                    onErrorResponse={(response: any) =>
                                        this.props.onErrorResponse(response)}
                                    onItemSet={(newItem: InventoryItemData) =>
                                        this.setItemType(index, newItem.id)}
                                    onCountSet ={(newCount: number) =>
                                            this.setItemCount(index, newCount)}
                                    item={item}
                                    onRemove={() => this.removeItem(index)}
                                        key={this.uiKeys[index]}/>
                    })
                }
                    <img src={plusIcon} onClick={() => this.addNewItem()} className="w-12 h-12 m-2 cursor-pointer"/>
                </div>
            </Section>
        )
    }

    saveNew() {
        fetch("/shipments/shipment/new",
            {
                method: "PUT",
                body: JSON.stringify(this.state.newValues),
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }

    addNewItem() {
        let state = {...this.state}

        state.newValues.items.push({
            id: 0,
            count: 0
        })
        this.uiKeys.push(this.currentUiKey--)

        this.setState(state)
    }

    setItemType(index: number, itemId: number) {
        let state = {...this.state}
        state.newValues.items[index].id = itemId

        this.setState(state)
    }

    setItemCount(index: number, count: number) {
        let state = {...this.state}
        state.newValues.items[index].count = count

        this.setState(state)
    }

    removeItem(index: number) {
        let state = {...this.state}

        state.newValues.items.splice(index, 1)

        this.setState(state)
    }
}


class ShipmentItemPicker extends React.Component {
    props: { onErrorResponse: Function,
                onItemSet: Function,
                onCountSet: Function,
                onRemove: Function,
                item: { id: number, count: number} }
    item: InventoryItemData
    state: { count: number }

    constructor(props: { onErrorResponse: Function,
            onItemSet: Function,
            onCountSet: Function,
            onRemove: Function,
            item: { id: number, count: number} }) {
        super(props)

        this.state = {
            count: 0
        }
    }

    render() {
        return (
            <div className="flex flex-row space-x-2 p-1">
                <img src={minusIcon} className="w-6 h-6 cursor-pointer" onClick={() => this.props.onRemove()}/>
                <ItemPicker onErrorResponse={(response: any) => this.props.onErrorResponse(response)}
                    onSelect={(item: InventoryItemData) => this.props.onItemSet(item)}/>
                <input className="border-2 rounded-lg border-gray-700 w-32"
                    type="number" placeholder="count" value={this.props.item.count}
                    onChange={(evt: ChangeEvent<HTMLInputElement>) =>
                        this.props.onCountSet(evt.target.value)}/>
            </div>
        )
    }
}


class ItemPicker extends React.Component {
    props: { onErrorResponse: Function, onSelect: Function }
    state: { selectableItems: InventoryItemData[], itemName: string }

    constructor(props: { onErrorResponse: Function, onSelect: Function }) {
        super(props)

        this.state = {
            selectableItems: [],
            itemName: ""
        }
    }

    render() {
        return (
            <div className="inline-block">
                <input className="border-2 rounded-lg border-gray-700 w-48"
                    placeholder="Item name..."
                    value={this.state.itemName}
                    type="text" onChange={(evt: ChangeEvent<HTMLInputElement>) => this.onChange(evt)}/>
                {
                    (this.state.selectableItems.length > 0) ? (
                        <div className="absolute z-10 bg-white border-2 border-gray-700 w-48">
                            {
                                this.state.selectableItems.map(item => {
                                    return (
                                        <SelectableItem item={item} key={item.id}
                                            onSelect={(item: InventoryItemData) => this.onSelect(item)}/>
                                    )
                                })
                            }
                        </div>
                    ) : null
                }
            </div>
        )
    }

    onChange(evt: ChangeEvent<HTMLInputElement>) {
        let state = {...this.state}
        let name = evt.target.value

        state.itemName = name

        if (name.length == 0) {
            state.selectableItems = []

            this.setState(state)

            return
        }

        fetch("/items/item/like/" + name)
        .then(response => {
            if (response.ok)
                return response.json()
            else
                return Promise.reject(response)
            })
        .then(items => {
            state.selectableItems = items

            this.setState(state)
        }, response => {
            this.props.onErrorResponse(response)
        })
    }

    onSelect(item: InventoryItemData) {
        let state = {...this.state}
        state.selectableItems = []
        state.itemName = item.name
        this.setState(state)

        this.props.onSelect(item)
    }
}


class SelectableItem extends React.Component {
    props: { item: InventoryItemData, onSelect: Function }

    render() {
        return  (
            <div className="hover:bg-gray-300 cursor-pointer"
                onClick={() => this.props.onSelect(this.props.item)}>
                {this.props.item.name}
            </div>
        )
    }
}
