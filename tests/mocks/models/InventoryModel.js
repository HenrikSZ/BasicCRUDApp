import sinon from "sinon"


export default function mock(values = {}) {
    return {
        getAllItems: sinon.mock().resolves(values.allItems),
        getItem: sinon.mock().resolves(values.item),
        getAllDeletedItems: sinon.mock().resolves(values.deletedItems),
        getDeletionId: sinon.mock().resolves(values.deletionId),
        insertItem: sinon.mock().resolves(values.insertId),
        updateItem: sinon.mock().resolves(values.updateId)
    }
}
