import express from "express"
import ShipmentModel from "../models/ShipmentModel.js"
import ShipmentController from "../controllers/ShipmentController.js"
import { itemIdMiddleware } from "../controllers/shared_middleware.js"
import dbPromise from "../db.js"

const router = express.Router()
const model = new ShipmentModel(dbPromise)
const contr = new ShipmentController(model)

router.get("/", contr.getAllShipments.bind(contr))
router.get("/export", contr.exportShipmentsAsCsv.bind(contr))

router.use("/shipment/new", contr.createShipmentMiddleware.bind(contr))
router.put("/shipment/new", contr.createShipment.bind(contr))

router.use("/shipment/existing/:shipmentId", contr.shipmentIdMiddleware.bind(contr))
router.use("/shipment/existing/:shipmentId/:itemId", itemIdMiddleware.bind(contr))
router.get("/shipment/existing/:shipmentId", contr.getShipment.bind(contr))
router.delete("/shipment/existing/:shipmentId", contr.deleteShipment.bind(contr))
router.delete("/shipment/existing/:shipmentId/:itemId", contr.deleteShipmentItem.bind(contr))


export default router
