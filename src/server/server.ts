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

import Fastify from "fastify"
import ExpressPlugin from "fastify-express"
import FastifyStatic from "fastify-static"


import itemsRouter from "./routes/items.js"
import shipmentsRouter from "./routes/shipments.js"
import logger from "./logger.js"


const app = Fastify()
await app.register(ExpressPlugin)
await app.register(FastifyStatic)

app.use("/items", itemsRouter)
app.use("/shipments", shipmentsRouter)

const port = process.env.PORT
await app.listen(port)
logger.info(`Started web server listening on port ${port}`)
