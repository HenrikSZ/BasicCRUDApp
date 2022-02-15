import express from "express"
import ItemModel from "../models/ItemModel.js"
import DeletionModel from "../models/DeletionModel.js"
import InventoryController from "../controllers/InventoryController.js"


const router = express.Router()
const itemModel = new ItemModel()
const delModel = new DeletionModel()
const invContr = new InventoryController(itemModel, delModel)


router.get("/", invContr.getInventory.bind(invContr))
router.get("/deleted", invContr.getDeletedInventory.bind(invContr))
router.get("/export", invContr.exportInventoryAsCsv.bind(invContr))
router.get("/deleted/export", invContr.exportDeletedInventoryAsCsv.bind(invContr))

router.use("/item/new",
    invContr.newInventoryItemMiddleware.bind(invContr))
router.post("/item/new",
    invContr.postNewInventoryItem.bind(invContr))

router.use("/item/existing/:id",
    invContr.entryIdMiddleware.bind(invContr))
router.get("/item/existing/:id",
    invContr.getInventoryItem.bind(invContr))
router.put("/item/existing/:id",
    invContr.putExistingInventoryItem.bind(invContr))
router.delete("/item/existing/:id",
    invContr.deleteCommentMiddleware.bind(invContr),
    invContr.deleteInventoryItem.bind(invContr))

router.get("/item/like/:name",
    invContr.getItemLike.bind(invContr))


export default router
