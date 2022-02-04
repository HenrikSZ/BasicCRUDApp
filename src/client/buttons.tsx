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
                border-blue-800 cursor-pointer">
                {this.props.children}
            </span>
        ) : (
            <span className="border-white border-b-4 ml-4 mr-4 pb-1
                font-bold text-xl
                hover:border-green-800 cursor-pointer"
                onClick={() => this.props.onClick()}>
                {this.props.children}
            </span>
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


export class ExportButton extends React.Component {
    props: {
        link: string,
        children: React.ReactChild | React.ReactChild[]
    }

    render() {
        return (
            <ConfirmationButton onClick={() => {this.exportAsCsv()}}>
                {this.props.children}
            </ConfirmationButton>
        )
    }

    exportAsCsv() {
        let fullLink = this.props.link + "/export.csv"
        fetch(fullLink)
    }
}
