import express from "express"
import ShipmentModel from "../models/ShipmentModel.js"
import dbPromise from "../db.js"

const router = express.Router()
export let model = new ShipmentModel(dbPromise)

export default router
