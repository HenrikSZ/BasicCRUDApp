import ReactDOM from "react-dom"
import React from "react"
import "./styles_v1.css"


class App extends React.Component {
    render() {
        return <React.StrictMode><InventoryTable /></React.StrictMode>
    }
}


class InventoryTable extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            entries: []
        }
    }

    render() {
        return (
            <React.StrictMode>
            <table id="table-data" className="table-data-any">
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Item Count</th>
                        <th></th>
                        <th>
                            <button>
                                reload
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {
                        this.state.entries.map((item) => {
                            return <InventoryItem data={item} key={item.id} />
                        })
                    }
                </tbody>
            </table>
            </React.StrictMode>
        )
    }

    componentDidMount() {
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
            modifications: {
                name: props.data.name,
                count: props.data.count
            },
            deletion_comment: ""
        }
    }

    render() {
        switch (this.state.mode) {
            case "edit":
                return this.editMode()
            default:
                return this.normalMode()
        }
    }

    normalMode() {
        return (
            <tr>
                <td>{this.state.data.name}</td>
                <td>{this.state.data.count}</td>
                <td><button onClick={this.switchToEditMode.bind(this)}>edit</button></td>
                <td><button>delete</button></td>
            </tr>
        )
    }

    editMode() {
        return (
            <tr>
                <td>
                    <input value={this.state.modifications.name} 
                        onChange={this.modifyName.bind(this)}/>
                </td>
                <td>
                    <input type="number" value={this.state.modifications.count} 
                        onChange={this.modifyCount.bind(this)}/>
                </td>
                <td><button onClick={this.saveEdits.bind(this)}>save</button></td>
                <td><button onClick={this.switchToNormalMode.bind(this)}>discard</button></td>
            </tr>
        )
    }

    modifyCount(evt) {
        let state = {...this.state}
        state.modifications.count = evt.target.value
        
        this.setState(state)
    }

    modifyName(evt) {
        let state = {...this.state}
        state.modifications.name = evt.target.value
        
        this.setState(state)
    }

    switchToNormalMode() {
        let state = {...this.state}
        state.mode = "normal"
        
        this.setState(state)
    }

    switchToEditMode() {
        let state = {...this.state}
        state.mode = "edit"

        this.setState(state)
    }

    saveEdits() {
        let mods = {}
        let modified = false

        if (this.state.modifications.name !== this.state.data.name) {
            mods.name = this.state.modifications.name
            modified = true
        }

        if (this.state.modifications.count !== this.state.data.count) {
            mods.count = Number.parseInt(this.state.modifications.count)
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
                this.setState({
                    mode: "normal",
                    data: {
                        name: this.state.modifications.name,
                        count: this.state.modifications.count,
                        id: this.state.data.id
                    },
                    modifications: {
                        name: this.state.modifications.name,
                        count: this.state.modifications.count
                    }
                })
            })
        } else {
            this.switchToNormalMode()
        }
    }
}

ReactDOM.render(<App />, document.getElementById("app"))
