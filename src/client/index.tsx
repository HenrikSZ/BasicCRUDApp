import ReactDOM from "react-dom"
import React from "react"

import "./index.css"
import { Inventory } from "./inventory"



if(module.hot) {
    module.hot.accept() // eslint-disable-line no-undef  
}


enum AppMode {
    INVENTORY
}

interface ErrorMessage {
    name: string,
    message: string
}


class App extends React.Component {
    state: {
        mode: AppMode,
        errors: Array<ErrorMessage>
    }

    constructor(props: any) {
        super(props)

        this.state = {
            mode: AppMode.INVENTORY,
            errors: []
        }
    }

    switchToMode(mode: AppMode) {
        let state = {...this.state}
        state.mode = mode

        this.setState(state)
    }

    render() {
        return (
            <React.StrictMode>
                {
                    this.state.errors.map((error, index) => {
                        return <ErrorBox errorMessage={error} key={index} id={index}
                            onDismissal={(id: number) => this.removeErrorMessage(id)}/>
                    })
                }
                {
                    (this.state.mode == AppMode.INVENTORY) ? (
                        <Inventory onErrorResponse={(response: any) => this.onErrorResponse(response)}/>
                    ) : null
                }
               
            </React.StrictMode>
        )
    }

    onErrorResponse(response: any) {
        response.json()
        .then((errorMessage: ErrorMessage) => {
            let state = {...this.state}
            state.errors.push(errorMessage)

            this.setState(state)
        })
    }

    removeErrorMessage(id: number) {
        let state = {...this.state}
        state.errors.splice(id, 1)

        this.setState(state)
    }
}

class ErrorBox extends React.Component {
    props: {
        errorMessage: ErrorMessage,
            id: number,
            onDismissal: Function
        }

    render() {
        return (
            <div className="w-10/12 bg-red-300 m-2">
                <button className="text-red-700 font-bold text-xl p-2 pt-1 pb-1"
                    onClick={() => this.props.onDismissal(this.props.id)}>
                    X
                </button>
                <span className="m-1">
                    <span className="font-bold text-red-700">
                        {this.props.errorMessage.name}
                    </span>
                    <span>
                        {this.props.errorMessage.message}
                    </span>
                </span>
            </div>
        )
    }
}


ReactDOM.render(<App />, document.getElementById("app"))
