import sinon from "sinon"
 
 
export default function mock(values = {}) {
    return {
        insert: sinon.mock().resolves(values.insertId),
        delete: sinon.mock().resolves(values.deleteId)
    }
}
 