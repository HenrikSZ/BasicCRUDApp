/**
 * Center of operations
 *
 * dotenv at the top so that environment variables are set when needed
 */


import dotenv from "dotenv"
dotenv.config()

import express from "express"
import bodyParser from "body-parser"
import path from "path"
import inventory from "./inventory"
import logger from "./logger"


const app = express()

app.use(bodyParser.json())
app.use("/inventory", inventory)
app.use(express.static(path.resolve(__dirname, "public")))

const port = process.env.PORT
app.listen(port, () => {
    logger.info(`Started web server listening on port ${port}`)
})
