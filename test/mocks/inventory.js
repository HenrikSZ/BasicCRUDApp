import sinon from "sinon"


function mockInventoryModel(values) {
    return {
        getAllItems: sinon.mock().resolves([values.allItems, {}]),
        getItem: sinon.mock().resolves([values.item, {}]),
        getDeletionId: sinon.mock().resolves([[{deletionId: values.deletionId}],{}]),
        insertItem: sinon.mock().resolves([{}, values.insertResponse]),
        updateItem: sinon.mock().resolves([{}, values.updateResponse])
    }
}

export { mockInventoryModel }
