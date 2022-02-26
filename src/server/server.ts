/**
 * Center of operations
 *
 * dotenv at the top so that environment variables are set when needed
 */


import dotenv from "dotenv"
dotenv.config()

import Fastify from "fastify"
import ExpressPlugin from "fastify-express"
import FastifyStatic from "fastify-static"


import itemRoutes from "./routes/items.js"
import shipmentRoutes from "./routes/shipments.js"
import logger from "./logger.js"


const app = Fastify()
await app.register(ExpressPlugin)
await app.register(FastifyStatic)

app.register(itemRoutes)
app.register(shipmentRoutes)

const port = process.env.PORT
await app.listen(port)
logger.info(`Started web server listening on port ${port}`)
