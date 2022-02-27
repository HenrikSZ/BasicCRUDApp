import sinon from "sinon"


export default function mock() {
    const mockObj = {}
    mockObj.status = sinon.stub().returns(mockObj)
    mockObj.send = sinon.stub().returns(mockObj)
    mockObj.header = sinon.stub().returns(mockObj)

    return mockObj
}
