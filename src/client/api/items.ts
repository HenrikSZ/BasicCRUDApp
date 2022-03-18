
export class ItemAPI {
    static createItem(newValues: any) {
        return fetch("/items/item/new",
            { 
                method: "POST",
                body: JSON.stringify(newValues),
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
    
    static async getItems() {
        return fetch("/items")
    }

    static getDeletedItems() {
        return fetch("/items/deleted")
    }

    static updateItem(itemId: number, modifications: any) {
        return fetch(`/items/item/existing/${itemId}`,
            { 
                method: "PUT",
                body: JSON.stringify(modifications),
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }

    static deleteItem(itemId: number, deletionComment: string) {
        return fetch(`/items/item/existing/${itemId}`,
            {
                method: "DELETE",
                body: JSON.stringify({ comment: deletionComment }),
                headers: { "Content-Type": "application/json" }
            }
        )
    }

    static restoreItem(itemId: number) {
        return fetch(`/items/item/deleted/${itemId}`,
            {
                method: "PUT"
            }
        )
    }

    static getItemLike(likeStr: string) {
        return fetch("/items/item/like/" + likeStr)
    } 
}