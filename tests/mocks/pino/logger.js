import sinon from "sinon"


export default function mock() {
    return {
        debug: sinon.stub(),
        info: sinon.stub(),
        warn: sinon.stub(),
        fatal: sinon.stub()
    }
}
