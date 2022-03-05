export async function clearTables(dbPromise) {
    await dbPromise.query("DELETE FROM shipments")
    await dbPromise.query("DELETE FROM item_assignments WHERE assigned_count < 0")
    await dbPromise.query("DELETE FROM item_assignments WHERE assigned_count > 0")
    await dbPromise.query("DELETE FROM external_item_assignments")
    await dbPromise.query("DELETE FROM items")
    await dbPromise.query("DELETE FROM deletions")
}
