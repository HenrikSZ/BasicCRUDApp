/**
 * Center of operations
 *
 * dotenv at the top so that environment variables are set when needed
 */

import webpack from 'webpack'

// @ts-ignore
import config from '../webpack.dev.config.js'

import dotenv from "dotenv"
dotenv.config()

import Fastify from "fastify"

// @ts-ignore
import hotModuleReplacement from "fastify-webpack-hmr"


import itemRoutes from "./routes/items.js"
import shipmentRoutes from "./routes/shipments.js"
import logger from "./logger.js"


const app = Fastify({ logger: true })
const compiler = webpack(config)

// @ts-ignore
await app.register(itemRoutes) // @ts-ignore
await app.register(shipmentRoutes) // @ts-ignore
await app.register(hotModuleReplacement, { compiler })

const port = process.env.PORT
// @ts-ignore
await app.listen(port)
logger.info(`Started web server listening on port ${port}`)

