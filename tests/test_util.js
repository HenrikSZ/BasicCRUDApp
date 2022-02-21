export function clearTables(dbPromise) {
    return dbPromise.query("DELETE FROM shipments")
        .then(() => {
            return dbPromise.query("DELETE FROM item_assignments WHERE assigned_count < 0")
        })
        .then(() => {
            return dbPromise.query("DELETE FROM item_assignments WHERE assigned_count > 0")
        })
        .then(() => {
            return dbPromise.query("DELETE FROM external_item_assignments")
        })
        .then(() => {
            return dbPromise.query("DELETE FROM items")
        })
        .then(() => {
            return dbPromise.query("DELETE FROM deletions")
        })
}
