import sinon from "sinon"

import mockPinoLogger from "../pino/logger.js"


export default function mock() {
    const mockObj = {}
    mockObj.status = sinon.stub().returns(mockObj)
    mockObj.send = sinon.stub().returns(mockObj)
    mockObj.header = sinon.stub().returns(mockObj)
    mockObj.log = mockPinoLogger()

    return mockObj
}
