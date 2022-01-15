import dotenv from "dotenv"
dotenv.config()

import express from "express"
import bodyParser from "body-parser"
import path from "path"
import InventoryController from "./inventory"
import logger from "./logger"


const app = express()
const inventoryController = new InventoryController()

app.use(bodyParser.json())
app.use("/inventory", inventoryController.router)
app.use(express.static(path.resolve(__dirname, "..", "public")))

const port = process.env.PORT
app.listen(port, () => {
    logger.info(`Started web server listening on port ${port}`)
})
