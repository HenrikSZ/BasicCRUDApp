import React, { ChangeEvent } from "react"

import "./index.css"

import { ConfirmationButton, DangerButton, RibbonButton } from "./buttons"
import { Section } from "./wrappers"
import { InventoryItemData, MutableInventoryItemData } from "./inventory"
import { response } from "express"


enum ShipmentViewMode {
    NORMAL,
    CREATE
}

interface MutableShipment {
    name: string,
    destination: string,
    items: InventoryItemData[]
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

    constructor(props: { onErrorResponse: Function }) {
        super(props)

        this.state = {
            newValues: {
                name: "",
                destination: "",
                items: []
            }
        }
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
                                    Add
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
                                onItemSet={(item: InventoryItemData) => this.state.newValues.items[index] = item}
                                key={index}/>
                    })
                }
                </div>
                <ConfirmationButton onClick={() => this.addNewItem()}>
                    Add Item
                </ConfirmationButton>
            </Section>
        )
    }

    saveNew() {

    }

    addNewItem() {
        let state = {...this.state}

        state.newValues.items.push({
            id: 0,
            name: "",
            count: 0
        })

        this.setState(state)
    }
}


class ShipmentItemPicker extends React.Component {
    props: { onErrorResponse: Function, onItemSet: Function }
    item: InventoryItemData

    render() {
        return (
            <div>
                <ItemPicker onErrorResponse={(response: any) => this.props.onErrorResponse(response)}
                    onSelect={(item: InventoryItemData) => this.props.onItemSet(item)}/>
                <input className="border-2 rounded-lg border-gray-700 w-32"
                    type="number" placeholder="count"/>
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

        fetch("/inventory/item/like/" + name)
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
