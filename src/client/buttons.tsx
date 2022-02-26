import React, { ReactChild } from "react"
import { CgExport } from "react-icons/cg"
import { IoReload } from "react-icons/io5"
import { FiEdit2, FiSave } from "react-icons/fi"
import { RiDeleteBin5Line } from "react-icons/ri"
import { GrUndo } from "react-icons/gr" 
import { MdOutlineRestoreFromTrash } from "react-icons/md"

import "./index.css"
import ReactTooltip from "react-tooltip"


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
        link: string
    }

    render() {
        return (
            <GenericButton onClick={() => this.exportCsv()} tooltip="Export as CSV">
                <CgExport size="1.75em"/>
            </GenericButton>
        )
    }
        
    exportCsv() {
        let frame = document.getElementById("download-frame") as HTMLIFrameElement
        frame.src = this.props.link + "/export"
    }
}


export class ReloadButton extends React.Component {
    props: {
        onClick: Function
    }

    render() {
        return (
            <GenericButton onClick={() => this.props.onClick()} tooltip="Reload">
                <IoReload size="1.75em"/>
            </GenericButton>
        )
    }
}


export class EditButton extends React.Component {
    props: {
        onClick: Function
    }

    render() {
        return (
            <GenericButton onClick={this.props.onClick} tooltip="Edit">
                <FiEdit2 size="1.75em"/>
            </GenericButton>
        )
    }
}


export class DeleteButton extends React.Component {
    props: {
        onClick: Function
    }

    render() {
        return (
            <GenericButton onClick={this.props.onClick} tooltip="Delete">
                <RiDeleteBin5Line size="1.75em"/>
            </GenericButton>
        )
    }
}


export class BackButton extends React.Component {
    props: {
        onClick: Function
    }

    render() {
        return (
            <GenericButton onClick={this.props.onClick} tooltip="Back">
                <GrUndo size="1.75em"/>
            </GenericButton>
        )
    }
}


export class SaveButton extends React.Component {
    props: {
        onClick: Function
    }

    render() {
        return (
            <GenericButton onClick={this.props.onClick} tooltip="Save">
                <FiSave size="1.75em"/>
            </GenericButton>
        )
    }
}

export class RestoreButton extends React.Component {
    props: {
        onClick: Function
    }

    render() {
        return (
            <GenericButton onClick={this.props.onClick} tooltip="Restore">
                <MdOutlineRestoreFromTrash size="1.75em"/>
            </GenericButton>
        )
    }
}

export class GenericButton extends React.Component {
    props: {
        onClick: Function,
        tooltip: string,
        children: React.ReactChild | React.ReactChild[]
    }

    render() {
        return (
            <div data-tip={this.props.tooltip}
                className="p-1 cursor-pointer hover:bg-orange-400 active:bg-slate-500 rounded-md"
                    onClick={() => this.props.onClick()}>
                {this.props.children}
            </div>
        )
    }

    componentDidUpdate() {
        ReactTooltip.rebuild()
    }
}


export class PlusButton extends React.Component {
    props: {
        onClick: Function
    }

    render() {
        return  (
            <button className="bg-blue-800 text-gray-100 border-white rounded-lg hover:transition-all border-2
                hover:border-green-800 hover:bg-green-300 hover:text-green-800
                focus-visible:border-green-800 focus-visible:bg-green-300 focus-visible:text-green-800
                text-3xl p-1 pr-2 pl-2 pt-0"
                onClick={() => this.props.onClick()}>
                +
            </button>
        )
    }
}


export class MinusButton extends React.Component {
    props: {
        onClick: Function
    }

    render() {
        return  (
            <button className="bg-blue-800 text-gray-100 border-white rounded-lg hover:transition-all border-2
                hover:border-red-800 hover:bg-red-300 hover:text-red-800
                focus-visible:border-red-800 focus-visible:bg-red-300 focus-visible:text-red-800
                text-xl font-bold p-2 pr-3 pl-3 pt-0 pb-1"
                onClick={() => this.props.onClick()}>
                -
            </button>
        )
    }
}
