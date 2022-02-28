/**
 * Center of operations
 *
 * dotenv at the top so that environment variables are set when needed
 */


import dotenv from "dotenv"
dotenv.config()

import Fastify from "fastify"
import FastifyStatic from "fastify-static"

import itemRoutes from "./routes/items.js"
import shipmentRoutes from "./routes/shipments.js"
import { handleError } from "./errors.js"


const app = Fastify({
    logger: {
        level: process.env.LOG_LEVEL ?? "info",
        file: process.env.LOG_FILE ?? "basiccrudapp.log"
    }
})
app.setErrorHandler(handleError)
await app.register(FastifyStatic)

await app.register(itemRoutes)
await app.register(shipmentRoutes)

const port = process.env.PORT
await app.listen(port)
