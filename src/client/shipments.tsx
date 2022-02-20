import React, { ChangeEvent } from "react"

import "./index.css"

import { ConfirmationButton, DangerButton, DropdownButton, ExportButton, MinusButton, PlusButton, RibbonButton } from "./buttons"
import { Section } from "./wrappers"
import { InventoryItemData, MutableInventoryItemData } from "./items"


enum ShipmentViewMode {
    NORMAL
}

interface MutableShipmentData {
    name: string,
    destination: string,
    items: { id: number, count: number }[]
}

interface MappedInventoryItemData extends InventoryItemData {
    assigned_count: number
}

interface ShipmentData {
    id: number,
    name: string,
    destination: string,
    items: MappedInventoryItemData[]
}


export class ShipmentView extends React.Component {
    state: {
        mode: ShipmentViewMode,
        entries: ShipmentData[],
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
                </div>
                {
                   (this.state.mode == ShipmentViewMode.NORMAL) ? (
                       <div>
                            <ShipmentCreator
                                onItemCreate={() => this.loadEntries()}
                                onErrorResponse={(response: any) =>
                                    this.props.onErrorResponse(response)}/>
                            <ShipmentTable entries={this.state.entries}
                                onReloadRequest={() => this.loadEntries()}
                                onShipmentDelete={(id: number) =>
                                    this.removeLocalShipment(id)}
                                onErrorResponse={(response: any) =>
                                    this.props.onErrorResponse(response)}/>
                        </div>
                    ) : null
                }
            </div>
        )
    }

    componentDidMount() {
        this.loadEntries()
    }

    componentDidUpdate(prevProps: Readonly<{}>,
            prevState: Readonly<{
                mode: ShipmentViewMode,
                entries: InventoryItemData[],
            }>
        ) {
        if (prevState.mode != this.state.mode) {
            switch (this.state.mode) {
                default:
                    this.loadEntries()
            }
        }
    }

    loadEntries() {
        return fetch("/shipments")
        .then((response: any) => {
            if (response.ok)
                return response.json()
            else
                return Promise.reject(response)
        })
        .then(data => {
            let state= {...this.state}
            state.entries = data

            this.setState(state)
        }, error => {
            this.props.onErrorResponse(error)
        })
    }

    removeLocalShipment(id: number) {
        let state = {...this.state}
        state.entries = state.entries.filter(shipment => {
            return shipment.id != id
        })

        this.setState(state)
    }
}


class ShipmentTable extends React.Component {
    props: { entries: ShipmentData[],
        onReloadRequest: Function,
        onShipmentDelete: Function,
        onErrorResponse: Function
    }

    render() {
        return (
            <React.StrictMode>
                <Section>
                    <div>
                        <span className="text-xl font-bold">Shipments</span>
                        <div className="ml-4 float-right">
                            <ConfirmationButton onClick={() =>
                                this.props.onReloadRequest()}>
                                Reload
                            </ConfirmationButton>
                            <ExportButton link="/shipments">
                                Export as CSV
                            </ExportButton>
                        </div>
                        <div className="mt-4">
                            {
                                this.props.entries.map(shipment =>
                                    <Shipment data={shipment} key={shipment.id}
                                        onDelete={(id: number) => this.props.onShipmentDelete(id)}
                                        onErrorResponse={(response: any) =>
                                            this.props.onErrorResponse(response)}/>
                                )
                            }
                            {
                                (this.props.entries.length === 0) ? (
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
}

class Shipment extends React.Component {
    props: { data: ShipmentData, onDelete: Function, onErrorResponse: Function }
    state: { dropdownCss: string }

    constructor(props: { data: ShipmentData }) {
        super(props)

        this.state = {
            dropdownCss: "hidden"
        }
    }

    render() {
        return (
            <div className="w-96 pb-2 border-t-2 border-gray-700">
                <DropdownButton onExpand={() => this.onExpand()}
                    onRetract={() => this.onRetract()}/>
                <span className="font-bold text-lg p-4">{this.props.data.name}</span>
                <span className="italic">to: {this.props.data.destination}</span>
                <div className="inline-block float-right">
                    <DangerButton onClick={() => this.deleteShipment()}>
                        Delete
                    </DangerButton>
                </div>
                <div className={this.state.dropdownCss}>
                    <table>
                        <thead>
                            <tr>
                                <th className="text-left pr-2">
                                    Item Name
                                </th>
                                <th className="text-left pr-2">
                                    Count
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                (this.props.data.items.map(item =>
                                    <ShipmentItem data={item} key={item.id}/>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    onExpand() {
        let state = {...this.state}
        state.dropdownCss = "block"

        this.setState(state)
    }

    onRetract() {
        let state = {...this.state}
        state.dropdownCss = "hidden"

        this.setState(state)
    }

    deleteShipment() {
        fetch(`/shipments/shipment/existing/${this.props.data.id}`,
            {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            }
        )
        .then((response: any) => {
            if (response.ok)
                this.props.onDelete(this.props.data.id)
            else
                this.props.onErrorResponse(response)
        })
    }
}


class ShipmentItem extends React.Component {
    props: { data: MappedInventoryItemData }

    constructor(props: { data: InventoryItemData }) {
        super(props)
    }

    render() {
        return (
            <tr>
                <td className="border-2 border-gray-700 p-2">
                    {this.props.data.name}
                </td>
                <td className="border-2 border-gray-700 p-2">
                    {this.props.data.assigned_count}
                </td>
            </tr>
        )
    }
}


class ShipmentCreator extends React.Component {
    props: { onErrorResponse: Function, onItemCreate: Function }
    state: { newValues: MutableShipmentData }
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
                                New Destination
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
                <table>
                    <thead>
                        {
                            (this.state.newValues.items.length > 0) ? (
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
                        <tr>
                            <td>
                            <PlusButton onClick={() => this.addNewItem()}/>
                            </td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
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
        .then(response => {
            if (response.ok) {
                this.props.onItemCreate()
            } else {
                return Promise.reject(response)
            }
        })
        .catch(error => {
            this.props.onErrorResponse(error)
        })
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
            <tr>
                <td>
                    <MinusButton onClick={() => this.props.onRemove()}/>
                </td>
                <td className="pt-1 pb-1">
                    <ItemPicker onErrorResponse={(response: any) => this.props.onErrorResponse(response)}
                        onSelect={(item: InventoryItemData) => this.props.onItemSet(item)}/>
                 </td>
                <td className="inline-block pt-1 pb-1">
                        <input className="border-2 rounded-lg border-gray-700 w-32"
                            type="number" placeholder="count" value={this.props.item.count}
                            onChange={(evt: ChangeEvent<HTMLInputElement>) =>
                                this.props.onCountSet(evt.target.value)}/>
                </td>
            </tr>
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
