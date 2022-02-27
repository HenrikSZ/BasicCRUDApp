import sinon from "sinon"


export default function mock(options = {}) {
    return {
        params: options.params,
        body: options.body
    }
}
