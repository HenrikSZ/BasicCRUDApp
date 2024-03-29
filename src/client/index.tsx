import ReactDOM from "react-dom"
import React from "react"
import ReactTooltip from "react-tooltip"

import "./index.css"
import { ItemView } from "./items"
import { ShipmentView } from "./shipments"
import { SideRibbonButton } from "./buttons"
import { Provider } from "react-redux"
import { store } from "./store"


if(module.hot) {
    module.hot.accept() // eslint-disable-line no-undef  
}


enum AppMode {
    INVENTORY,
    SHIPMENTS
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
                <ReactTooltip effect="solid" offset={{top: -5}}/>
                <div className="pl-2 pt-2 flex flex-row">
                    <nav className="float-left mt-16 mr-6">
                        <SideRibbonButton 
                                isActive={this.state.mode == AppMode.INVENTORY}
                                onClick={() => this.switchToMode(AppMode.INVENTORY)}>
                            Inventory
                        </SideRibbonButton>
                        <SideRibbonButton 
                                isActive={this.state.mode == AppMode.SHIPMENTS}
                                onClick={() => this.switchToMode(AppMode.SHIPMENTS)}>
                            Shipments
                        </SideRibbonButton>
                    </nav>
                    <div className="float-left">
                        {
                            this.state.errors.map((error, index) => {
                                return <ErrorBox errorMessage={error} key={index} id={index}
                                    onDismissal={(id: number) => this.removeErrorMessage(id)}/>
                            })
                        }
                        {
                            (this.state.mode == AppMode.INVENTORY) ? (
                                <ItemView/>
                            ) : (
                                <ShipmentView/>
                            )
                        }
                    </div>
                </div>
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
            <div className="bg-red-300 m-2">
                <button className="text-red-700 font-bold text-xl p-2 pt-1 pb-1"
                    onClick={() => this.props.onDismissal(this.props.id)}>
                    X
                </button>
                <span className="m-1">
                    <span className="font-bold text-red-700 mr-4">
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


ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById("app"))
