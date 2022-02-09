/**
 * Center of operations
 *
 * dotenv at the top so that environment variables are set when needed
 */

import path from "path"
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import dotenv from "dotenv"
dotenv.config()

import express from "express"
import bodyParser from "body-parser"

import itemsRouter from "./routes/items.js"
import shipmentsRouter from "./routes/shipments.js"
import logger from "./logger.js"


const app = express()

app.use(bodyParser.json())
app.use("/items", itemsRouter)
app.use("/shipments", shipmentsRouter)
app.use(express.static(path.resolve(__dirname, "public")))

const port = process.env.PORT
app.listen(port, () => {
    logger.info(`Started web server listening on port ${port}`)
})
