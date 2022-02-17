import express from "express"
import ShipmentModel from "../models/ShipmentModel.js"
import ShipmentController from "../controllers/ShipmentController.js"
import dbPromise from "../db.js"

const router = express.Router()
const model = new ShipmentModel(dbPromise)
const contr = new ShipmentController(model)

router.get("/", contr.getAllShipments.bind(contr))

router.use("/shipment/new", contr.createShipmentMiddleware.bind(contr))
router.put("/shipment/new", contr.createShipment.bind(contr))

router.use("/shipment/existing/:id", contr.shipmentIdMiddleware.bind(contr))
router.get("/shipment/existing/:id", contr.getShipment.bind(contr))
router.delete("/shipment/existing/:id", contr.deleteShipment.bind(contr))


export default router
