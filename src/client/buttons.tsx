import React from "react"

import "./index.css"


export class RibbonButton extends React.Component {
    props: {
        label: string,
        isActive: boolean,
        onClick: Function
    }

    render() {
        return (this.props.isActive) ? (
            <span className="border-b-4 ml-4 mr-4 pb-1
                font-bold text-xl
                border-blue-800 cursor-pointer">
                {this.props.label}
            </span>
        ) : (
            <span className="border-white border-b-4 ml-4 mr-4 pb-1
                font-bold text-xl
                hover:border-green-800 cursor-pointer"
                onClick={() => this.props.onClick()}>
                {this.props.label}
            </span>
        )
    }
}

export class ConfirmationButton extends React.Component {
    props: {
        label: string,
        onClick: Function
    }

    render() {
        return  (
            <button className="bg-blue-800 text-gray-100 border-white p-1 pl-4 pr-4 rounded-lg hover:transition-all border-2
                hover:border-green-800 hover:bg-green-400 hover:text-green-800
                focus-visible:border-green-800 focus-visible:bg-green-400 focus-visible:text-green-800"
                onClick={() => this.props.onClick()}>
                {this.props.label}
            </button>
        )
    }
}