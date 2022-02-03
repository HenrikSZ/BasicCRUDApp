import React from "react"

import "./index.css"

import { ConfirmationButton, RibbonButton } from "./buttons"


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

export interface InventoryItemData extends MutableInventoryItemData {
    id: number
}

export interface DeletedInventoryItemData extends InventoryItemData {
    comment: string
}


export class Inventory extends React.Component {
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
                <div className="mb-2">
                    <RibbonButton 
                        label="Normal"
                        onClick={() => this.switchToMode(InventoryMode.NORMAL)}
                        isActive={this.state.mode == InventoryMode.NORMAL}/>
                    <RibbonButton 
                        label="Deleted"
                        onClick={() => this.switchToMode(InventoryMode.DELETED)}
                        isActive={this.state.mode == InventoryMode.DELETED}/>
                </div>
                {
                    (this.state.mode == InventoryMode.NORMAL) ? (
                        <ItemCreator onItemCreation={() => this.loadEntries()}
                            onErrorResponse={(response: any) => this.props.onErrorResponse(response)}/>
                    ) : null
                }
                {
                    (this.state.mode == InventoryMode.NORMAL) ? (
                        <InventoryTable entries={this.state.entries}
                            onItemDelete={(id: number) => this.removeLocalEntry(id)}
                            onReloadRequest={() => this.loadEntries()}
                            onErrorResponse={(response: any) => this.props.onErrorResponse(response)}/>
                    ) : (
                        <DeletedInventoryTable entries={this.state.deletedEntries}
                            onReloadRequest={() => this.loadDeletedEntries()}
                            onItemRestore={(id: number) => this.removeLocalDeletedEntry(id)}
                            onErrorResponse={(response: any) => this.props.onErrorResponse(response)}/>
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
        entries: Array<InventoryItemData>,
        deletedEntries: Array<DeletedInventoryItemData>
    }>) {
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
        return fetch("/inventory/deleted")
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
        return fetch("/inventory")
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
                            <ConfirmationButton label="Add" onClick={() => this.saveNew()}/>
                        </td>
                    </tr>
                </tbody>
            </table>
        )
    }

    saveNew() {
        if (this.newValues.name && this.newValues.count) {
            fetch("/inventory/item/new",
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
            <table className="table-data-any">
                <thead>
                    <tr>
                        <th className="pr-2 pl-2 text-left">Item Name</th>
                        <th className="pr-2 pl-2 text-left">Item Count</th>
                        <th></th>
                        <th>
                            <ConfirmationButton label="Reload" onClick={() => this.props.onReloadRequest()}/>
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
            </React.StrictMode>
        )
    }
}


export class InventoryItem extends React.Component {
    modifications: MutableInventoryItemData
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
            name: "",
            count: 0
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
                    {this.state.data.name}
                </td>
                <td className="border-2 border-gray-700 p-2">
                    {this.state.data.count}
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <button onClick={() => this.switchToMode(InventoryItemMode.EDIT)}>edit</button>
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <button onClick={() => this.switchToMode(InventoryItemMode.DELETE)}>delete</button>
                </td>
            </tr>
        )
    }

    editMode() {
        return (
            <tr>
                <td>
                    <input defaultValue={this.state.data.name} 
                        onChange={evt => this.modifications.name = evt.target.value}/>
                </td>
                <td>
                    <input type="number" defaultValue={this.state.data.count} 
                        onChange={evt => this.modifications.count = Number.parseInt(evt.target.value)}/>
                </td>
                <td><button onClick={() => this.saveEdits()}>save</button></td>
                <td><button onClick={() => this.switchToMode(InventoryItemMode.NORMAL)}>discard</button></td>
            </tr>
        )
    }

    deleteMode() {
        return (
            <tr>
                <td>
                    Deletion Comment:
                </td>
                <td>
                    <input onChange={evt => this.deletion_comment = evt.target.value}/>
                </td>
                <td><button onClick={() => this.deleteItem()}>delete</button></td>
                <td><button onClick={() => this.switchToMode(InventoryItemMode.NORMAL)}>discard</button></td>
            </tr>
        )
    }

    switchToMode(mode: InventoryItemMode) {
        let state = {...this.state}
        state.mode = mode
        
        this.setState(state)
    }

    saveEdits() {
        let mods: MutableInventoryItemData = {
            name: "",
            count: 0
        }
        let modified = false

        if (this.modifications.name !== this.state.data.name) {
            mods.name = this.modifications.name
            modified = true
        }

        if (this.modifications.count !== this.state.data.count) {
            mods.count = this.modifications.count
            modified = true
        }

        if (modified) {
            fetch(`/inventory/item/existing/${this.state.data.id}`,
                { 
                    method: "PUT",
                    body: JSON.stringify(mods),
                    headers: { 'Content-Type': 'application/json' }
                }
            )
            .then((response: any) => {
                if (response.ok) {
                    let state = {...this.state}
                    state.mode = InventoryItemMode.NORMAL
                    state.data.name = this.modifications.name ?? state.data.name
                    state.data.count = this.modifications.count ?? state.data.count

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
        fetch(`/inventory/item/existing/${this.state.data.id}`,
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
            <table className="table-data-any">
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Item Count</th>
                        <th>Deletion comment</th>
                        <th>
                            <button onClick={() => this.props.onReloadRequest()}>
                                reload
                            </button>
                        </th>
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
            </React.StrictMode>
        )
    }
}

class DeletedInventoryItem extends React.Component {
    props: {data: DeletedInventoryItemData, onDelete: Function, onErrorResponse: Function}

    render() {
        return (
            <tr>
                <td>{this.props.data.name}</td>
                <td>{this.props.data.count}</td>
                <td>{this.props.data.comment}</td>
                <td><button onClick={() => this.restore()}>restore</button></td>
            </tr>
        )
    }

    restore() {
        fetch(`/inventory/item/existing/${this.props.data.id}`,
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
