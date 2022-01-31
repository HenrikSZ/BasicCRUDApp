import ReactDOM from "react-dom"
import React from "react"
import "./styles_v1.css"


class App extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            mode: "normal"
        }
    }

    switchToMode(mode) {
        let state = {...this.state}
        state.mode = mode

        this.setState(state)
    }

    render() {
        return (
            <React.StrictMode>
                <ItemCreator onItemCreation={() => this.forceUpdate()}/>
                {this.getSwitchButton()}
                {this.getActiveTable()}
            </React.StrictMode>
        )
    }

    getSwitchButton() {
        switch (this.state.mode) {
            case "deleted":
                return <button onClick={() => this.switchToMode("normal")}>to normal</button>
            default:
                return <button onClick={() => this.switchToMode("deleted")}>to deleted</button>
        }
    }

    getActiveTable() {
        switch (this.state.mode) {
            case "deleted":
                return <DeletedInventoryTable/>
            default:
                return <InventoryTable/>
        }
    }
}


class ItemCreator extends React.Component {
    constructor(props) {
        super(props)

        this.newValues = {}
    }

    render() {
        return (
            <table>
                <thead>
                    <tr>
                        <th>
                            New Name
                        </th>
                        <th>
                            New Count
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <input onChange={evt => this.newValues.name = evt.target.value}/>
                        </td>
                        <td>
                            <input type="number" onChange={evt => this.newValues.count = evt.target.value}/>
                        </td>
                        <td>
                            <button onClick={() => this.saveNew()}>
                                Add
                            </button>
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
                    method: "PUT",
                    body: JSON.stringify(this.newValues),
                    headers: { 'Content-Type': 'application/json' }
                }
            )
            .then(() => {
                this.props.onItemCreation()
            })
        }
    }
}


class InventoryTable extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            entries: []
        }
    }

    removeDeletedEntry(id) {
        let state = {...this.state}
        let removeIndex = state.entries.findIndex((item) => {
            return item.id == id
        })

        state.entries.splice(removeIndex, 1)

        this.setState(state)
    }

    render() {
        return (
            <React.StrictMode>
            <table className="table-data-any">
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Item Count</th>
                        <th></th>
                        <th>
                            <button onClick={() => this.loadEntries()}>
                                reload
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {
                        this.state.entries.map((item) => {
                            return <InventoryItem data={item} key={item.id}
                                onDelete={(id) => this.removeDeletedEntry(id)}/>
                        })
                    }
                </tbody>
            </table>
            </React.StrictMode>
        )
    }

    componentDidMount() {
        this.loadEntries()
    }

    loadEntries() {
        fetch("/inventory")
        .then((response) => response.json())
        .then((data) =>{
            this.setState({ entries: data })
        })
    }
}


class InventoryItem extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            mode: "normal",
            data: props.data,
        }

        this.modifications = {}
        this.deletion_comment = ""

        this.removeDeletedEntry = props.removeDeletedEntry
    }

    render() {
        switch (this.state.mode) {
            case "edit":
                return this.editMode()
            case "delete":
                return this.deleteMode()
            default:
                return this.normalMode()
        }
    }

    normalMode() {
        return (
            <tr>
                <td>{this.state.data.name}</td>
                <td>{this.state.data.count}</td>
                <td><button onClick={() => this.switchToMode("edit")}>edit</button></td>
                <td><button onClick={() => this.switchToMode("delete")}>delete</button></td>
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
                        onChange={evt => this.modifications.count = evt.target.value}/>
                </td>
                <td><button onClick={() => this.saveEdits()}>save</button></td>
                <td><button onClick={() => this.switchToMode(normal)}>discard</button></td>
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
                <td><button onClick={() => this.switchToMode("normal")}>discard</button></td>
            </tr>
        )
    }

    switchToMode(mode) {
        let state = {...this.state}
        state.mode = mode
        
        this.setState(state)
    }

    saveEdits() {
        let mods = {}
        let modified = false

        if (this.modifications.name !== this.state.data.name) {
            mods.name = this.modifications.name
            modified = true
        }

        if (this.modifications.count !== this.state.data.count) {
            mods.count = Number.parseInt(this.modifications.count)
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
            .then(() => {
                let state = {...this.state}
                state.mode = "normal"
                state.data.name = this.modifications.name ?? state.data.name
                state.data.count = this.modifications.count ?? state.data.count

                this.setState(state)
            })
        } else {
            this.switchToMode("normal")
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
        .then(() => {
            this.props.onDelete(this.state.data.id)
        })
    }
}


class DeletedInventoryTable extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            entries: []
        }
    }

    removeRestoredEntry(id) {
        let state = {...this.state}
        let removeIndex = state.entries.findIndex((item) => {
            return item.id == id
        })

        state.entries.splice(removeIndex, 1)

        this.setState(state)
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
                            <button onClick={() => this.loadEntries()}>
                                reload
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {
                        this.state.entries.map((item) => {
                            return <DeletedInventoryItem data={item} key={item.id}
                                onDelete={id => this.removeRestoredEntry(id)}/>
                        })
                    }
                </tbody>
            </table>
            </React.StrictMode>
        )
    }

    componentDidMount() {
        this.loadEntries()
    }

    loadEntries() {
        fetch("/inventory/deleted")
        .then((response) => response.json())
        .then((data) =>{
            this.setState({ entries: data })
        })
    }
}


class DeletedInventoryItem extends React.Component {
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
        .then(() => {
            this.props.onDelete(this.props.data.id)
        }) 
    }
}


ReactDOM.render(<App />, document.getElementById("app"))
