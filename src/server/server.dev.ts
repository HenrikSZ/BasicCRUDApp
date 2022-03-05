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
import webpackDevMiddleware from "webpack-dev-middleware"
// @ts-ignore
import webpackHotMiddleware from "webpack-hot-middleware"

import middie from "middie"

import itemRoutes from "./routes/items.js"
import shipmentRoutes from "./routes/shipments.js"
import { handleError } from './errors.js'


const app = Fastify({
    logger: {
        level: process.env.LOG_LEVEL ?? "info",
        file: process.env.LOG_FILE ?? "basiccrudapp.log"
    }
})
app.setErrorHandler(handleError)
const compiler = webpack(config)

// @ts-ignore
await app.register(itemRoutes) // @ts-ignore
await app.register(shipmentRoutes) // @ts-ignore
await app.register(middie)
const dev = webpackDevMiddleware(compiler)
const hot = webpackHotMiddleware(compiler)
app.use(dev)
app.use(hot)

app.decorate('webpack',
    {
        compiler,
        dev,
        hot
    })
    .addHook('onClose', (app, next) => {
        dev.close(() => next)
    })

const port = process.env.PORT
const host = process.env.HOST ?? "0.0.0.0"
// @ts-ignore
await app.listen(port, host)
