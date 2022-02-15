import React, { ReactChild } from "react"

import "./index.css"


export class RibbonButton extends React.Component {
    props: {
        children: ReactChild,
        isActive: boolean,
        onClick: Function
    }

    render() {
        return (this.props.isActive) ? (
            <span className="border-b-4 ml-4 mr-4 pb-1
                font-bold text-xl
                border-orange-600 cursor-pointer">
                {this.props.children}
            </span>
        ) : (
            <span className="border-white border-b-4 ml-4 mr-4 pb-1
                font-bold text-xl
                hover:border-slate-700 cursor-pointer"
                onClick={() => this.props.onClick()}>
                {this.props.children}
            </span>
        )
    }
}


export class SideRibbonButton extends React.Component {
    props: {
        children: ReactChild,
        isActive: boolean,
        onClick: Function
    }

    render() {
        return (this.props.isActive) ? (
            <div className="border-l-4 m-4 pl-1
                font-bold text-2xl
                border-orange-600 cursor-pointer">
                {this.props.children}
            </div>
        ) : (
            <div className="border-white border-l-4 m-4 pl-1
                font-bold text-2xl
                hover:border-slate-700 cursor-pointer"
                onClick={() => this.props.onClick()}>
                {this.props.children}
            </div>
        )
    }
}


export class ConfirmationButton extends React.Component {
    props: {
        onClick: Function,
        children: ReactChild | ReactChild[]
    }

    render() {
        return  (
            <button className="bg-blue-800 text-gray-100 border-white p-1 pl-4 pr-4 rounded-lg hover:transition-all border-2
                hover:border-green-800 hover:bg-green-300 hover:text-green-800
                focus-visible:border-green-800 focus-visible:bg-green-300 focus-visible:text-green-800"
                onClick={() => this.props.onClick()}>
                {this.props.children}
            </button>
        )
    }
}


export class DangerButton extends React.Component {
    props: {
        onClick: Function,
        children: ReactChild | ReactChild[]
    }

    render() {
        return  (
            <button className="bg-blue-800 text-gray-100 border-white p-1 pl-4 pr-4 rounded-lg hover:transition-all border-2
                hover:border-red-800 hover:bg-red-300 hover:text-red-800
                focus-visible:border-red-800 focus-visible:bg-red-300 focus-visible:text-red-800"
                onClick={() => this.props.onClick()}>
                {this.props.children}
            </button>
        )
    }
}

let normalDropDownCss = "-rotate-90 transition"
let activeDropdownCss = "transition"

export class DropdownButton extends React.Component {
    state: { css: string, active: boolean }
    props: { onExpand: Function, onRetract: Function }


    constructor(props: { onExpand: Function, onRetract: Function }) {
        super(props)

        this.state = { css: normalDropDownCss, active: false }
    }

    render() {
        return (
            <button className={this.state.css} onClick={() => this.toggleActive()}>
                &#9660;
            </button>
        )
    }

    toggleActive() {
        let state = {...this.state}
        state.active = !state.active

        if (state.active) {
            state.css = activeDropdownCss
            this.props.onExpand()
        } else {
            state.css = normalDropDownCss
            this.props.onRetract()
        }

        this.setState(state)

    }
}

export class ExportButton extends React.Component {
    props: {
        link: string,
        children: React.ReactChild | React.ReactChild[]
    }

    render() {
        return (
            <ConfirmationButton onClick={() => this.exportCsv()}>
                {this.props.children}
            </ConfirmationButton>
        )
    }
    

    exportCsv() {
        let frame = document.getElementById("download-frame") as HTMLIFrameElement
        frame.src = this.props.link + "/export"
    }
}
