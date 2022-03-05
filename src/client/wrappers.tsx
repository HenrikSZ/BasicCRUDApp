import React from "react"


export class Section extends React.Component {
    props: {
        children: React.ReactChild[] | React.ReactChild
    }

    render() {
        return (
            <div className="m-4 p-4 border-2 border-gray-400 rounded-md max-w-max min-w-min">
                {this.props.children}
            </div>
        )
    }
}
