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
            this.state.entries = data
            this.forceUpdate()
        })
    }
}


class InventoryItem extends React.Component {
    render() {
        return (
            <tr>
                <td>{this.props.data.name}</td>
                <td>{this.props.data.count}</td>
                <td><button>edit</button></td>
                <td><button>delete</button></td>
            </tr>
        )
    }
}

ReactDOM.render(<App />, document.getElementById("app"))
