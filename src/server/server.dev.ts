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

import express from "express"
import bodyParser from "body-parser"

import inventory from "./routes/inventory.js"
import logger from "./logger.js"


const app = express()
const compiler = webpack(config as Configuration)

app.use(bodyParser.json())
app.use("/inventory", inventory)

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
app.listen(port, () => {
    logger.info(`Started web server listening on port ${port}`)
})
