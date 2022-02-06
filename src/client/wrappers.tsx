import React from "react"


export class Section extends React.Component {
    props: {
        children: React.ReactChild[] | React.ReactChild
    }

    render() {
        return (
            <div className="m-4 p-4 border-2 border-slate-400 rounded-md max-w-max">
                {this.props.children}
            </div>
        )
    }
}
