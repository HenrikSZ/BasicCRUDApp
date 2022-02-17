import React from "react"

import "./index.css"

import { ConfirmationButton, DangerButton, ExportButton, RibbonButton } from "./buttons"
import { Section } from "./wrappers"


enum InventoryMode {
    NORMAL,
    DELETED
}


export enum InventoryItemMode  {
    NORMAL,
    EDIT,
    DELETE
}

export interface MutableInventoryItemData {
    name: string,
    count: number
}

interface ChangeInventoryItemData {
    name: string,
    count_change: number
}

export interface InventoryItemData extends MutableInventoryItemData {
    id: number
}

export interface DeletedInventoryItemData extends InventoryItemData {
    comment: string
}


export class ItemView extends React.Component {
    state: {
        mode: InventoryMode,
        entries: Array<InventoryItemData>,
        deletedEntries: Array<DeletedInventoryItemData>
    }
    props: {
        onErrorResponse: Function
    }

    constructor(props: { onErrorResponse: Function }) {
        super(props)

        this.state = {
            mode: InventoryMode.NORMAL,
            entries: [],
            deletedEntries: []
        }
    }

    render() {
        return(
            <div>
                <div className="m-4 mb-6">
                    <RibbonButton 
                            onClick={() =>
                                this.switchToMode(InventoryMode.NORMAL)}
                            isActive={this.state.mode == InventoryMode.NORMAL}>
                        Normal
                    </RibbonButton>
                    <RibbonButton 
                            onClick={() =>
                                this.switchToMode(InventoryMode.DELETED)}
                            isActive={this.state.mode == InventoryMode.DELETED}>
                        Deleted
                    </RibbonButton>
                </div>
                {
                    (this.state.mode == InventoryMode.NORMAL) ? (
                        <ItemCreator onItemCreation={() =>
                            this.loadEntries()}
                            onErrorResponse={(response: any) =>
                                this.props.onErrorResponse(response)}/>
                    ) : null
                }
                {
                    (this.state.mode == InventoryMode.NORMAL) ? (
                        <InventoryTable entries={this.state.entries}
                            onItemDelete={(id: number) =>
                                this.removeLocalEntry(id)}
                            onReloadRequest={() =>
                                this.loadEntries()}
                            onErrorResponse={(response: any) =>
                                this.props.onErrorResponse(response)}/>
                    ) : (
                        <DeletedInventoryTable entries={this.state.deletedEntries}
                            onReloadRequest={() =>
                                this.loadDeletedEntries()}
                            onItemRestore={(id: number) =>
                                this.removeLocalDeletedEntry(id)}
                            onErrorResponse={(response: any) =>
                                this.props.onErrorResponse(response)}/>
                    )
                }
            </div>
        )
    }

    switchToMode(mode: InventoryMode) {
        let state = {...this.state}
        state.mode = mode

        this.setState(state)
    }

    componentDidMount() {
        this.loadEntries()
        .then(() => {
             return this.loadDeletedEntries()
        })
    }

    componentDidUpdate(prevProps: Readonly<{}>,
            prevState: Readonly<{
                mode: InventoryMode,
                entries: InventoryItemData[],
                deletedEntries: DeletedInventoryItemData[]
            }>
        ) {
        if (prevState.mode != this.state.mode) {
            switch (this.state.mode) {
                case InventoryMode.DELETED:
                    this.loadDeletedEntries()
                    break
                default:
                    this.loadEntries()
            }
        }
    }

    loadDeletedEntries() {
        return fetch("/items/deleted")
        .then((response) => {
            if (response.ok)
                return response.json()
            else
                return Promise.reject(response)
        })
        .then(data =>{
            let state = {...this.state}
            state.deletedEntries = data

            this.setState(state)
        }, error => {
            this.props.onErrorResponse(error)
        })
    }

    loadEntries() {
        return fetch("/items")
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

    removeLocalEntry(id: number) {
        let state = {...this.state}
        state.entries = state.entries.filter((item) => {
            return item.id != id
        })

        this.setState(state)
    }

    removeLocalDeletedEntry(id: number) {
        let state = {...this.state}
        state.deletedEntries = state.deletedEntries.filter((item) => {
            return item.id != id
        })

        this.setState(state)
    }
}


export class ItemCreator extends React.Component {
    newValues: MutableInventoryItemData
    props: {onItemCreation: Function, onErrorResponse: Function}

    constructor(props: {onItemCreation: Function, onError: Function}) {
        super(props)

        this.newValues = {
            name: "",
            count: 0
        }
    }

    render() {
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
                                    onChange={evt => this.newValues.name = evt.target.value}/>
                            </td>
                            <td>
                                <input className="border-2 rounded-lg border-gray-700"
                                    type="number" placeholder="1"
                                    onChange={evt =>
                                        this.newValues.count = Number.parseInt(evt.target.value)}/>
                            </td>
                            <td>
                                <ConfirmationButton onClick={() => this.saveNew()}>
                                    Add
                                </ConfirmationButton>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </Section>
        )
    }

    saveNew() {
        if (this.newValues.name && this.newValues.count) {
            fetch("/items/item/new",
                { 
                    method: "POST",
                    body: JSON.stringify(this.newValues),
                    headers: { 'Content-Type': 'application/json' }
                }
            )
            .then((response: any) => {
                if (response.ok)
                    this.props.onItemCreation()
                else
                    this.props.onErrorResponse(response)
            })
        }
    }
}


export class InventoryTable extends React.Component {
    props: {
        entries: Array<InventoryItemData>,
        onReloadRequest: Function,
        onItemDelete: Function,
        onErrorResponse: Function
    }

    render() {
        return (
            <React.StrictMode>
                <Section>
                    <span className="text-xl font-bold">Items</span>
                    <div className="ml-4 float-right">
                        <ConfirmationButton onClick={() => this.props.onReloadRequest()}>
                            Reload
                        </ConfirmationButton>
                        <ExportButton link="/items">
                            Export as CSV
                        </ExportButton>
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
                                this.props.entries.map((item) => {
                                    return <InventoryItem data={item} key={item.id}
                                        onDelete={(id: number) => this.props.onItemDelete(id)}
                                        onErrorResponse={(response: any) => this.props.onErrorResponse(response)}/>
                                })
                            }
                        </tbody>
                    </table>
                    {
                        (this.props.entries.length === 0) ? (
                            <div className="border-t-2 border-gray-500 w-full text-center italic">
                                no entries
                            </div>
                        ) : null
                    }
                </Section>
            </React.StrictMode>
        )
    }
}


export class InventoryItem extends React.Component {
    modifications: ChangeInventoryItemData
    deletion_comment: string
    state: { mode: InventoryItemMode, data: InventoryItemData }
    props:  { data: InventoryItemData, onDelete: Function, onErrorResponse: Function }


    constructor(props:  { data: InventoryItemData, onDelete: Function, onErrorResponse: Function }) {
        super(props)

        this.state = {
            mode: InventoryItemMode.NORMAL,
            data: props.data,
        }

        this.modifications = {
            name: props.data.name,
            count_change: 0
        }
        this.deletion_comment = ""
    }

    render() {
        switch (this.state.mode) {
            case InventoryItemMode.EDIT:
                return this.editMode()
            case InventoryItemMode.DELETE:
                return this.deleteMode()
            default:
                return this.normalMode()
        }
    }

    normalMode() {
        return (
            <tr>
                <td className="border-2 border-gray-700 p-2">
                    <div className="w-48">
                        {this.state.data.name}
                    </div>
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <div className="w-32">
                        {this.state.data.count}
                    </div>
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <ConfirmationButton onClick={() => this.switchToMode(InventoryItemMode.EDIT)}>
                        Edit
                    </ConfirmationButton>
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <DangerButton onClick={() => this.switchToMode(InventoryItemMode.DELETE)}>
                        Delete
                    </DangerButton>
                </td>
            </tr>
        )
    }

    editMode() {
        return (
            <tr>
                <td className="border-2 border-gray-700 p-2">
                    <input className="border-2 rounded-lg border-gray-700 w-48"
                        defaultValue={this.state.data.name} 
                        onChange={evt => this.modifications.name = evt.target.value}/>
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <input className="border-2 rounded-lg border-gray-700 w-32"
                        type="number" defaultValue={this.state.data.count} 
                        onChange={evt => this.modifications.count_change =
                            Number.parseInt(evt.target.value) - this.state.data.count}/>
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <ConfirmationButton onClick={() => this.saveEdits()}>
                        Save
                    </ConfirmationButton>
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <DangerButton onClick={() => this.switchToMode(InventoryItemMode.NORMAL)}>
                        Discard
                    </DangerButton>
                </td>
            </tr>
        )
    }

    deleteMode() {
        return (
            <tr>
                <td className="border-2 border-gray-700 p-2">
                    Deletion Comment:
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <input className="border-2 rounded-lg border-gray-700"
                        onChange={evt => this.deletion_comment = evt.target.value}/>
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <ConfirmationButton onClick={() => this.deleteItem()}>
                        Delete
                    </ConfirmationButton>
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <DangerButton onClick={() => this.switchToMode(InventoryItemMode.NORMAL)}>
                       Discard
                    </DangerButton>
                </td>
            </tr>
        )
    }

    switchToMode(mode: InventoryItemMode) {
        let state = {...this.state}
        state.mode = mode
        
        this.setState(state)
    }

    saveEdits() {
        let modified = false

        if (this.modifications.name !== this.state.data.name
            || this.modifications.count_change !== 0) {
            modified = true
        }

        if (modified) {
            fetch(`/items/item/existing/${this.state.data.id}`,
                { 
                    method: "PUT",
                    body: JSON.stringify(this.modifications),
                    headers: { 'Content-Type': 'application/json' }
                }
            )
            .then((response: any) => {
                if (response.ok) {
                    let state = {...this.state}
                    state.mode = InventoryItemMode.NORMAL
                    state.data.name = this.modifications.name
                    state.data.count += this.modifications.count_change

                    this.setState(state)
                } else {
                    this.props.onErrorResponse(response)
                }
            })
        } else {
            this.switchToMode(InventoryItemMode.NORMAL)
        }
    }

    deleteItem() {
        fetch(`/items/item/existing/${this.state.data.id}`,
            {
                method: "DELETE",
                body: JSON.stringify({ comment: this.deletion_comment }),
                headers: { "Content-Type": "application/json" }
            }
        )
        .then((response: any) => {
            if (response.ok)
                this.props.onDelete(this.state.data.id)
            else
                this.props.onErrorResponse(response)
        })
    }
}


export class DeletedInventoryTable extends React.Component {
    props: {
        entries: Array<DeletedInventoryItemData>,
        onReloadRequest: Function,
        onItemRestore: Function,
        onErrorResponse: Function
    }

    constructor(props: {
        entries: Array<DeletedInventoryItemData>,
        onReloadRequest: Function,
        onItemRestore: Function,
        onErrorResponse: Function
    }) {
        super(props)
    }

    render() {
        return (
            <React.StrictMode>
                <Section>
                    <div>
                        <span className="text-xl font-bold">Deleted Items</span>
                        <div className="ml-4 float-right">
                            <ConfirmationButton onClick={() => this.props.onReloadRequest()}>
                                Reload
                            </ConfirmationButton>
                            <ExportButton link="/items/deleted">
                                Export as CSV
                            </ExportButton>
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
                                    this.props.entries.map((item) => {
                                        return <DeletedInventoryItem data={item} key={item.id}
                                            onDelete={(id: number) => this.props.onItemRestore(id)}
                                            onErrorResponse={(response: any) => this.props.onErrorResponse(response)}/>
                                    })
                                }
                            </tbody>
                        </table>
                        {
                            (this.props.entries.length === 0) ? (
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
}

class DeletedInventoryItem extends React.Component {
    props: {data: DeletedInventoryItemData, onDelete: Function, onErrorResponse: Function}

    render() {
        return (
            <tr>
                <td className="border-2 border-gray-700 p-2">
                <div className="w-48">
                        {this.props.data.name}
                    </div>
                </td>
                <td className="border-2 border-gray-700 p-2">
                <div className="w-32">
                        {this.props.data.count}
                    </div>
                </td>
                <td className="border-2 border-gray-700 p-2">
                <div className="w-72">
                        {this.props.data.comment}
                    </div>
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <ConfirmationButton onClick={() => this.restore()}>
                        Restore
                    </ConfirmationButton>
                </td>
            </tr>
        )
    }

    restore() {
        fetch(`/items/item/existing/${this.props.data.id}`,
            {
                method: "PUT"
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
