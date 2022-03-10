import React from "react"

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
import ReactTooltip from "react-tooltip"
import { ItemAPI } from "./api/items"
import { InventoryItem, DeletedInventoryItem, IUpdateItem, ICreateItem }
    from  "../types/items"


enum InventoryMode {
    NORMAL,
    DELETED
}


export enum InventoryItemMode  {
    NORMAL,
    EDIT,
    DELETE
}


export class ItemView extends React.Component {
    state: {
        mode: InventoryMode,
        entries: InventoryItem[],
        deletedEntries: DeletedInventoryItem[]
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
                        All
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
                entries: InventoryItem[],
                deletedEntries: DeletedInventoryItem[]
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
        ItemAPI.getDeletedItems()
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
        return ItemAPI.getItems()
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
    newValues: ICreateItem
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
                                        this.newValues.count =
                                        Number.parseInt(evt.target.value)}/>
                            </td>
                            <td>
                                <ConfirmationButton onClick={() => this.saveNew()}>
                                    Create
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
            ItemAPI.createItem(this.newValues)
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
        entries: Array<InventoryItem>,
        onReloadRequest: Function,
        onItemDelete: Function,
        onErrorResponse: Function
    }

    render() {
        return (
            <React.StrictMode>
                <Section>
                    <div className="flex flex-row">
                        <div className="text-xl font-bold">Items</div>
                        <div className="ml-auto pr-1 pl-1">
                            <ExportButton link="/items"/>
                        </div>
                        <div className="pr-1 pl-1">
                            <ReloadButton onClick={() => this.props.onReloadRequest()}/>
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
                                this.props.entries.map((item) => {
                                    return <InventoryItemView data={item} key={item.id}
                                        onDelete={(id: number) =>
                                            this.props.onItemDelete(id)}
                                        onErrorResponse={(response: any) =>
                                            this.props.onErrorResponse(response)}/>
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


export class InventoryItemView extends React.Component {
    modifications: IUpdateItem
    deletion_comment: string
    state: { mode: InventoryItemMode, data: InventoryItem }
    props:  { data: InventoryItem, onDelete: Function, onErrorResponse: Function }


    constructor(props:  { data: InventoryItem, onDelete: Function, onErrorResponse: Function }) {
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
                    <EditButton onClick={() => this.switchToMode(InventoryItemMode.EDIT)}/>
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <DeleteButton onClick={() => this.switchToMode(InventoryItemMode.DELETE)}/>
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
                    <BackButton onClick={() => this.switchToMode(InventoryItemMode.NORMAL)}/>
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <SaveButton onClick={() => this.saveEdits()}/>
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
                    <BackButton onClick={() => this.switchToMode(InventoryItemMode.NORMAL)}/>
                </td>
                <td className="border-2 border-gray-700 p-2">
                    <DeleteButton onClick={() => this.deleteItem()}/>
                </td>
            </tr>
        )
    }

    componentDidUpdate() {
        ReactTooltip.hide()
        ReactTooltip.rebuild()
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
            ItemAPI.updateItem(this.props.data.id, this.modifications)
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
        ItemAPI.deleteItem(this.state.data.id, this.deletion_comment)
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
        entries: DeletedInventoryItem[],
        onReloadRequest: Function,
        onItemRestore: Function,
        onErrorResponse: Function
    }

    constructor(props: {
        entries: DeletedInventoryItem[],
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
                        <div className="flex flex-row">
                            <div className="text-xl font-bold">Deleted Items</div>
                            <div className="ml-auto pr-1 pl-1">
                                <ExportButton link="/items/deleted"/>
                            </div>
                            <div className="pr-1 pl-1">
                               <ReloadButton onClick={() => this.props.onReloadRequest()}/>
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
                                    this.props.entries.map((item) => {
                                        return <DeletedInventoryItemView data={item} key={item.id}
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

class DeletedInventoryItemView extends React.Component {
    props: {data: DeletedInventoryItem, onDelete: Function, onErrorResponse: Function}

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
        ItemAPI.restoreItem(this.props.data.id)
        .then((response: any) => {
            if (response.ok)
                this.props.onDelete(this.props.data.id)
            else
                this.props.onErrorResponse(response)
        })
    }
}
