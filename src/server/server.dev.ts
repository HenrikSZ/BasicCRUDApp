/**
 * Center of operations
 *
 * dotenv at the top so that environment variables are set when needed
 */

import path from "path"
import { fileURLToPath } from 'url'
import webpack from 'webpack'
import webpackDevMiddleware, { Configuration } from 'webpack-dev-middleware'

// @ts-ignore
import webpackHotMiddleware from "webpack-hot-middleware"

// @ts-ignore
import config from '../webpack.dev.config.js'


// @ts-ignore
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


const app = Fastify({ logger: true })
// @ts-ignore
await app.register(ExpressPlugin)
const compiler = webpack(config as Configuration)

app.use("/items", itemsRouter)
app.use("/shipments", shipmentsRouter)

app.use(webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath
}))
// @ts-ignore
app.use(webpackHotMiddleware(compiler))
app.get('/', (req, res) => {
    compiler.outputFileSystem.readFile("/index.html", (err, result) => {
        res.send(result)
    })
})

const port = process.env.PORT
// @ts-ignore
await app.listen(port)
logger.info(`Started web server listening on port ${port}`)

