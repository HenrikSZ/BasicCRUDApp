import React from "react"

import "./index.css"

import { ConfirmationButton, DangerButton, RibbonButton } from "./buttons"
import { Section } from "./wrappers"
import { InventoryItemData, MutableInventoryItemData } from "./inventory"


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
                        return <ShipmentItemPicker itemData={item} key={index}/>
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
    props: { itemData: MutableInventoryItemData }

    render() {
        return <div>Item</div>
    }
}
