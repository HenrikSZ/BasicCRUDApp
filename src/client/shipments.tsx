import React, { ChangeEvent } from "react"

import "./index.css"

import { BackButton, ConfirmationButton, DeleteButton, DropdownButton, EditButton, ExportButton, MinusButton, PlusButton, ReloadButton, RibbonButton, SaveButton } from "./buttons"
import { Section } from "./wrappers"
import { InventoryItemData, MutableInventoryItemData } from "./items"
import ReactTooltip from "react-tooltip"


enum ShipmentViewMode {
    NORMAL
}

interface MutableShipmentData {
    name: string,
    source: string,
    destination: string,
    items: { id: number, count: number }[]
}

interface MappedInventoryItemData extends InventoryItemData {
    assigned_count: number
}

interface ShipmentData {
    id: number,
    name: string,
    source: string,
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
                        All
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
                                onShipmentUpdate={(id: number, modifications: any) =>
                                    this.updateLocalShipment(id, modifications)} 
                                onShipmentItemDelete={(shipmentId: number, itemId: number) =>
                                    this.removeLocalShipmentItem(shipmentId, itemId)}
                                onShipmentItemUpdate={(shipmentId: number,
                                        itemId: number, modifications: any) =>
                                    this.updateLocalShipmentItem(shipmentId, itemId, modifications)}
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

    updateLocalShipment(shipmentId: number, modifications: any) {
        let state = {...this.state}
        state.entries = state.entries.map(shipment => {
            if (shipment.id == shipmentId) {
                shipment = {...shipment}
                shipment.name = modifications.name
                shipment.source = modifications.source
                shipment.destination = modifications.destination
            }

            return shipment
        })

        this.setState(state)
    }

    removeLocalShipmentItem(shipmentId: number, itemId: number) {
        let state = {...this.state}
        state.entries = state.entries.map(shipment => {
            if (shipment.id == shipmentId) {
                let ret = {...shipment}
                ret.items = ret.items.filter(item => item.id != itemId)
                
                return ret
            } else {
                return shipment
            }
        })

        this.setState(state)
    }

    updateLocalShipmentItem(shipmentId: number, itemId: number, modifications: any) {
        let state = {...this.state}
        state.entries = state.entries.map(shipment => {
            if (shipment.id == shipmentId) {
                let ret = {...shipment}
                ret.items = ret.items.map(item => {
                    if (item.id == itemId) {
                        item = {...item}
                        item.assigned_count = modifications.assigned_count
                    }
                    
                    return item
                })
                
                return ret
            } else {
                return shipment
            }
        })

        this.setState(state)
    }
}


class ShipmentTable extends React.Component {
    props: { entries: ShipmentData[],
        onReloadRequest: Function,
        onShipmentDelete: Function,
        onShipmentUpdate: Function,
        onShipmentItemDelete: Function,
        onShipmentItemUpdate: Function,
        onErrorResponse: Function
    }

    render() {
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
                                <ReloadButton onClick={() => this.props.onReloadRequest()}/>
                            </div>
                        </div>
                        <div className="mt-4">
                            {
                                this.props.entries.map(shipment =>
                                    <Shipment data={shipment} key={shipment.id}
                                        onDelete={(id: number) => this.props.onShipmentDelete(id)}
                                        onUpdate={(id: number, modifications: any) =>
                                            this.props.onShipmentUpdate(id, modifications)}
                                        onErrorResponse={(response: any) =>
                                            this.props.onErrorResponse(response)}
                                        onItemDelete={(shipmentId: number, itemId: number) =>
                                            this.props.onShipmentItemDelete(shipmentId, itemId)}
                                        onItemUpdate={(shipmentId: number,
                                                itemId: number,
                                                modifications: any) =>
                                            this.props.onShipmentItemUpdate(shipmentId,
                                                itemId, modifications)}/>
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

enum ShipmentHeaderMode {
    NORMAL,
    EDIT
}

class ShipmentHeader extends React.Component {
    props: {
        data: ShipmentData,
        onExpand: Function,
        onRetract: Function,
        onDelete: Function,
        onUpdate: Function,
        onErrorResponse: Function,
    }
    state: {
        mode: ShipmentHeaderMode
    }
    modifications: {
        name?: string,
        source?: string,
        destination?: string
    }

    constructor(props: {
        data: ShipmentData,
        onExpand: Function,
        onRetract: Function,
        onDelete: Function,
        onUpdate: Function,
        onErrorResponse: Function
    }) {
        super(props)

        this.state = {
            mode: ShipmentHeaderMode.NORMAL
        }

        this.modifications = {
            name: this.props.data.name,
            source: this.props.data.source,
            destination: this.props.data.destination
        }
    }

    switchToMode(mode: ShipmentHeaderMode) {
        let state = {...this.state}
        state.mode = mode

        this.setState(state)
    }

    render() {
        switch (this.state.mode) {
            case ShipmentHeaderMode.EDIT:
                return this.editMode()
            default:
                return this.normalMode()
        }
    }

    normalMode() {
        return (
            <div className="flex flex-row">
                <DropdownButton onExpand={() => this.props.onExpand()}
                    onRetract={() => this.props.onRetract()}/>
                <div className="font-bold text-lg p-1">{this.props.data.name}</div>
                <div className="p-1">
                    <i>from</i> {this.props.data.source}
                </div>
                <div className="p-1">
                    <i>to</i> {this.props.data.destination}
                </div>
                <div className="ml-auto">
                    <EditButton onClick={() => this.switchToMode(ShipmentHeaderMode.EDIT)}/>
                </div>
                <div>
                    <DeleteButton onClick={() => this.deleteShipment()}/>
                </div>
            </div>
        )
    }

    editMode() {
        return (
            <div className="flex flex-row">
                <DropdownButton onExpand={() => this.props.onExpand()}
                    onRetract={() => this.props.onRetract()}/>
                <div className="font-bold text-lg pr-1 pl-1">
                    <input className="border-2 rounded-lg border-gray-700 w-16"
                            defaultValue={this.props.data.name} 
                            onChange={evt => this.modifications.name =
                                evt.target.value}/>
                </div>
                <div className="italic flex flex-row space-x-2">
                    <div className="italic mt-1">
                        from
                    </div>
                    <input className="border-2 rounded-lg border-gray-700 w-16"
                            defaultValue={this.props.data.source} 
                            onChange={evt => this.modifications.source =
                                evt.target.value}/>
                    <div className="italic mt-1">
                        to
                    </div>
                    <input className="border-2 rounded-lg border-gray-700 w-16"
                        defaultValue={this.props.data.destination} 
                        onChange={evt => this.modifications.destination =
                            evt.target.value}/>
                </div>
                <div className="ml-auto">
                    <BackButton onClick={() => this.switchToMode(ShipmentHeaderMode.NORMAL)}/>
                </div>
                <div>
                    <SaveButton onClick={() => this.saveEdits()}/>
                </div>
            </div>
        )
    }

    componentDidUpdate() {
        ReactTooltip.hide()
        ReactTooltip.rebuild()
    }

    deleteShipment() {
        fetch(`/shipments/shipment/existing/${this.props.data.id}`,
            {
                method: "DELETE",
            }
        )
        .then((response: any) => {
            if (response.ok)
                this.props.onDelete(this.props.data.id)
            else
                this.props.onErrorResponse(response)
        })
    }

    saveEdits() {
        let modified = this.modifications.source !== this.props.data.source
            || this.modifications.destination !== this.props.data.destination
            || this.modifications.name !== this.props.data.destination

        if (modified) {
            fetch(`/shipments/shipment/existing/${this.props.data.id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(this.modifications),
                }
            )
            .then((response: any) => {
                if (response.ok) {
                    this.switchToMode(ShipmentHeaderMode.NORMAL)
                    this.props.onUpdate(this.modifications)
                } else
                    this.props.onErrorResponse(response)
            })
        } else {
            this.switchToMode(ShipmentHeaderMode.NORMAL)
        }
    }
}

class Shipment extends React.Component {
    props: {    data: ShipmentData,
                onDelete: Function,
                onUpdate: Function,
                onErrorResponse: Function,
                onItemDelete: Function,
                onItemUpdate: Function,
    }
    state: { dropdownCss: string }

    constructor(props: {
                data: ShipmentData,
                onDelete: Function,
                onErrorResponse: Function,
                onItemDelete: Function
            }) {
        super(props)

        this.state = {
            dropdownCss: "hidden"
        }
    }

    render() {
        return (
            <div className="w-96 pb-2 border-t-2 border-gray-700">
                <ShipmentHeader data={this.props.data} onExpand={() => this.onExpand()}
                    onRetract={() => this.onRetract()} onErrorResponse={() =>
                    this.props.onErrorResponse()}
                    onDelete={() => this.props.onDelete()}
                    onUpdate={(modifications: any) =>
                        this.props.onUpdate(this.props.data.id, modifications)}/>
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
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                (this.props.data.items.map(item =>
                                    <ShipmentItem shipmentId={this.props.data.id}
                                        data={item} key={item.id}
                                        onDelete={(itemId: number) =>
                                            this.props.onItemDelete(this.props.data.id, itemId)}
                                        onUpdate={(itemId: number, modifications: any) =>
                                            this.props.onItemUpdate(this.props.data.id, itemId, modifications)}
                                        onErrorResponse={(response: any) =>
                                            this.props.onErrorResponse(response)}/>
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
}


enum ShipmentItemMode {
    NORMAL = 0,
    EDIT = 1
}

class ShipmentItem extends React.Component {
    props: {   
                data: MappedInventoryItemData,
                shipmentId: number,
                onDelete: Function,
                onUpdate: Function,
                onErrorResponse: Function
    }
    state: { mode: ShipmentItemMode }
    modifications: {
        assigned_count?: number
    }

    constructor(props: {
            data: MappedInventoryItemData,
            shipmentId: number,
            onDelete: Function,
            onErrorResponse: Function }) {
        super(props)

        this.state = { 
            mode: ShipmentItemMode.NORMAL
        }

        this.modifications = {
            assigned_count: this.props.data.assigned_count
        }
    }

    render() {
        switch (this.state.mode) {
            case ShipmentItemMode.EDIT:
                return this.editMode()
            default:
                return this.normalMode()
        }
    }

    editMode() {
        return (
            <tr>
                <td className="border-2 border-gray-700 p-2">
                    {this.props.data.name}
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <input className="border-2 rounded-lg border-gray-700 w-32"
                            type="number" defaultValue={this.props.data.assigned_count} 
                            onChange={evt => this.modifications.assigned_count =
                                Number.parseInt(evt.target.value)}/>
                </td>
                <td>
                    <BackButton onClick={() => this.switchToMode(ShipmentItemMode.NORMAL)}/>
                </td>
                <td>
                    <SaveButton onClick={() => this.saveEdits()}/>
                </td>
            </tr>
        )
    }

    normalMode() {
        return (
            <tr>
                <td className="border-2 border-gray-700 p-2">
                    {this.props.data.name}
                </td>
                <td className="border-2 border-gray-700 p-2">
                    {this.props.data.assigned_count}
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <EditButton onClick={() => this.switchToMode(ShipmentItemMode.EDIT)}/>
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <DeleteButton onClick={() => this.deleteShipmentItem()}/>
                </td>
            </tr>
        )
    }

    switchToMode(mode: ShipmentItemMode) {
        let state = {...this.state}
        state.mode = mode

        this.setState(state)
    }

    deleteShipmentItem() {
        fetch(`/shipments/shipment/existing/${this.props.shipmentId}/${this.props.data.id}`,
            {
                method: "DELETE"
            }
        )
        .then((response: any) => {
            if (response.ok)
                this.props.onDelete(this.props.data.id)
            else
                this.props.onErrorResponse(response)
        })
    }

    saveEdits() {
        let modified = this.modifications.assigned_count !== this.props.data.count

        if (modified) {
            fetch(`/shipments/shipment/existing/${this.props.shipmentId}/${this.props.data.id}`,
                {
                    method: "PUT",
                    body: JSON.stringify(this.modifications),
                    headers: { "Content-Type": "application/json" }
                }
            )
            .then((response: any) => {
                if (response.ok) {
                    this.props.onUpdate(this.props.data.id, this.modifications)
                    this.switchToMode(ShipmentItemMode.NORMAL)
                } else {
                    this.props.onErrorResponse(response)
                }
            })
        } else {
            this.switchToMode(ShipmentItemMode.NORMAL)
        }
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
                source: "",
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
                                    onChange={evt => this.state.newValues.name = evt.target.value}/>
                            </td>
                            <td>
                                <input className="border-2 rounded-lg border-gray-700"
                                    placeholder="Paul's Pizza"
                                    onChange={evt =>
                                        this.state.newValues.source = evt.target.value}/>
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
