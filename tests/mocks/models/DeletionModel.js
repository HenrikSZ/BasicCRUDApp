import sinon from "sinon"
 
 
export default function mock(values = {}) {
    return {
        create: sinon.stub().resolves(values.insertId),
        delete: sinon.stub().resolves(values.wasDeleted)
    }
}
 